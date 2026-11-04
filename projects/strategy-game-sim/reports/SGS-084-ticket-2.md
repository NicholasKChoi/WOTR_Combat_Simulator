# SGS-084 ticket author, re-spec 2

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-084-aoe4-gather-rate-per-villager.md
Base checked: origin/main b9481e3. Scope unchanged; six criteria tagged `(respec 1)`.

## Gate findings resolved
1. Page criterion (rendered height): now value-based. Run `start 4 sheep 2 wood -> sheep`, keep the 200 body, hover the Gather rates plot at a fixed point, read the tooltip time label (mapped to sample i via `times`) and the `Food` value; toggle, re-hover, read again. Expect unchecked = `gatherRates.food[i]`, checked = `gatherRates.food[i] / gatherers.food[i]` (numeric, small tolerance, in `toPass`/`expect.poll`). Explicitly forbids pixel/line-height assertions. The pinned criterion uses the same tooltip read on `Food (pinned)`.
2. Build-step criterion (mixed units): input `start 2 sheep 4 wood -> sheep` + `@0:30 build house with 2 from wood then wood`; at the first sample at or after `steps[0].startedAt`, `gatherers.wood` goes 4 to 2 (n = 2) and `gatherRates.wood` drops by `2 * r * 60` with r derived from the previous sample; `gatherers.wood` is 4 again at the first sample at or after `completedAt`. Grounded in `startConstruction` (`sendWalking` removes builders from `engine.gatherers`) and the sample loop in `simulateBuildOrder` (samples taken after `runInstant` at that time).

## Notes folded in
- Docs criterion now names its greps: `Per villager` and `number of villagers gathering` in docs/aoe4-build-order.md; both match nothing on b9481e3 (checked), and both phrases are in Scope 4's required text. (`gatherers` alone already matches 11 lines today, so it was not used.)
- Depends on refreshed to main `b9481e3`.
- Start inputs rewritten in valid paste form (`start N node ... -> rally`, summing to 6); `start 3 sheep 3 berry -> sheep` named for the mixed-node case (berry starts are used in existing depletion specs).

## Diagrams
None (unchanged: single component, read-only count in the sampling step).

## Open questions
None.

## Overlap
None new. SGS-082 does not touch results.tsx.
