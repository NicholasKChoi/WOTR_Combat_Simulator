# SGS-136 review 1

- Branch: `sgs-136-simulate-production-buildings-series`, tip `d2750f2f741e4e4dc6764dbdd386c1a35bf11368`, base `origin/main` (one commit).
- Mode: full review (first review).
- **Verdict: APPROVE**

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | `productionBuildingIds` English set: has `capital-town-center`, `town-center`, `barracks`; not `house`, not `wynguard-*`; whole-set test of both rules | pass | `production-buildings.test.ts` "holds the English producers..." (asserts preconditions: `wynguard-footmen` is an unbuilt producer, `house` is a building) and "holds only building baseIds that a unit entry lists in producedBy" (loops the whole set, checks both rules, asserts size > 1). The impl reads `data.byId` unit entries and `byBaseId` building entries only; `CivRules` is not consulted (A1). |
| 2 | Starts with `capital-town-center` = 1 at t=0; `counts.length === times.length`; last count at `durationSeconds` off the grid | pass | `simulate-series.test.ts` "starts with capital-town-center at 1 at t=0..." runs `durationSeconds: 302`, asserts `302 % sampleSeconds !== 0`, `times.at(-1) === 302`, every series length equals `times.length`. Mutation (push `engine.buildings` by reference instead of a copy) fails this test. |
| 3 | Under construction not counted; counted at the completion sample | pass | "leaves a barracks out while it is under construction..." asserts the construction window has more than one sample, all 0, and counts are 1 from `sampleIndex(completedAt)`; `sampleIndex` throws when `completedAt` is not a sample time, so the "at t" precondition is loud. Mutation (reference instead of copy) fails it. |
| 4 | Capital TC and built TC are two series with own names; age tiers one series named by lowest-age entry | pass | simulate test with a built `town-center` (asserts step completed) gives `barracks`, `capital-town-center`, `town-center` with names; unit test unshifts an age-2 `Grand Barracks` entry, asserts `byBaseId` order, expects one series named `Barracks`. |
| 5 | Order: first positive sample, then baseId by code units; tie test with unsorted input fails on dropped/locale tie-break | pass | Unit test with `Z-yard` (asserts `barracks` precedes `Z-yard` in insertion order). Mutations run: tie-break dropped -> fails; `localeCompare` -> fails. |
| 6 | Never-completed production building has no series | pass | "gives a never-completed production building no series" (dock at 0 and absent; asserts dock is a production building). |
| 7 | Two runs deep-equal; existing A3 tests unchanged | pass | `it.each(listBuilds())` determinism test (precondition `length > 1`); no existing A3 test edited; `npm test` green. |
| 8 | OpenAPI 2.6.0, closed `BuildingSeries`, required field, every full-result example carries it; no spec asserts 2.5.0; contract spec fails on missing / extra key | pass | `docs/api/openapi.json` diff; both 200 examples (`buildOrder`, `goldRunOut`) gained the field. I verified with a scratch Vitest run (deleted) that the simulate handler's output for both request examples deep-equals the documented 200 bodies, including `productionBuildings`. `grep 2.5.0` finds nothing in `.ts/.tsx/.js/.md`. New contract test removes the key (invalid) and adds an extra key to a series (invalid); `Record<keyof SimulationResult>` and `Record<keyof BuildingSeries>` lists updated. |
| 9 | `docs/aoe4-build-order.md` documents the field | pass | Outputs list, lines 766-773: which buildings count, per-baseId series, name rule, ordering, completed only, no series for never-completed. Each sentence checked against `production-buildings.ts` and `simulate.ts:997`. |
| 10 | Existing series unchanged | pass | Only the `result()` fixture in `result-series.test.ts` gained the field; no expectation edited. `data.acceptance.test.ts` edit discussed below. |
| 11 | tsc, `npm test`, `lint:dup`, acceptance pass | pass except acceptance `unverified` | tsc clean, `lint:dup` 0 clones under both configs, `npm test` 75 files / 2375 passed, `npx next build` succeeds. Acceptance not run by review (role rule); see the acceptance-test gate. |
| 12 | No INVARIANTS regressions | pass | See below. |

## Specific questions from the manager

- **`data.acceptance.test.ts` edit (25 -> 26 types, adds `BuildingSeries`)**: justified. The test pins the exact set of types `model.ts` exports, and the ticket's Scope requires a new exported `BuildingSeries` in `model.ts` (design C9 names it there). The edit is the mechanical consequence; the test still fails on any other undocumented export, so its strength is unchanged. It is not a series expectation, so AC 10 is not affected.
- **Version pins**: all four specs that asserted 2.5.0 (`aoe4-builds-api-contract`, `aoe4-named-builds-api-contract`, `aoe4-gathered-resources`, `aoe4-simulate-api-issue-shape`) now assert 2.6.0, with test names updated to match. No other pin remains. `info.description` unchanged.
- **Contract spec edits**: follow the ticket. `aoe4-simulate-api-contract.spec.ts` adds `productionBuildings` to the exhaustive key record, a `BuildingSeries` key record, `BuildingSeries` in `RESPONSE_SCHEMAS`, and a real-response test validating each series against the 2.6.0 schema. `fight-api-spec-surface.spec.ts` adds `BuildingSeries` to its full schema-name list, which is required for that list to stay exact. `acceptance/openapi-schemas.ts` needed no edit: it loads `docs/api/openapi.json` at runtime, so it "follows" the change already.

## Invariants touched

- A1 (game numbers from data): holds. Producer set derived from `GameData` only; no literal.
- A2 (resources never negative): not affected; no payment path changed.
- A3 (determinism): holds. Per-sample `new Map(engine.buildings)` copy; `Map` iteration is insertion-ordered; sort is total (first index, then code-unit compare). No randomness or clock.
- S1-S3: not touched (no new input; result size bounded by the data's building count times samples).

## Spec checklist

- Contracts: `BuildingSeries`, `productionBuildings`, `productionBuildingIds`, `productionBuildingSeries` match design/M9.md C9 signatures exactly; field placed after `unitsProduced` in type, schema `required`, `properties` and examples.
- Scope: nothing from Out of scope implemented (no `result-series.ts` / `results.tsx` change, no civ-rule override). No `golang/`.
- No invented constants. Naming states intent.
- A1/A2/A3 items: pass as above.

## Linter

`npx tsc --noEmit && npm run lint:dup`: clean (0 clones in both jscpd configs).

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty in REPO.md; section skipped.

## Conventions

- `production-buildings.ts` follows the `lib/aoe4-build-order` style of `markers.ts` / `step-options.ts` (2-space, semicolons, short top comments). It imports `compareCodeUnits` from `step-options.ts` (now exported, `step-options.ts:33`) instead of copying it, as the AoE4 review checklist requires.
- Tests follow `simulate-series.test.ts` style (4-space, no semicolons, `run`/`sampleIndex`/`editGameData` from `test-helpers.ts`), and the new unit file uses the shared `editGameData`/`ENGLISH` helpers.
- No three-plus copy-paste test blocks.

## Correctness

- Sampling push sits inside the same per-sample `for` as `gatherers` (`simulate.ts:986-998`), so a single instant that covers several sample times pushes one copy per sample and the series stays in lockstep with `times`.
- `engine.buildings` is only incremented in `addBuildingInstance` (`simulate.ts:259`), the completion path, so under-construction buildings are excluded.
- Mutations run (each reverted): reference push instead of copy -> 2 simulate tests fail; tie-break dropped -> unit sort test fails; `localeCompare` -> unit sort test fails.

## UI inspection

Not run: the diff changes no rendered UI (the only `components/` change is a test fixture).

## Non-blocking notes

1. `lib/aoe4-build-order/production-buildings.ts:26` - the `?? baseId` name fallback is unreachable, since every id from `productionBuildingIds` has a building entry. Harmless; could be a non-null assertion, but nothing requires a change.
2. `docs/aoe4-build-order.md:829-831` - the paragraph naming which result fields feed graphs and the compare table ("`spawnedPopulation` has no graph") does not mention `productionBuildings`. It does not claim to be exhaustive (it also omits `gatherers`, `depletions`), and the chart view is a later ticket, so not a contradiction today; the view ticket should update it.

## Coverage

Reviewed every file in the diff: the 6 acceptance specs, `result-series.test.ts`, `docs/aoe4-build-order.md`, `docs/api/openapi.json` (schemas and both examples), `data.acceptance.test.ts`, `model.ts`, `production-buildings.ts` and its test, `simulate-series.test.ts`, `simulate.ts`, `step-options.ts`. Also read `test-helpers.ts` (`run`, `sampleIndex`), `acceptance/openapi-schemas.ts`, the simulate route, ARCHITECTURE.md (no module list to update), design/M9.md C9. Ran tsc, lint:dup, `npm test`, `npx next build`, a scratch example-equality check, and three mutations. Not run: acceptance (role rule). REPO.md "Every diff" page load skipped: no page or component behavior changed.
