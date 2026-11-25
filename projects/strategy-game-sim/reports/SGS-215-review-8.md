# SGS-215 review (8)

- Branch `sgs-215-production-past-population-cap`, tip `ae9295276298cf29d0bcf2eabd3cc43815fdc4fd`, base `origin/main` @ 7d74800 (current; 87f0cd7 is its ancestor).
- Mode: full review (first review of this ticket).
- **Verdict: NEEDS_SPEC.** One criterion-6 row the ticket names cannot fail on its claim and already holds at the base. There is also one blocking text fix (below) for the implementer to apply with the re-spec rework.

## Spec gaps (NEEDS_SPEC)

1. **Criterion 6, the ENG 1TC 1800 s run.** Test: `lib/aoe4-build-order/simulate-population-limit.test.ts:144` "occur only before the cap on ENG 1TC at 1800 s".
   - **Why it cannot fail.** In ENG 1TC at 1800 s, no step ever waits on `population`, and no step is armed at or after the cap instant (1094.94 s). I probed this in the review scratch, at the tip and with `simulate.ts` and the build JSON reverted to 7d74800. In both runs the steps with `waitBreakdown.population > 0` were `[]` and 0 steps were armed after the cap. So the row passes at the base (old gate in both places). The only break that fails it is M14, and M14 fails the row's `populationCapReachedAt` not-null precondition (l.136), not the row's claim (l.139, l.141). The implementer's report says the same (Out-of-scope finding 3).
   - **Why the implementer cannot fix it.** The run is named by the ticket, so no setup can make this row fail on its claim. None of the other prebuilt builds at 1800 s can stand in. Council Hall's and Spear/Longbow's only population waits end at 273 s and 457 s, well before their cap instants. Knight/Longbow has one step armed after its cap, but it never waits on population.
   - **What the spec must decide.** Either drop "ENG 1TC at 1800 s" from criterion 6, so that the lowered-`maxPopCap` fixture row (l.149, which fails under M1) is the case, or replace it with a fixture where a `produce` step waits on population across the cap instant.
   - **Who decides.** The ticket author / spec-gate (manager re-spec).

## Blocking findings

1. `docs/aoe4-build-order.md:373-374` - contract (text). The new population-limit paragraph says that, once the limit lifts, "a `produce` step and an order payment skip the supply check and go on to their resource, building and busy checks". The code contradicts this:
   - The `produce` handler checks the building (a targeted instance exists) before the supply check (`simulate.ts:416-421`), not after it.
   - `payOrder` has no building check and no busy check after the supply check, only resources (`simulate.ts:624-634`).

   Why it matters: the model doc is authoritative, and this sentence states a check order the engine does not have.

   Direction: replace the sentence
   "From then on a `produce` step and an order payment skip the supply check and go on to their resource, building and busy checks, so no step waits on `population` and population grows past the cap while supply stays at it and no house is planned."
   with
   "From then on a `produce` step and an order payment skip only the supply check; every other check still applies, so no step waits on `population` and population grows past the cap while supply stays at it and no house is planned."

   Facts the replacement keeps: the lift holds from then on; it covers both a `produce` step and an order payment; they skip the supply check; their other checks still apply; no step waits on `population`; population grows past the cap; supply stays at the cap; no house is planned.

## Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | (respec 1) `hasPopulationRoom` exported; both gates use it; one unit test per gate | pass | `simulate.ts:364-369,420,624`. Population-limit l.53 (two-target produce at 0 s, fails under M1 and M17) and l.60 (continuous order, fails under M2). |
| 2 | Pre-cap rule exact; fails if keyed on supply alone | pass | `hasPopulationRoom` table row l.39 (D1 case), which fails under M3. |
| 3 | Lowered cap: growth past cap, supply at cap, first instant kept, no auto-house after the lift | pass | l.86-95. Breaks: M14, M8, M2, M10. |
| 4 | Cap reached with supply below cap: supply check applies, houses up to cap, production resumes at that instant | pass | l.105-111. Breaks: M8, M10, M9, M4, M16. |
| 5 | Same-instant lift | pass | l.66-74. `startedAt === populationCapReachedAt` (60 s), which fails under M6. |
| 6 | (respec 1) `population` waits only before the lift (ENG 1TC 1800 s and the lowered-cap fixture) | fail (spec gap) | The lowered-cap row passes and fails under M1. The ENG 1TC row cannot fail on its claim and holds at the base (Spec gap 1). |
| 7 | Villagers: default order stops at `villagerTarget`, a `produce villager` step goes past it | pass | l.119-129. Fail under M11 and M12 respectively. |
| 8 | ENG 1TC 1060 s and 1090 s equal the base | pass | `simulate-house-gate.test.ts` new rows. Null asserted first. The 1090 s row fails under M3 and the 1060 s row does not. |
| 9 | (respec 1, 2) Untouched prebuilt builds equal the base up to the cap instant | pass | Rows for ENG 1TC, Council Hall and Knight/Longbow (all three non-retuned builds in `data/aoe4-build-order/builds/`). The cap instant is pinned from the base, the `Math.floor(cap)` run is null, and the base digest is compared. |
| 10 | (respec 1) S3 bounded run past the cap | pass | `simulate.test.ts` "runs an hour of continuous production past the population cap". Final population is past the cap; the bound is 2000 ms against a measured 113-205 ms. Start villagers are the default 6: `schema.ts:508-509` requires `start.villagers` to sum to the civ's start total, so 6 is the valid maximum (confirmed). |
| 11 | (respec 2) Retuned Spear/Longbow passes every consumer; re-pins; README matches | pass | The whole `lib/aoe4-build-order` unit run passes (2015 tests). Gold run-out is unchanged at 1206.874 s. The 1800 s digest is re-pinned. Acceptance consumers are judged from the implementer's single-spec runs (all pass). The README claims (rallies, 116 villagers at 1800 s, gold/gold#2/gold#3 run-outs at 1206.9/1932.5/2658.1 s) were confirmed by probe and the JSON. |
| 12 | (respec 1) `EngineState.populationCapReachedAt`, `noteCapReached(state: EngineState)`, no cast; signatures kept | pass | Diff; `tsc --noEmit` clean. |
| 13 | `maxPopCap` read from data; no literal 200 | pass | `hasPopulationRoom` reads `data.base.maxPopCap.value`. Tests use caps 7, 10, 12 and 30. The literal-scan test passes. |
| 14 | Moved tests edited per the Scope rules and listed | pass | The implementer's report lists 6 edits. Each falls under "changed behavior gets the new value" and each has a failing break. |
| 15 | Docs and OpenAPI match the new behavior; `info.version` unchanged | fail | The statements Scope lists are all edited, and the OpenAPI diff is two descriptions only. One sentence the diff adds is contradicted by the code (Blocking finding 1). |
| 16 | No INVARIANTS.md regressions | pass | See below. |

## Invariants touched

- **A1** holds: no numeric literal was added; the cap comes from data.
- **A2** holds: the gates only skip the supply check. `canAffordHeld` and `canAfford` still come before `payUnit` (`simulate.ts:424,631`).
- **A3** holds: no clock or randomness was added. Pre-cap runs equal the base digests.
- **S3** holds: duration is at most 3600 s and production times are positive (`productionSeconds` throws otherwise). The new performance test bounds the run past the cap.
- Supply never decreases: `simulate.ts:276` is the only write after init, so "lifts for the rest of the run" holds. `planAutoHouse` returns 0 at supply equal to the cap (`houses.ts:56-57`), and `runHousePass` sets no hold when nothing is due.

## Contract checks

- **spec-checklist.md:**
  - Contracts: `hasPopulationRoom` and the field match the design's C1 and C5.
  - Scope: no page-side change, no new result field, no bound change.
  - Naming: ok.
  - A1-A3: ok.
- **Design seam:** `hasPopulationRoom` remains the one population gate, so the extension points are intact.
- **Implementer-run acceptance spec:** `aoe4-simulate-api-spend-population.spec.ts` (`200` to `406`) was run alone and failed under M15 (base behavior). My probe also gives 406 for ENG 1TC at 1800 s.
- **Mutation record:** every added row, case and assertion has a failing break in `SGS-215-implementer-7.md`. The one exception is the ENG 1TC population-wait row (Spec gap 1).

## Lint

`npx tsc --noEmit && npm run lint:dup` in the scratch: tsc clean; jscpd found 0 clones (source and tests configs).

## Bot reconciliation

No `reviewBot` CLI or rules file is configured; nothing to reconcile.

## Non-blocking notes

- `simulate-house-gate.test.ts:139` comment: "Spear/Longbow is left out: its gold rallies were retuned for production past the cap." This reads as change history. It could state the fact instead: "Spear/Longbow is left out: production past the cap changes its gold run-outs, so its build differs before the cap from the base."
- `simulate-population-limit.test.ts:20-29` `wealthy`/`rich` compose `editGameData` edits that `startingWith` and `noAutoVillagers` in `test-helpers.ts:43-54` partly cover. This is acceptable, but `startingWith(1, [...], {...}, edit)` would reuse the shared helper.
- `docs/aoe4-build-order.md:462` feature list: "past which production continues once the cap is reached" leaves out the supply-at-cap condition. The Houses and supply paragraph states the condition in full, so this is fine as a summary.
- The `data/aoe4-build-order/README.md:96` line is longer than its neighbours (157 chars); reflowing it would keep the paragraph tidy.

## Out-of-scope findings

- `acceptance/fight-api-spec-surface.spec.ts` "has exactly the pinned fight and AoE4 schema names and no others" fails at the base. `docs/api/openapi.json` on 7d74800 has `RenameNamedBuildRequest`, which the spec's pinned name list lacks. This branch does not touch the spec, and its OpenAPI diff changes only two descriptions.

## Coverage

- **Files reviewed:** all 13 in `git diff origin/main...HEAD`:
  - `simulate.ts`, `test-helpers.ts`, `simulate-population-limit.test.ts`, `simulate-house-gate.test.ts`, `simulate.test.ts`, `simulate-construction.test.ts`, `research.acceptance.test.ts`
  - `acceptance/aoe4-simulate-api-spend-population.spec.ts`
  - the Spear/Longbow build JSON, `data/aoe4-build-order/README.md`
  - `docs/aoe4-build-order.md`, `docs/aoe4-build-order-format.md`, `docs/api/openapi.json`
- **Also read:** `houses.ts` `planAutoHouse`; `simulate.ts` `produce`, `payOrder`, `houseDemand`, `runHousePass` and `completeConstruction`; `schema.ts` start-villager rule.
- **Run in the review scratch:**
  - lint (above);
  - `npx vitest run lib/aoe4-build-order`: 56 files, 2015 passed, 15 skipped;
  - `npx next build`: passed;
  - two temporary probe tests, deleted afterwards (population waits per prebuilt build at the tip and the base; Spear/Longbow depletions at 3600 s).
- **Not run:** acceptance or browser tests (gate rule). Coverage of those was judged from the implementer's single-spec runs.
- **UI inspection:** not run. The diff changes no UI (no component, style or page file), so the review checklist's page-load step has no touched page.
- **REPO.md Review checklist:**
  - "Every diff": build run; no touched page to load.
  - "AoE4 build order": no copied helper or tolerance; the engine rule change was checked against `docs/aoe4-build-order.md` (Blocking finding 1); no UI or layout change.
- **Not present:** `REVIEW.md`; LSP.
