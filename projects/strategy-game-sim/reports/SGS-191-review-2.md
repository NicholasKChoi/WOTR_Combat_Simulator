# SGS-191 review 2 (delta, tip f58419c; approved tip 2b3eccf)

Verdict: APPROVE

Delta: 601b81d (new acceptance/aoe4-simulate-api-unit-lines.spec.ts) and f58419c (`ChartMarker: ['unit']` added to the `optional` map in acceptance/aoe4-simulate-api-contract.spec.ts:99). Test files only; no production change.

## Rework 1 required fixes
- Contract spec one-entry fix: landed verbatim, nothing else in that spec changed (diff is one line). Pass.
- Spec runs: not run by me (gate rule: no acceptance runs); judged by reading.

## Test checks (each reads against production code)
- lineName tests: production sets `lineName: unitLineName(...)` over all unit entries of the baseId (simulate.ts:986), so "equal across a baseId", "Longbowman across converted tiers", "Man-at-Arms despite a prefixed tier name" (guarded by the `name !== 'Man-at-Arms'` precondition) and single-tier names can each fail if lineName is taken from the tier name. Pass.
- Marker unit tests: research.ts:27 passes `upgradeTargets.get(entry.baseId)?.value` to researchMarker; model.ts:154 says absent on age-ups and non-targets. The "exactly that target" test iterates every marker, guards non-vacuity (`> 0`), and excludes age-ups. The key-absence checks use `Object.keys`, which would fail on `unit: undefined` serialization differences only if the key survives JSON, which is the contract. The `horticulture` marker exists in the knight build and is asserted to be exactly `['kind','label','at']`. Pass.
- Fixtures exist (veteran-longbowmen, horticulture in english-knight-longbow.json); the helpers `postSimulate` and `WARM_UP_TIMEOUT_MS` exist in acceptance/helpers.ts.
- Test-file diff across the branch: no pre-existing assertion weakened or deleted by this delta.

## Findings
- Blocking: none.
- Non-blocking: acceptance/aoe4-simulate-api-unit-lines.spec.ts:52-86 the `research markers unit` describe body is indented one level too deep (4 spaces instead of 2). Cosmetic. The repo has no ESLint config (`eslint` finds no eslint.config.*) and package.json has only `lint:dup`, so no linter flags it; `tsc --noEmit` printed nothing (clean).
- Convention: the new spec follows the sibling acceptance specs' helpers (`postSimulate`, `WARM_UP_TIMEOUT_MS`, `beforeAll` shared results).

## Acceptance criteria / invariants
Delta touches no production code; invariants unaffected. Criteria for lineName and marker unit are now pinned by the new spec as read above.

## Coverage
Reviewed both changed spec files and the production code they assert on (simulate.ts, research.ts, model.ts, effects.ts). No UI change; no inspection. No reviewBot step run (delta, test-only).
