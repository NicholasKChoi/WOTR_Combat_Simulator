# SGS-055 implementer 1
Branch sgs-055-aoe4-m3-playwright-flow, tip 6fef201b89fcd3351b6e36aa894ba9f8b63a658e, worktree .claude/code-factory/worktrees/sgs-055-aoe4-m3-playwright-flow. Status: needs_review.
Files: acceptance/aoe4-build-order-m3-flow.spec.ts (new, 3 tests); acceptance/helpers.ts (AOE4_PAGE, openPage, runSimulation exported); acceptance/aoe4-build-order.spec.ts (imports them, local copies and PAGE const removed).
Tests: m3-flow + aoe4-build-order specs: 35 passed (Node 24, ACCEPTANCE_PORT=3871). npm test passes. tsc and lint:dup clean.
Mutations: sheep amount 3000 -> 99999999: flow test failed at node-depleted toMatchObject; reaction step removed from english-1tc.json: reaction test failed (data-reaction); both reverted.
Notes: the ticket's grep for openPage/runSimulation finds 4 lines, not 2: aoe4-build-order-pin-compare.spec.ts and aoe4-step-table.spec.ts keep their own openPage (merged after the ticket). Left alone (out of scope). Ticket's helper list otherwise matched code; used only the ticket's test ids.
No pre-existing tests edited. No processes left running.
