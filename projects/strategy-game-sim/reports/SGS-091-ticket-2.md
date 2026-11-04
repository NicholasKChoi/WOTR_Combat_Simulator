# SGS-091 ticket re-spec 2 (against b9481e3)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-091-aoe4-engine-cleanups.md

## Gate gaps resolved
1. Scope 1 echo sites: now lists every schema.ts site that quotes a user string: all six nodeRefIssue reasons (incl. `deposit 1 is written gold`, `deposit number is outside 2..N`), knownId, knownResource, triggerKindCheck, stepProblem, civ check, simInputsSchema unknownNode (trips key, houseBuilderSource) and influenceCoverage key. States that crossFieldProblems/crossStepProblems/startProblems echo only catalog-validated ids and stay. AC table rows added for each long-reachable site; `never runs out` and `deposit 1` are reachable only by short values (`farm`/`wood`, `gold#1`; DEPOSIT_NUMBER forbids leading zeros), so they get short unchanged rows.
2. Old AC 58 replaced: new `simulate-depletion.test.ts` case "lists node warnings by time, not by node order" with fixed inputs (PAUSE; start berry 1, stone 3, rally wood; autoHouses false; nodeAmounts berry 300, stone 10). Asserts node-depleted order stone then berry and non-decreasing `at`. Mutation criterion: removing simulateBuildOrder's sortWarnings (with the depletionResults sort gone) fails it. Plus grep criterion: sortWarnings in depletion.ts matches only its definition.
3. depletion.test.ts candidates named: "returns its warnings sorted by at" is deleted (not wrapped); "words run-outs by id..." and the recordIdleArrival/recordRunOut cases keep expected values; sortWarnings unit cases stay and pin tie order at one instant.
4. Invariants: A3 and S3 named with the reason.
5. Source note now b9481e3; Scope 5 names farmIdleWarnings (and houseWarnings, step-stuck) in the merged list.
Also: Context and Scope 7 doc sentence reworded from "unknown-id message" to "issue message that quotes it" (triggerKind/action issues are not unknown-id code); LOC ~70.

## Checks run
- Throwaway worktree at origin/main b9481e3 (removed): probe test with the Scope 5 inputs passed on current code. Removing only the depletionResults sort: across lib/aoe4-build-order, components/apps/aoe4-build-order and pages (42 files, 1304 tests) the only failure was depletion.test.ts "returns its warnings sorted by at". Removing the simulate.ts sort as well: the probe test failed (stone/berry order flipped).
- `git grep sortWarnings -- lib/aoe4-build-order/depletion.ts` today: return in depletionResults plus the definition (end state: definition only).
- Existing grep criteria (`'villager'` in gather.ts, RESOURCE_ORDER, `'order|inputs|issues' in` in the handler) match today's code at the sites Scope moves.

## Diagrams
None (single component, outside the core control loop).

## Open questions
None.

## Overlap
None found.
