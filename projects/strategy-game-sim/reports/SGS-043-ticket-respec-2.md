# SGS-043 ticket re-spec 2

Ticket: tickets/SGS-043-aoe4-spend-population-series.md (id, file and graph row unchanged).
Input: reports/SGS-043-spec-gate-1.md (five blocking gaps), checked against main f078c11, SGS-035, SGS-037, SGS-054.

## Gaps resolved
1. Risk: now `high`; comment cites REPO.md criticalPaths `lib/**` (simulate.ts, model.ts change).
2. 200 example: Scope 3 requires `spent`, `spawnedPopulation`, `populationCapReachedAt` copied from a real engine run for the buildOrder/text request examples (path `/api/aoe4-build-order/simulate`, 60 s at 5 s, 13 samples). Criterion names the contract spec's "request example returns the documented 200 body" tests (`toEqual`, spec lines ~201-206).
3. Depends on: SGS-035, SGS-037 (matches graph). Required-count criterion replaced with a jq set difference against `origin/main`: gains exactly the three fields, loses nothing. Ran the command on main vs main: prints `[[],[]]` as stated.
4. Scope now lists `acceptance/aoe4-simulate-api-contract.spec.ts` (simulationResult key literal line ~311, `SHARED_SCHEMAS` + `SpendCategory` enum check, missing/extra `spent` key invalid cases), `components/apps/aoe4-build-order/result-series.test.ts` (literal line ~17), and a new `lib/aoe4-build-order/simulate-series.test.ts` using test-helpers.ts.
5. "Existing tests pass without edits" -> "no expected value in any existing test changes", with the only allowed test-file edits named. Missing start-unit baseId in `data.byBaseId`: throws Error with the data.ts loader message (`startingState.units: "<baseId>" is not a unit baseId in the snapshot`); new criterion via editGameData.

Gate notes folded in: spawnUnit bump goes before the villager early return (criterion covers villager and non-villager); cap check also runs on the seed in createEngine.

## Checks run
- `git grep -n spawnedPopulation main -- docs`: 0 matches (criterion says 0 today).
- `SimulationResult.required` on main: 10 entries; jq difference command verified on main.
- Commands `npm test`, `npx tsc --noEmit`, `npm run acceptance` exist (REPO.md/package.json); `npm run lint:dup` comes from SGS-035.

## Decision made by ticket author
- Missing start-unit baseId throws rather than counting 0; consistent with the loader's existing check in data.ts:106-108. Unreachable with shipped data.

## Open questions
None.

## Overlap
- SGS-037 edits the same example, required list, key literal and result-series literal; this ticket builds on its versions.
- SGS-054 expects `SpendCategory` and the `spent` propertyNames reference from this ticket; consistent.
