# SGS-097 implementer report (written by manager from the agent's returned text; agent did not write the file)
Branch sgs-097-docs-issue-messages, tip 9e52088, base origin/main 9274372. Status needs_review.
Files: lib/aoe4-build-order/schema.ts (shortText in checkSimInputs label and startVillagersSchema name); schema.test.ts (labelSites/labelCases table, lengths 39/40/41/5000, whole-message equality); docs/api/openapi.json (BuildOrderIssue.message description; simulate 400 description); docs/aoe4-build-order.md (Validation sentence, 40-char cut sentence).
Tests: npm test 1511 passed, 10 skipped; schema.test.ts 379 passed; tsc, lint:dup, next build clean.
Contract spec: 67 passed, 1 failed (aoe4-simulate-api-contract.spec.ts:284, 200 body of the buildOrder request example); agent reports it also fails on origin/main 9274372 (pre-existing).
Mutation checks: removing .map(shortText) in checkSimInputs fails 6 rows; removing shortText in startVillagersSchema fails the 41/5000 start.villagers rows.
Not done: jq check on the 400 description not run; exact message strings not checked against the route code. On merge: design/M4.md edits (state dir).
