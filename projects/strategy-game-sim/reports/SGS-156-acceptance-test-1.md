# SGS-156 acceptance-test 1

Verdict: PASS (no impl-defect, no spec-gap). One unrelated UI failure noted below.

Branch `sgs-156-auto-houses-plan-ahead`, tested at d172c2e, test commit `7bedffeabee0d96617c7c2651c33b791776d226c` (adds one spec only). Harness (Playwright, next dev) provisioned with `acceptanceSetup` and ran.

## Existing specs run against the tip
- `npx playwright test acceptance/aoe4-simulate-api`: 409 passed, 0 failed. Includes `aoe4-simulate-api-prebuilt-farms.spec.ts` (cap 2600), house-gate, house-rule, waits, spend-population, triggers, research, prebuilt-plans.
- Remaining AoE4 specs (builds-api, named-builds, auto-run, my-builds, save, step, chart, results, marker, compact, editor, narrow, small, split, gathered, key-results): 488 passed, 1 failed.
  - Failure: `acceptance/aoe4-results-split.spec.ts:41` "the four charts are direct children of the results container and wrap no column". Received extra `chart-reorder-help` and `chart-order-status` children before the chart ids. This is UI markup; the branch diff touches no UI file (only lib/aoe4-build-order, docs, data README). Unrelated to SGS-156, likely pre-existing at the fork or a main-side change. Not classified as impl-defect; the manager may confirm on main.
- No existing Playwright spec depended on the old house timing: none failed.

## Test written
`acceptance/aoe4-simulate-api-house-plan-ahead.spec.ts` (2 tests, both pass):
1. "the Town Center never stalls longer than one villager plus a sample between 9:30 and 15:00": the ticket fixture at default inputs through POST simulate. Preconditions asserted first: food above 50 and villagers below 90 at every sample in the window, villager count grows across it. Then the longest flat stretch of the villager series is <= villager production time (from game data) + sample interval.
2. "the same stall measure sees the Town Center housed when auto-houses are off": the measure can detect a stall (>25 s flat with `autoHouses: false`).

Dropped after mutation checks showed they could not fail: a non-negative-resources assertion (breaking `canAffordHeld` and the `payCost` clamp left it passing, since other paths still check affordability) and a repeat-identical-results test (a random hold left it passing). Existing house-rule spec and unit tests cover repeat determinism.

## Mutation checks
- Test 1, base engine (`git checkout origin/main -- simulate.ts houses.ts engine-common.ts research.ts`): FAILS at `toBeLessThanOrEqual`, expected <= 25, received 40 (the TC stall). Undone (`git checkout HEAD -- lib`).
- Test 2, `simulate.ts:662` `!engine.inputs.autoHouses ||` removed: FAILS at `toBeGreaterThan`, expected > 25, received 15. Undone, `git diff --exit-code lib` clean.
- Test 1, `houses.ts:48` gather time zeroed: still passes. `simulate.ts:684` hold removed: still passes. Both together: still passes. So the fixture is not sensitive to those two mechanisms alone; it fails on the full base engine (instant order of house passes, wake, hold interplay). Gather-time, hold amount, wake and builder/villager-release behavior are pinned by the implementer's unit tests (`houses.test.ts`, `simulate-house-hold.test.ts`), not by this spec. Test 1 is kept: it fails at base for the real reason.

## Criteria not expressed at the API boundary
Due-ahead-of-affordability with gather window, one-house hold for 2+ houses, per-resource hold on step/order payments, step wake at the held amount, pass-two hold, builder hold and villager-count release, no-income no-deadlock, explicit house not held: these need exact control of bank, income and builders at an instant, which the simulate API exposes only through full build runs. They are covered by the unit tests, not by acceptance tests; I did not duplicate them.

## Lint
`npx tsc --noEmit && npm run lint:dup`: clean, 0 clones.
No production file modified; working tree clean after commit.
