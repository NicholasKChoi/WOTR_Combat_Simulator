# SGS-080 ticket author 3 (re-spec 2)

File: projects/strategy-game-sim/tickets/SGS-080-aoe4-one-villager-per-farm.md

## Gaps closed (spec gate 1)
1. End state: SGS-080 and SGS-081 ship as one stack in one batch, never 080 alone; suite and tech-lead run on the
   stack top. On 080's branch `npm test` passes except shipped-build assertions that fail only because shipped builds
   still have idle farmers; each listed by file and test name, not loosened/skipped/re-pinned; manager folds into 081.
   tsc and lint:dup must pass. Depends on / Split / Scope 5 / last criterion updated.
2. Auto-houses: `houseBuilderSource` check unchanged (gatherers only, so idle farmers alone never make farm a source);
   once farm is chosen, builders come idle first through `sendWalking`. Comment above `houseBuilderSource` and the
   doc line "Builders are taken from gatherers only, never from idle villagers." are rewritten (doc line added to
   Scope 4). New criterion: 3 farms / 4 farmers / houseBuilders 2 -> 2 gathering, 0 idle while building; 3 and 1 after
   return, idleVillagers 2; 0 farms / 2 idle / no other gatherers -> no auto-house starts.
3. Start state: slots = count of `start.buildings.value` entries equal to `createdBy`, where `start` is the
   `rules.startingState` override result; overflow moves to idle and is recorded at `at` 0. Criterion covers the
   override path and the "state.buildings still empty" break.
4. tieRank: `farm-idle` returns `[0, FINITE_NODE_REFS.length, 0]`, checked before the node fallthrough. sortWarnings
   case: step-stuck, farm-idle, idle-arrival(stone), node-depleted(sheep) -> node-depleted, idle-arrival, farm-idle,
   step-stuck.

## Notes applied
- Helper named `slotsAt` (returns Infinity without `createdBy`); criterion forbids a `capacity` name.
- No-new-input criterion is now `git diff --exit-code origin/main -- lib/aoe4-build-order/schema.ts` plus a jq diff of
  the seven request schemas in `docs/api/openapi.json` (ran the jq diff on origin/main: empty).
- SGS-077 is integrated (main 1bdf1d6, OpenAPI 2.1.0): Overlap section reduced, version bump fixed at 2.2.0.

## Checks run
- `git show origin/main:lib/aoe4-build-order/simulate.ts | grep -c "'farm'"` = 0 (criterion: stays 0).
- jq schema diff on origin/main vs itself: empty; jq present at /usr/bin/jq.
- Confirmed `houseBuilderSource`, `sendWalking`, `startConstruction`, `createEngine` order, `tieRank` on origin/main.

## Diagrams
State diagram updated (start-state transitions, auto-house takes idle first).

## Open questions
None.

## Overlap
SGS-081 (stacked; its Depends on already says one stack). TASK-GRAPH row for SGS-080 still lists SGS-077 as a dep;
SGS-077 is integrated, manager may clear it.
