# SGS-097 acceptance-test report 1

Verdict: PASS (one known pre-existing failure). Commit 4458555c7e0b12069b11e4fd3e32212380012736 on sgs-097-docs-issue-messages.

New file: acceptance/aoe4-simulate-api-issue-labels.spec.ts (19 tests, all pass).
- 16 tests: for keys of 39, 40, 41, 5000 chars at inputs.trips, inputs.influenceCoverage, inputs.nodeAmounts and start.villagers, exactly one issue message equals the full expected label (cut to 40 + "..." above 40), and no message exceeds 200 chars.
- 3 tests: the three request-level messages quoted in the 400 description are returned by the route as a single syntax issue with no step.

Run: harness ran (Playwright, own dev server). Labels spec + quoted-ids + contract + issue-shape: 105 passed, 1 failed. The failure is contract spec :284 (buildOrder request example 200 body), pre-existing on main per the manager. tsc and lint:dup clean.

Mutation checks (each undone, git diff --exit-code clean):
- checkSimInputs: dropped path.map(shortText): 6 tests failed (41/5000 for trips, influenceCoverage, nodeAmounts).
- startVillagersSchema: dropped shortText(node): 2 tests failed (41/5000 start.villagers).
- pages/api/aoe4-build-order/simulate.ts: changed "request: missing buildOrder" text: the buildOrder-absent test failed.

Not covered through the boundary: the removedText and notAnObject messages were not mutated (same code path style; the first run passed). Prose wording in docs/aoe4-build-order.md and the BuildOrderIssue.message description is not testable beyond the grep checks.
