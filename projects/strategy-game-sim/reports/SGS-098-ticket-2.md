# SGS-098 ticket author, re-spec 1

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-098-delete-failing-aoe4-acceptance-tests.md

## Summary

The ticket "Delete the AoE4 acceptance tests that fail on main" belongs to the aoe4-build-order component, risk low. It deletes test code only (0 business-logic lines) and has no dependencies. This pass resolves the two blocking gaps from spec gate 1 and folds in the gate's notes:

1. Contract examples loop (`acceptance/aoe4-simulate-api-contract.spec.ts`, `for (const name of Object.keys(requestExamples))` in the `examples` describe): the loop header becomes `for (const name of ['goldRunOut'])`. This is the only permitted edit to a surviving test. `requestExamples`, `okExamples` and `expect200` stay, because other tests use them; I checked this by grep on origin/main 9328355. A new criterion checks with `--list` that the goldRunOut row is present and the buildOrder row is gone.
2. Criteria 2 and 3 now agree: added lines are only that loop header and import lines that drop now-unused names. The re-indentation allowance is removed.
3. Unused names: `tsconfig.json` does not set `noUnusedLocals` or `noUnusedParameters`, and the repo has no ESLint config, so tsc does not catch unused names. A per-file grep rule replaces the vague criterion, with a cross-file rule for `helpers.ts` exports.
4. Spear/longbow: `MAN_AT_ARMS_STEP`, `CASTLE_LANDMARK_SECONDS`, `MAN_AT_ARMS_START_SECONDS` and the explaining comment line are named as removals. `GOLD_NODES`, `simulate`, `WARM_UP_TIMEOUT_MS` and the warm-up stay. The `Result.steps` member may be deleted as a whole line.

## Checks run against origin/main (9328355)

- `git grep -n "Object.keys(requestExamples)" -- acceptance/` finds only the contract spec loop.
- `git grep -lw` for the three constants finds only `aoe4-simulate-api-spear-longbow-build.spec.ts`. After the change it should find nothing.
- I read `tsconfig.json`: it has neither `noUnusedLocals` nor `noUnusedParameters`.

## Diagrams

None (single component, test-only).

## Open questions

None.

## Overlap

None with other tickets. SGS-095 waits on this ticket so that its acceptance suite runs green.
