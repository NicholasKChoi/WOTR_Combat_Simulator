# SGS-136 acceptance-test 1

Verdict: PASS. All 8 new tests pass. All 472 tests in the changed contract specs and the simulate-API specs pass. Every new test failed under a targeted break, and every break was undone.

- Branch: sgs-136-simulate-production-buildings-series. Tested tip d2750f2. New commit **38a7cdf27899d76951a2ced3ea6b5d26496157c2** contains the test file only.
- Harness: Playwright (`npx playwright test`). It started its own `next dev` and ran against the real `POST /api/aoe4-build-order/simulate`. `acceptanceSetup` ran first: node_modules linked and `playwright install chromium` done.
- Base: local `main` is stale, so I used `origin/main` (5564bd0), which is the tip's parent.

## Tests written

File: `acceptance/aoe4-simulate-api-production-buildings.spec.ts`

| # | Test | Criterion it covers |
|---|------|------------|
| 1 | on the prebuilt English order: capital-town-center first at 1 at t=0, one count per sample through a duration off the sample grid | C2. Uses english-1tc at 1203 s; the test checks that 1203 is off the 5 s grid. |
| 2 | a barracks is 0 from the sample its construction starts and 1 from the sample at its completion on | C3. Uses `@1:00 build barracks` with walkSeconds 0, so construction runs 60 to 90. The test asserts counts equal `t >= 90 ? 1 : 0` at every sample, which includes 0 at the start sample (60) and 1 at the completion sample (90). |
| 3 | the starting capital-town-center and a built town-center are two series with their own names | C4, first half. Two series named "Capital Town Center" and "Town Center". The capital stays at 1 throughout. town-center is 0 until it completes. |
| 4 | two buildings first completed at the same sample are ordered by baseId, whatever the step order | C5. dock is listed before barracks in the order, and both complete at 150. Expected order: capital-town-center, barracks, dock. |
| 5 | a production building still under construction, or never started, at the horizon has no series | C6 and C3. A barracks still in progress at the 60 s horizon and a stable stuck on its prerequisite produce no series. |
| 6 | a completed house is not a production building | C1, observed through the API. A completed house gets no series. |
| 7 | on the prebuilt English order every series is a data-defined production building, named by its building entry, in order | C1, C4 (name rule) and C5 (general ordering). Each series must have a building entry and appear in a unit's producedBy, computed independently from the snapshot. Its name must be the lowest-age building entry's name, it must have a positive count somewhere, and the list must be sorted by first positive sample then baseId. |
| 8 | two runs of the same order and inputs return deeply equal productionBuildings | C7 |

## Runs

| Run | Result |
|-----|--------|
| New spec (8 tests) | 8 passed. Run twice, the second time after all breaks were undone. |
| `acceptance/aoe4-simulate-api*` (all 25 simulate-API spec files, including the changed contract and issue-shape specs), plus `aoe4-builds-api-contract`, `aoe4-named-builds-api-contract`, `aoe4-gathered-resources`, `fight-api-spec-surface` | 472 passed, 0 failed |
| `grep 2.5.0 acceptance/` | no matches. `openapi.json` `info.version` is 2.6.0. |
| `npx tsc --noEmit && npm run lint:dup` (both jscpd configs) | clean, 0 clones |

Criterion 11, acceptance part: verified for the scope the caller asked for (the changed contract specs, the OpenAPI and spec-surface specs, and the simulate-API specs). I did not run the full `npm run acceptance` suite (UI specs included), because full-suite runs are outside this role's scope.

C8 (contract) was already covered by the implementer's case in `aoe4-simulate-api-contract.spec.ts`. That case checks a missing key, an extra key, and the exhaustive key list. Every 200 example also equals the real response and validates against the schema. All of these passed in the 472-test run.

## Mutation checks

Each break was undone with `git checkout -- <file>`, and `git diff --exit-code` on the non-test files was clean after each one.

| Test | Break | Failed assertion |
|------|-------|------------------|
| 1 | `lib/aoe4-build-order/simulate.ts:1023`: `buildingSamples.slice(1)` | spec:49 `toHaveLength(times.length)`, expected 242, received 241 |
| 2 | `lib/aoe4-build-order/production-buildings.ts:23`: counts read from the previous sample (one sample late) | spec:58 counts toEqual `t >= 90 ? 1 : 0`, received 0 at the completion sample |
| 3 | `production-buildings.ts:23`: the town-center count also includes capital-town-center (series merged) | spec:74 town-center counts toEqual (192 samples differed) |
| 4 | `production-buildings.ts:29`: tie-break dropped (`a.first - b.first` only) | spec:85 baseIds toEqual `[capital-town-center, barracks, dock]`, received dock before barracks |
| 5 | `production-buildings.ts:27`: never-completed series kept | spec:91 baseIds toEqual `['capital-town-center']`, received 15 extra series |
| 6 | `production-buildings.ts:13`: every building baseId added to the production set | spec:98 house series present. Test 7 also failed at spec:105 ("house"). |
| 7 | `production-buildings.ts:26`: name taken from entry `id` | spec:106 expected "Capital Town Center", received "capital-town-center-1" |
| 7 | `production-buildings.ts:29`: sort by baseId only | spec:33 "barracks before capital-town-center" |
| 8 | `production-buildings.ts`: a module-level counter added to the last count, so state leaks between requests | spec:115 `toEqual` between the two runs |

## Failures

None.

## Criteria I could not express in this harness

- **C4, second half (age tiers of one baseId are one series named by the lowest-age entry).** In the shipped English snapshot, every production building has exactly one building entry, so no API request can show multiple age tiers. Test 7 pins the name to the lowest-age entry, but the case with several tiers is covered only by the implementer's unit tests, which use edited data.
- **C5, locale-versus-code-unit tie-break.** All English production baseIds are lowercase and hyphenated, and no pair that can tie through the API orders differently under `localeCompare` than under code-unit comparison. Test 4 catches a dropped tie-break but not a switch to locale comparison. That is unit-test territory.
- **C1, `wynguard-*` exclusion and the full set.** The data rule is a pure function and belongs to the implementer's unit test. Through the API, test 7 checks that every emitted series satisfies both rules, and test 6 covers house.
- **C9 (docs) and C10 (existing series unchanged).** C9 is not observable through the API. For C10, the existing simulate-API specs passed unchanged (472 passed); this ticket's commit edits no simulate-API spec expectations beyond the version pins and the contract key list.

## Out of scope

None. No server or process is left running: a port-3517 dev server I started for probing died with its shell, and `serve.sh status 3517` reports stopped. The scratch probe test I put in the worktree was deleted before the commit.
