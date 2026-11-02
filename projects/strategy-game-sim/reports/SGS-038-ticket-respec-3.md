# SGS-038 ticket re-spec 3

Ticket: `tickets/SGS-038-aoe4-depletion-engine.md` (Risk, Depends on and status unchanged).

## What was wrong

The ticket said the existing tests pass unchanged. They do not: seven existing tests pin values that SGS-038's own contract changes. On branch `sgs-038-aoe4-depletion-engine` at 93a1e2b, 4 unit tests and 7 Playwright tests fail, and the contract spec's `locations` record fails `tsc` and `next build` (TS2741).

## What changed in SGS-038

"Tests that must change" now lists each edit with its new expected value:
1. `simulate.test.ts` seam names: add `assignGatherers`, count 12 to 13.
2. `simulate.test.ts` "are empty while every node is infinite": six null `depletions` rows from `FINITE_GATHER_NODES`.
3. `validate.test.ts` resolveSimInputs defaults: `nodeAmounts: expect.any(Object)`.
4. `validate.acceptance.test.ts` runtime names: add `nodeRefIssue`.
5. Contract spec `locations`: add `nodeAmount`, and `count` reads both the `produce` and the `move` integer schema.
6. Depletion spec: six null rows, and the describe and test titles renamed.
7. Timelines research-extension food: 596.2798390913501 to 618.3789316586852 (the `createdBy` rule).

The OpenAPI 200 example's six null rows are now in Scope. The infinite, `createdBy`, OpenAPI and gate criteria are tagged (respec 3). The gate now also requires `next build`, the full `npm test` and the full `npm run acceptance`.

Verification: I applied all seven edits to 93a1e2b in a throwaway worktree. `tsc` exited 0, vitest passed 806/806, Playwright passed 368, `next build` exited 0 and `lint:dup` found 0 clones. I then removed the worktree.

## Sibling audit (measured by adding SGS-039's amounts to 93a1e2b)

- SGS-039: tests that check the default amounts take the new values. That covers four SGS-038 tests: two in `simulate-depletion.test.ts` and two in `validate.test.ts`. Every other test that moves pins the six finite nodes `null` through one shared value. Those are 5 unit tests, the 4 depletion-spec requests and the 4 timelines tests. The OpenAPI 200 example's `depletions` take the default amounts. In the seam-name list, the `toHaveLength` count rises by one. The sheep run-out time is about 783 s on the SGS-038 base.
- SGS-040: the timelines research-extension test indexes its appended steps from `english1tc.steps.length`, because the ENG 1TC reaction shifts them by one. Its values are unchanged.
- SGS-042: `accrueWait` joins the seam-name list and the count rises by one. In the depletion spec, the `research textiles` request still has a step `waiting` at 1200 s (an age 2 tech while the order stays in age 1), so it now expects one `step-stuck` (`prerequisite`, at 0). The criterion was updated to match.
- SGS-046, 047, 050, 051: no change needed. `listBuilds()[0]` stays ENG 1TC, and none of them changes an engine pin or an export list.

Open questions: none.
