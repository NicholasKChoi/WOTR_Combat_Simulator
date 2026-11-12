# SGS-136 implementer report 1

- Ticket: SGS-136, Emit production buildings over time from the simulator (OpenAPI 2.6.0)
- Branch: `sgs-136-simulate-production-buildings-series` (base origin/main 5564bd0)
- Tip SHA: d2750f2f741e4e4dc6764dbdd386c1a35bf11368
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-136-simulate-production-buildings-series

## Files touched

- `lib/aoe4-build-order/model.ts`: adds `BuildingSeries` and `SimulationResult.productionBuildings` after `unitsProduced`.
- `lib/aoe4-build-order/production-buildings.ts` (new): `productionBuildingIds(data)` and `productionBuildingSeries(data, samples)`.
- `lib/aoe4-build-order/step-options.ts`: exports `compareCodeUnits` so the new module imports it instead of copying it.
- `lib/aoe4-build-order/simulate.ts`: per-sample `new Map(engine.buildings)` snapshot taken next to `spawnedPopulation`, and `productionBuildings` in the result.
- `lib/aoe4-build-order/production-buildings.test.ts` (new): pure-function tests.
- `lib/aoe4-build-order/simulate-series.test.ts`: new `productionBuildings` describe block.
- `lib/aoe4-build-order/data.acceptance.test.ts`: pinned model.ts export list gains `BuildingSeries` (25 to 26 types).
- `components/apps/aoe4-build-order/result-series.test.ts`: the `result()` fixture gets the field.
- `docs/api/openapi.json`: 2.6.0; `BuildingSeries` schema; `productionBuildings` property and required entry; the field in both 200 examples (`buildOrder`, `goldRunOut`).
- `docs/aoe4-build-order.md`: `productionBuildings` bullet in the Outputs list.
- `acceptance/aoe4-simulate-api-contract.spec.ts`:
  - `BuildingSeries` added to `RESPONSE_SCHEMAS`, to the key list and to `typeKeys`.
  - The `SimulationResult` key list gains `productionBuildings`.
  - New test: every real series validates as a `BuildingSeries`; a result with no `productionBuildings`, or with an extra key in a series, is invalid.
- `acceptance/fight-api-spec-surface.spec.ts`: `AOE4_SCHEMA_NAMES` gains `BuildingSeries`.
- `acceptance/aoe4-builds-api-contract.spec.ts`, `aoe4-named-builds-api-contract.spec.ts`, `aoe4-gathered-resources.spec.ts`, `aoe4-simulate-api-issue-shape.spec.ts`: version pin moved from 2.5.0 to 2.6.0.

`acceptance/openapi-schemas.ts` was not changed. It loads `docs/api/openapi.json` at runtime and resolves schemas by name, so it picks up the new version and schema with no edit. The hard-coded list of schema names that had to change is in `fight-api-spec-surface.spec.ts`, and I updated it there.

## Tests

- `production-buildings.test.ts`: 8 pass.
- `simulate-series.test.ts` productionBuildings block: 7 pass (3 tests plus `it.each` over the 4 prebuilt builds).
- Full `npm test`: 75 files, 2375 passed, 13 skipped, 0 failed.

Invariants the tests encode:
- **Producer set comes from data (A1):**
  - capital-town-center, town-center and barracks are in the set.
  - house is not in the set.
  - No `producedBy` id without a building entry is in the set (the wynguard-* ids).
  - A whole-set check: every id has a building entry and appears in some unit's `producedBy`.
  - Adding house to spearman's `producedBy` puts it in the set.
- **Series rules:**
  - One series per baseId.
  - capital-town-center and town-center are separate, each with its own name.
  - Age tiers form one series named by the lowest-age entry.
  - A never-completed building has no series.
  - Order is first positive sample, then baseId in code-unit order. Z-yard sorts before barracks, the reverse of locale order.
- **Simulator:**
  - capital-town-center has count 1 at t=0.
  - `counts.length === times.length` for a 302 s duration, which is off the sample grid.
  - Barracks counts 0 at every sample between start and completion, and 1 from the completion sample on.
  - A built town-center gives its own series.
- **Determinism (A3):** two runs of each prebuilt build give deeply equal `productionBuildings`, and counts never decrease.

## Pre-existing tests edited

- `lib/aoe4-build-order/data.acceptance.test.ts`, test "model.ts exports exactly the 25 documented types and the shared lists":
  - Now "26", and the list gains `'BuildingSeries'`.
  - Scope requires a new exported `BuildingSeries` type in model.ts, and this test pins the exact export list.
  - The ticket has no explicit rule for this file. The edit is the direct consequence of a scoped addition, and no other assertion changed.
  - The reviewer may want to confirm.
- `acceptance/fight-api-spec-surface.spec.ts`, test "has exactly the pinned fight and AoE4 schema names and no others":
  - The list gains `BuildingSeries`.
  - Scope requires the new schema, and the scope line "acceptance/openapi-schemas.ts follows the OpenAPI change" covers this.
- The four version-pin specs (test names and assertions, 2.5.0 to 2.6.0). Ticket rule: "every acceptance spec that asserts `info.version` is `2.5.0` moves to 2.6.0".
- `acceptance/aoe4-simulate-api-contract.spec.ts`:
  - The key list, `RESPONSE_SCHEMAS` and `typeKeys` were extended.
  - One test was added.
  - Ticket rule: the key list gains the key and the response is validated against `BuildingSeries`.
- `components/apps/aoe4-build-order/result-series.test.ts`: fixture only. Ticket rule: SimulationResult literals get the new field.

## Doc claims

- model.ts, before `BuildingSeries`: "counts are the completed instances of baseId at each sample; under-construction buildings are not counted."
  - True because `simulate.ts` `simulateBuildOrder` pushes `new Map(engine.buildings)`.
  - `engine.buildings` is incremented only in `addBuildingInstance`, which runs on completion and for starting buildings. Under-construction jobs live in `engine.constructing`.
- model.ts, on `productionBuildings`: "One per production building with a completed instance at some sample, sorted by its first such sample, then baseId."
  - True per `production-buildings.ts` `productionBuildingSeries`: `first < 0 ? []` and the sort comparator.
- production-buildings.ts: "A building baseId that some unit entry lists in producedBy."
  - True per `productionBuildingIds`: `entry.type === 'unit'` and `hasBuildingEntry`.
- production-buildings.ts: "samples[i] maps a building baseId to its completed instances at times[i]."
  - True because simulate.ts pushes one snapshot per sample, in the same loop branch as the other series.
- production-buildings.ts: "byBaseId lists each baseId's entries by age, so this is the lowest-age building name."
  - True per `data.ts` `loadGameData`, which runs `tiers.sort((a, b) => a.age - b.age)`.
- openapi.json `BuildingSeries`:
  - "Completed instances of one production building baseId over time. Buildings under construction are not counted." Same source as the model.ts comment.
  - name: "Display name of the building's lowest-age entry." Same source as the byBaseId comment.
  - counts: "Completed instances of this building at each sample time, starting buildings included." True because starting buildings go through `addBuildingInstance` (simulate.ts initial engine). The simulator test pins capital-town-center at 1 at t=0.
- openapi.json `SimulationResult.productionBuildings`: "One series per production building baseId (a building that some unit entry lists as a producer) with a completed instance at some sample, ordered by that first sample, then baseId by code-unit comparison. A production building never completed in the run has no series."
  - True per `productionBuildingIds` and `productionBuildingSeries`, which use `compareCodeUnits`.
- docs/aoe4-build-order.md, the `productionBuildings` bullet:
  - The producer rule, house excluded, and the two town-center series: `productionBuildingIds`, plus the tests.
  - One series per age-tiered baseId, named from the lowest-age entry: `productionBuildingSeries` iterates baseIds, and `find` runs over the age-sorted `byBaseId`.
  - Counts are completed instances with starting buildings included; under construction is not counted; a building completing at a sample time is counted at that sample. Source is the snapshot in `simulateBuildOrder`, taken in the sample branch after `runInstant(engine)` at that instant. The barracks test checks the completion sample.
  - Order is first positive sample, then baseId in code-unit order: the comparator.
  - No series without a completed instance: `first < 0 ? []`.

## Pinned outputs

The openapi.json 200 examples carry the real engine output, checked against `simulateBuildOrder` with a scratch test (deleted) and by the acceptance example tests:
- `buildOrder` example: `[{baseId:'capital-town-center', name:'Capital Town Center', counts: 13 x 1}]`.
- `goldRunOut` example: the same series with `counts` 37 x 1.

## Mutation checks

All breaks were undone. The final file contents were re-read, and `git diff` of simulate.ts shows only the three intended lines.

| # | Break (file:line) | Failing test, failing assertion |
|---|---|---|
| M1 | simulate.ts:997, snapshot also counts `engine.constructing` entries | Simulator under-construction test: `building.map(i => counts[i])` equals all 0; got `[1,1,...]`. Also the t=0 test: barracks 1 at t=0. |
| M2 | simulate.ts:997, push the live `engine.buildings` instead of a copy | Same two assertions as M1. |
| M3 | production-buildings.ts:23, counts lag one sample | Simulator test: `counts.slice(done)` all 1; got 0 at the completion sample. Also the pure first-series and sort tests. |
| M4 | production-buildings.ts:29, drop `a.first - b.first` | Sort test: got `['Z-yard','archery-range',...]`. Also the first-series test and the simulator t=0 order. |
| M5 | production-buildings.ts:29, drop the baseId tie-break | Sort test: got `['town-center','barracks',...]`. |
| M6 | production-buildings.ts:29, tie-break with `localeCompare` | Sort test: got `['town-center','barracks',...]`. |
| M7 | production-buildings.ts:27, keep series with no positive count | "gives a never-completed production building no series": got 16 ids. Also 6 other exact-list assertions. |
| M8 | production-buildings.ts:26, name from `findLast` (highest age) | Age-tier test: expected name 'Barracks'. |
| M9 | production-buildings.ts:14, drop the building-entry filter | `unbuilt.filter(id => ids.has(id))` equals `[]`; got the wynguard ids. Also the whole-set building-entry check. |
| M10 | production-buildings.ts:13, accept any entry with `producedBy` (not only units) | Whole-set check: `unitEntries(...).some(producedBy includes id)` is false. |
| M11 | production-buildings.ts:14, only each unit's first producer | Data-driven house test: `has('house')` is false. Also the English set test (town-center missing). |
| M12 | production-buildings.ts:22-23, counts depend on a call counter | Determinism `it.each` (4 builds): `expect(simulate()).toEqual(first)`. |

The non-decreasing assertion in the `it.each` test is a supporting check. I did not mutate it separately.

## Codegen, build, lint

- codegen: not set in REPO.md.
- build (`link-node-modules.sh . && npx next build`): succeeds.
- lint (`npx tsc --noEmit && npm run lint:dup`): tsc clean; jscpd 0 clones under both configs.
- Acceptance: I ran the 6 changed specs (`npm run acceptance -- <files>`), 147 passed. I did not run the full acceptance suite; the acceptance gate owns it.
- `git diff --stat origin/main`: only the files listed above; no stray tool changes.

## Invariant check

- A1 upheld. The producer set is computed from `GameData` only (unit `producedBy` plus building entries in `byBaseId`). There are no hard-coded ids, and `CivRules.villagerProducer` is not consulted.
- A3 upheld. The snapshot is a plain copy per sample. Ordering is total: first sample, then code-unit baseId, with no locale dependence. Two-run deep-equality tests pass, and the existing A3 tests pass unchanged.

## Unverified assumptions added

None. The tests use the real English data and the real engine; nothing external is faked.

## Out-of-scope findings

- design/M9.md speaks of 15 English production building ids. The data yields 16: the design's 15 plus `wynguard-palace`. The behavior follows the data (A1); the design count is stale.
- The English data lists `wynguard-army`, `wynguard-footmen`, `wynguard-raiders` and `wynguard-rangers` in unit `producedBy`. These ids have entries in `byBaseId`, but none of type building. They are excluded per the ticket rule.

## Status

needs_review
