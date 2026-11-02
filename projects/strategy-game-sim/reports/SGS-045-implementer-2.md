# SGS-045 implementer 2 (rework 1)
Branch sgs-045-aoe4-severity-message-lists, worktree .claude/code-factory/worktrees/sgs-045-aoe4-severity-message-lists.
Added Playwright test in acceptance/aoe4-build-order.spec.ts: patched successful run with only an info warning; asserts simulation-warnings count 0, charts drawn, toggle "Show 1 info message".
Mutation: removed the empty-list guard in WarningMessages; test failed at the count-0 assertion; guard restored.
Optional tidy: InfoMessagesProps interface; persistence test second response (run counter) adds a third info message, final assertion is 3.
Checks: tsc and lint:dup clean, lint clean, npm test 759 pass, page spec 18 pass.
Status: needs_review.
