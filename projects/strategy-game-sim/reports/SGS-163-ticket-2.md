# SGS-163 ticket report 2 (re-spec 1)

File: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-163-pin-first-arrival-in-idle-arrival-acceptance-test.md`

## Summary

"Pin the first-arrival time in the idle-arrival acceptance test" is a Chore in the aoe4-build-order component. It is test-only, about 20 lines in `acceptance/aoe4-simulate-api-depletion-engine.spec.ts`, with no dependencies and low risk. This re-spec folds in spec-gate-1 finding 1. The response has no per-villager spawn time, so the test cannot compute an exact expected `at`. Instead it asserts `at` lies in `(t1 - sampleSeconds + walkSeconds, t1 + walkSeconds]`, where `t1` is the first sample time with a produced-villager count of at least 1. The ticket states this as the strongest pin the response allows.

Two preconditions guard the bracket:
- The count first reaches 2 at a sample later than `t1`.
- The produce step started no later than `t1 - sampleSeconds`.

The criteria cover:
- the bracket, built from response and request fields only;
- the `addIdleArrival` latest-`at` mutation failing the test;
- each precondition failing loudly;
- unchanged pre-existing assertions;
- a diff limited to the spec file;
- no invariant regressions.

Changed criteria are tagged `(respec 1)`. The `## Re-spec 1 - 2026-11-15` section was appended. Lint is clean (exit 0).

## Bracket verification (read against `origin/main`)

- `simulate.ts:unitSeries`: `counts[i]` sums changes with `time <= times[i]`. Only `spawnUnit` calls `recordUnits`, so starting villagers are not counted. The first spawn is therefore in `(t1 - sampleSeconds, t1]`.
- `simulate.ts:spawnUnit`: the producer's rally is read at spawn time. The arrival is scheduled at `time + walkSeconds / moveSpeedMultiplier` and calls `assignGatherers`. On a dry node, `assignGatherers` calls `recordIdleArrival` with `state.time`. The multiplier is 1 because nothing is researched. The sibling move test pins `at: 10` for `walkSeconds: 10` through the same `moveSpeed` modifier (`engine-common.ts:villagerWalkSeconds`).
- The `produce` handler writes the berry rally when the step starts. `runInstant` runs `offerSteps` before `startProduction`. The second precondition makes sure the first villager spawned carries that rally. I added this precondition beyond the gate's proposal: without it, a villager from the default order spawned before the step starts would set `t1` while it walks to the sheep.
- If the count at `t1` is exactly 1, the second spawn is after `t1`. Every later arrival is then after `t1 + walkSeconds`, so the latest-`at` mutation lands outside the bracket.
- I verified this by reading the code only. I did not run the engine or use a scratch checkout. The mutation criterion targets a test that does not exist yet, so there was nothing to run.

## Diagrams

None. It is a single-component, test-only change, so no diagram is required.

## Open questions

None.

## Overlap

None found.
