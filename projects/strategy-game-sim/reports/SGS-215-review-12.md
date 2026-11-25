# SGS-215 review (12)

- Branch `sgs-215-production-past-population-cap`, tip `0d067911054013e38c9a3e3e6458e5f8a4d68936`; base `origin/main` @ 7d74800 (merge-base equals it).
- Mode: full review, the first after Re-spec 3. Commits: ae92952 (the engine, retune, tests and docs; reviewed in review-8) and 0d06791 (the Re-spec 3 pass).
- **Verdict: APPROVE.** There are no blocking findings.

## Blocking findings

None.

## Spec gaps (NEEDS_SPEC)

None. The review-8 gap is closed:
- The ENG 1TC 1800 s population-wait row is deleted.
- Criterion 6's case is now the lowered-cap fixture. The fixture first asserts its ordering (`simulate-population-limit.test.ts:146-148`).

## Review-8 blocking finding (doc sentence)

It landed verbatim. `docs/aoe4-build-order.md:373-375` now reads: "From then on a `produce` step and an order payment skip only the supply check; every other check still applies, so no step waits on `population` and population grows past the cap while supply stays at it and no house is planned."

Every fact listed in review-8 survives:
- from then on;
- both a `produce` step and an order payment;
- the supply check is skipped;
- every other check still applies;
- no `population` wait;
- population grows past the cap;
- supply stays at the cap;
- no house is planned.

The rest of the paragraph states no check order. The code agrees:
- `produce` checks its building before supply (`simulate.ts:416-421`).
- `payOrder` has only the entry, age, villager-target and room checks, then resources (`simulate.ts:624`).

## Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | `hasPopulationRoom` exported; both gates use it; a test per gate | pass | `simulate.ts:364-369`, gates at l.420 and l.624. `simulate-population-limit.test.ts:52-57`: a two-target produce at 0 s, M1 and M17 in implementer-7. l.59-63: a continuous order, M2. |
| 2 | Pre-cap rule exact; fails if keyed on supply alone | pass | Table row l.38 (D1 case); M3. |
| 3 | Lowered cap: growth past the cap, supply at the cap, first instant kept, no auto-house after the lift | pass | l.85-94; M14, M8, M2, M10. |
| 4 | Cap set with supply below the cap | pass | l.104-110. `startedAt === houses[0]`; M8, M10, M9, M4, M16. |
| 5 | Same-instant lift | pass | l.65-73. `startedAt === populationCapReachedAt`; M6 (65 vs 60). |
| 6 | (respec 3) `population` waits only before the lift; lowered-cap fixture with a step armed after the cap; ordering asserted first; ENG 1TC row deleted | pass | l.143-150. Not-null at l.146, `armedAt` not-null at l.147, cap < `armedAt` at l.148, then the per-step bound and the final `waitingOn` check (helper l.133-141). Implementer-11 breaks: #1 (old `produce` gate, which is the base behavior) fails l.138 with 100 s of wait against a 0 limit; #2 fails l.148; #3 fails l.147; #4 fails l.146. ENG 1TC row removed (`git diff ae92952 HEAD`). |
| 7 | Villagers: default order stops at `villagerTarget`; `produce villager` goes past it | pass | l.118-128; M11 and M12. |
| 8 | ENG 1TC 1060/1090 s equal the base; null first | pass | `simulate-house-gate.test.ts` "prebuilt builds before the population cap". The 1090 s row fails under M3 and the 1060 s row does not. |
| 9 | Untouched prebuilt builds equal the base up to the cap instant | pass | Rows for ENG 1TC, Council Hall and Knight/Longbow: the pinned cap instant, then the `Math.floor` run is null and matches the base digest. Spear/Longbow is excluded, as the criterion says. |
| 10 | S3 bounded run past the cap | pass | `simulate.test.ts` "runs an hour of continuous production past the population cap in under two seconds". The final population is past the cap; the bound is 2000 ms against a measured 113-205 ms. Default start villagers is the schema maximum (`schema.ts` requires the civ's start total). |
| 11 | Retuned Spear/Longbow passes every consumer; re-pins; README matches | pass | The unit run passes (below). The gold run-out is unchanged at 1206.874 s. The 1800 s digest is re-pinned. Acceptance consumers are judged from implementer-7's single-spec runs; neither the build file nor those specs changed since. README checked against the JSON: the last gold rally is at 560 s, a wood rally at 700 s, and the King's Palace rallies to wood. |
| 12 | `EngineState.populationCapReachedAt`; `noteCapReached(state: EngineState)`; no cast; signatures kept | pass | Diff; `tsc --noEmit` clean. |
| 13 | `maxPopCap` from data; no literal 200 | pass | `hasPopulationRoom` and `noteCapReached` read `data.base.maxPopCap.value`. Caps used: 7, 10, 12, 30. The literal-scan test passes. |
| 14 | Moved tests edited per the Scope rules and listed | pass | Implementer-7 lists 6 edits; implementer-11 lists the 2 dictated by Re-spec 3. Each has a failing break. |
| 15 | (respec 3) Docs and OpenAPI match; the exact lift sentence; no stated check order; `info.version` unchanged | pass | See the Doc claims section. The OpenAPI diff is two descriptions only. |
| 16 | No INVARIANTS.md regressions | pass | See below. |

## Invariants touched

- **A1** holds: no new numeric literal; the cap is read from data.
- **A2** holds: only the supply comparison was replaced. `canAffordHeld` and `canAfford` still precede `payUnit`.
- **A3** holds: no clock or randomness was added. Pre-cap digests equal the base.
- **S3** holds: `durationSeconds` is at most 3600 and production times are positive. The bounded-run test covers the run past the cap.
- **S1 and S2:** not touched.
- **Lift stays lifted.** Supply is written only in `addBuildingInstance` (`simulate.ts:276`, clamped and never decreasing), and `noteCapReached` sets the field once. So the lift holds "for the rest of the run".

## Contract checks

- **spec-checklist.md:**
  - Contracts: `hasPopulationRoom` and the moved field match design C1 and C5 exactly. No route or key surface changed.
  - Scope: no page-side change, no new result field, no `SIM_INPUT_BOUNDS` change, nothing under `golang/`.
  - No open question was answered with an invented constant.
  - Naming: ok.
  - A1-A3: ok.
- **Design seams:** `hasPopulationRoom` is the single population gate, so the extension points stay intact.
- **Pre-existing test edits:**
  - Every edit is covered by the rule "a test of the changed behavior gets the new expected value", or by Re-spec 3's dictated deletion and ordering assertion.
  - `builds.test.ts` is unedited.
- **Mutation record:**
  - Each item 0d06791 adds (l.146, l.147, l.148, and the helper as called from l.149) has a failing break on its own assertion in implementer-11.
  - Every other item in `simulate-population-limit.test.ts`, `simulate-house-gate.test.ts`, `simulate-construction.test.ts`, `simulate.test.ts`, `research.acceptance.test.ts` and the spend-population spec is unchanged since implementer-7 recorded its break. Each has a failing break there (the same table review-8 checked).
- **Implementer-run acceptance spec:** `aoe4-simulate-api-spend-population.spec.ts` (200 to 406) was run alone and failed under M15 (base behavior), per implementer-7.

## Doc claims checked against the code

- **`docs/aoe4-build-order.md` lift paragraph:**
  - The lift condition matches `hasPopulationRoom`.
  - "within its own instant ... second step offer and its order payments": `runInstant` runs `offerSteps`, `applyDueEvents`, `offerSteps`, `startProduction` (`simulate.ts:757-763`).
  - The start-at-cap case: `createEngine` calls `noteCapReached` (`simulate.ts:954`), so the field is 0.
  - Villagers: `defaultVillagersDone` applies only in `payOrder`.
- **`docs/aoe4-build-order.md` Queues, Priority and Houses sentences:** each qualifier ("only before the population limit lifts") matches the gate.
- **`docs/aoe4-build-order-format.md`:**
  - `spawnedPopulation` may exceed the cap.
  - `populationCapReachedAt` keeps its first instant (`=== null` guard).
  - `population` wait rows: the only `population` return sits behind `!hasPopulationRoom`.
- **OpenAPI:** both descriptions are true.
- **`data/aoe4-build-order/README.md`:**
  - Spear/Longbow entry matches the JSON (rallies listed above).
  - The run-out times (20, 32 and 44 minutes) match review-8's probe; the build is unchanged since.
  - Council Hall: steps 29 and 30 are continuous longbowman and spearman orders.
- **`simulate.ts` `hasPopulationRoom` doc comment:** matches its body. The "(Model rules)" suffix follows the repo convention (`houses.ts:9`, `gather.ts:18`).

## Lint

`npx tsc --noEmit && npm run lint:dup` in the review scratch: tsc clean; jscpd found 0 clones in both configs.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty; nothing to reconcile.

## Non-blocking notes

- **`simulate-population-limit.test.ts:93` "starts no auto-house after the cap is reached".** It compares `spent.buildings` at the first sample at or after the cap instant with the last sample. A house started between the cap instant and that sample would go unseen. M10 still fails the test, so it can fail. Comparing against the last sample strictly before the cap (`after - 1`), plus the cost of houses known to finish then, would be tighter. Optional.
- **`simulate-house-gate.test.ts:139` comment** "its gold rallies were retuned for production past the cap" reads as change history. Suggested fact-only wording: "Spear/Longbow is left out: production past the cap changes its gold rallies, so its result before the cap differs from the base." (Carried over from review-8.)
- **`simulate-population-limit.test.ts:19-28` `wealthy`/`rich`** partly overlap `startingWith`/`noAutoVillagers` in `test-helpers.ts`. Acceptable as is. (Carried over from review-8.)
- **`data/aoe4-build-order/README.md:96`** is longer than its neighbours; reflowing it would tidy the paragraph. (Carried over from review-8.)

## Out-of-scope findings

- `acceptance/fight-api-spec-surface.spec.ts` "has exactly the pinned fight and AoE4 schema names and no others" fails at the base. `docs/api/openapi.json` has `RenameNamedBuildRequest`, which the spec's pinned list lacks. This was reported in implementer-7 and review-8; this branch does not touch the spec.

## Coverage

- **Files reviewed:** all 13 in `git diff origin/main...HEAD`. The delta `ae92952..0d06791` was read line by line.
- **Also read:**
  - `simulate.ts`: `createEngine`, `runInstant`, `noteCapReached`, `produce`, `payOrder`;
  - the Spear/Longbow and Council Hall build JSON;
  - design M13 C1, C5 and the Behavior rules.
- **Run in the review scratch:**
  - lint (above);
  - `npx vitest run lib/aoe4-build-order`: 56 files passed and 1 skipped; 2014 tests passed and 15 skipped. That is review-8's 2015 minus the deleted row.
  - `npx next build`: passed.
- **Not run:**
  - Acceptance or browser tests (gate rule). Coverage of them was judged from implementer-7's single-spec runs; none of those specs, nor the files they load, changed in 0d06791.
  - Mutations (gate rule).
- **UI inspection:** not run. The diff changes no component, style or page file.
- **REPO.md Review checklist:**
  - "Every diff": build run; no touched page to load.
  - "AoE4 build order": no copied helper or tolerance; the engine rule was checked against `docs/aoe4-build-order.md`; no UI or layout change.
- **Not present:** `REVIEW.md`, LSP, a review bot.
