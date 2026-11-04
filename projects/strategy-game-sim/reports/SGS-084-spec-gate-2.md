# SGS-084 spec gate 2

Verdict: NEEDS_SPEC (one gap, no owner input needed). Risk `high` confirmed (simulateBuildOrder is a criticalPaths symbol; required field added to public response).

Both gate-1 gaps are closed (page criterion now reads tooltip values against response data; build-step criterion compares villagers to villagers and rate to 2*r*60). Docs grep patterns are concrete. Depends-on base is b9481e3.

## Gap
1. Acceptance criterion "walking or constructing villager is not counted" - the last clause "at the first sample at or after steps[0].completedAt, gatherers.wood is 4 again" is false against the engine. In `completeConstruction` (lib/aoe4-build-order/simulate.ts ~L437-454), `markCompleted` runs at completion, but the builders only rejoin `engine.gatherers` in `arrive`, scheduled `villagerWalkSeconds(...)` later (the `then: wood` node is not created by the house, so the walk-back is scheduled). `walking` still holds them at completedAt, so the sample at completedAt shows 2, and a test written as stated fails on a correct implementation. Fix: say "at the first sample at or after completedAt + the walk-back time (inputs.walkSeconds, scaled by villagerWalkSeconds)", or "at the last sample of the run (duration long enough for the house to finish and the builders to return), gatherers.wood is 4", and add that the sample just after completedAt still shows 2 (builders walking back are not counted). Also state that the start-side check (`i-1` shows 4, `i` shows 2) holds because `sendWalking` runs at startedAt and samples are taken after events at that time (SAMPLE_SECONDS = 5, startedAt 30 is a sample time); the implementer may confirm the house is affordable at 0:30 from the starting wood.

## Notes
- The remaining criteria (count at t=0, mixed nodes, run-out, unchanged fields and digests, OpenAPI 2.2.0 -> 2.3.0, perVillagerSeries table, pinned toggle) are testable and match the code and Scope.
- Input validation not applicable (no new input). Invariants A2, A3, S3 named correctly. Existing-test rule is stated as a rule, not a list.
