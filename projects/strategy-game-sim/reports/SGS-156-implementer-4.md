# SGS-156 implementer 4 (Rework 1)

- Ticket: SGS-156, Rework 1 (review-1 required fixes, both ticked in the ticket)
- Branch: `sgs-156-auto-houses-plan-ahead`, tip `d172c2e27acd00c40080fa28b342ef8d2567b61e` (previous 411dfb3), base origin/main
- Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-156-auto-houses-plan-ahead`

## Files touched
- `lib/aoe4-build-order/simulate-house-hold.test.ts`: "holds one house cost when several houses are due and none can start". The precondition run now uses the asserted run's builders: `holdRun([], { ...slow, wood: 1000 }, {}, { villagers: { sheep: 8 }, rally: 'stone' })`. The `>= 2 * HOUSE_WOOD` assertion stays.
- `docs/aoe4-build-order.md` ("Houses and supply"): the sentence is now exactly "Villager order payments and explicit `build house` steps ignore the hold."

## Tests
- Targeted: 1 of 1 passed.
- `npm test`: 2583 passed, 15 skipped, 0 failed (84 files passed, 1 skipped).
- Invariant this test encodes: when two or more houses are due and none can start, the hold is one house's cost.

## Pre-existing tests edited
- `simulate-house-hold.test.ts`: "holds one house cost when several houses are due and none can start". This test was added on this branch. Only its precondition setup changed, as the Rework 1 required fix asked.

## Doc claims
- "Villager order payments and explicit `build house` steps ignore the hold." Where the code makes this true:
  - `simulate.ts` `payOrder` (line 584): a villager uses `cost`, and every other unit uses `heldNeed(cost, [reserve, houseHold])`.
  - `simulate.ts` `build` uses `isHouseBuild`.
  - `nextWake` (line 814) gives an explicit house its plain cost.
  - A `produce villager` step still goes through `canAffordHeld`, so the sentence no longer claims villager steps skip the hold.

## Mutation checks
1. `simulate.ts:684`: changed `engine.houseHold = cost` to `engine.houseHold = costOf(house, count)` (the hold becomes the due count times the house cost).
   - Result: the test failed at `simulate-house-hold.test.ts:79:95`, "expected null to be +0". The barracks `startedAt` went from 0 to null.
   - Undone; the full suite passes.
2. Extra check, recorded for honesty: `simulate.ts:667`, `count = Math.min(1, planAutoHouse(...))`.
   - Result: the test still passed. The later house passes in the same instant start the second house, so 100 wood is still spent. This break limits starts per pass; it does not change how many houses are due. It does not show the precondition is weak.
   - Undone.

## Stages
- Lint: `npx tsc --noEmit && npm run lint:dup` is clean (0 clones).
- Build: `next build` passes.
- Unit tests: as above.
- Codegen: not set in REPO.md.
- Acceptance: not run (not my role).
- `git status` is clean after the commit; the diff has only the 2 files.

## Invariants
A1, A2 and A3 are unchanged. This pass touched no production code.

## Unverified assumptions added
None.

## Out-of-scope findings
None new. Review-1's non-blocking notes still stand and were not acted on:
- the `simulate-house-gate.test.ts:112` describe title
- the dead `index` column in the step table
- the `noneNegative` duplicate

## Status
needs_review
