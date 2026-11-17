# SGS-191 acceptance-test report 1

Verdict: 1 FAILURE (impl-defect) in a pre-existing contract test; all 7 new tests pass.
Task branch tip before: 2b3eccf. Commit with new spec: 601b81d4a073a58eefeb656130a54442f881c46b.
Harness ran (Playwright, Chromium, next dev; acceptanceSetup run).

## Tests written (acceptance/aoe4-simulate-api-unit-lines.spec.ts), all pass
- every series has a non-empty lineName, equal across series of one baseId (knight/longbow and spear/longbow/man-at-arms prebuilt builds)
- converted longbowman tiers both show `Longbowman`
- man-at-arms series (tier name has a prefix) show `Man-at-Arms`
- knight -> `Knight`, villager -> `Villager`
- veteran-longbowmen marker has `unit: 'longbowman'`
- every marker whose label is an english `upgradeTargets` key has exactly that target, whatever its kind; every other marker (age-ups, other researches) has no `unit` key
- age-up markers exist, and `horticulture` marker's keys are exactly kind, label, at

## Existing specs run
contract, markers, veterancy-conversion, research specs: 84 passed, 1 failed (below). Lint (tsc + jscpd) clean.

## Failure (impl-defect)
`acceptance/aoe4-simulate-api-contract.spec.ts:98` "response-side schemas are closed and require every property the type does not mark optional".
Expected: ChartMarker `required` equals all its properties; observed: `unit` is in `properties` but correctly not in `required`, so the test fails. The `optional` map on line 99 (`{ BuildOrderIssue: [...], SimulateError: [...] }`) lacks `ChartMarker: ['unit']`. The ticket requires the contract spec to pass, and the implementer's Scope rule (update tests that must follow the new types) covers it. Fix: add `ChartMarker: ['unit']`. I did not edit it (pre-existing test, impl-defect rule).

## Mutation checks (all undone, `git diff --exit-code lib` clean)
- `lib/aoe4-build-order/simulate.ts:~986` lineName from `[entry]` only: 3 tests failed (equal-across-series Expected 1/Received 2; Longbowman; Man-at-Arms).
- `lib/aoe4-build-order/research.ts:27` drop the unit argument: veteran-longbowmen and the every-marker-target tests failed.
- `lib/aoe4-build-order/markers.ts` set `unit` unconditionally: no acceptance test fails. JSON serialization drops `undefined`, so absent-vs-undefined is not observable over HTTP; the implementer's `markers.test.ts` covers it. The no-unit-key test is not mutation-proven for that variant; it is proven for the wrongly-set variant only through the research.ts break in reverse (target present).

## Not expressible in this harness
- absent versus `undefined`-valued `unit` key (HTTP JSON); unit-level only.
- whole-word suffix and age-order fallback of `unitLineName` (unit tests, implementer's).
- Fight-API specs do not read these fields; nothing else found failing.

## Openapi examples
Both 200 examples with `unitsProduced` carry `lineName`; the contract spec's example-validation tests pass.
