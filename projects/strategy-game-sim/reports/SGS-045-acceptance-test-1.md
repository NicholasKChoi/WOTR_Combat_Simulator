# SGS-045 acceptance-test 1

Result: PASS. Tip ffe63c6 on sgs-045-aoe4-severity-message-lists (on top of e68dc07). Playwright ran: 19/19 in acceptance/aoe4-build-order.spec.ts.

Added (1 test): warnings list order (warnings entries then warning-severity notes, result order), info list order, failed run between successful runs keeps expansion, reload resets to collapsed.

Existing tests already prove: data-severity/data-code, toggle texts (Show 2 / Show 1 info message, Hide), aria-expanded, expand/collapse, persistence across runs, no warnings element when none (patched), 400 shows only simulation-error, notes test expands first, no-notes toHaveCount(0).

Mutations (all failed the tests, all reverted): info default expanded; notes before warnings; swap warning/info placement; remove WarningMessages empty guard; reset expanded on run start.

Notes: eslint config could not be run from the worktree (eslint migration error); lint not verified for the new test.
