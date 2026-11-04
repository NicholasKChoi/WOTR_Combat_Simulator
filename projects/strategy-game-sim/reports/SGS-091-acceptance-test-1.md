# SGS-091 acceptance-test 1: PASS

Base tip 03be58b; new tip recorded below. Harness ran (Playwright, own next dev).

New file: acceptance/aoe4-simulate-api-quoted-ids.spec.ts (16 tests)
- 5 sites (unit, start.rally node, action, civ, trips key) x lengths 40/41/500: 40 quoted whole, longer cut to 40 + "..." in the HTTP 400 issue message, never carrying 41 a's.
- warning order: POST with stone and berry nodes; node-depleted warnings name stone then berry and all warnings are in non-decreasing `at`.
(Trips key path `inputs.trips.<key>` keeps the full key by design; the test strips that prefix.)

Results: new spec 16/16 pass. npm test 1413 passed, 10 skipped. tsc and lint:dup clean (0 clones). Full npm run acceptance: 754 passed, 1 failed: combat-simulator-battles.spec.ts:150 (untouched combat area, flaky waitForResponse timeout); passes 7/7 on rerun.

Mutations (all reverted, git diff clean):
- simulate.ts line 1036 sortWarnings removed: warning-order test failed.
- model.ts shortText made identity: 10 of 16 failed.
- schema.ts civ site un-truncated: civ 41/500 rows failed.

Failures: none (impl-defect / spec-gap / BLOCKER: none). Criteria not expressible: none beyond implementer's unit tests (schema cache, grep criteria).
