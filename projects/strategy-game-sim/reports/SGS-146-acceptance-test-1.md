# SGS-146 acceptance-test 1

Verdict: PASS. Tip 16cbce6c. No tests written and no commit made: the implementer's acceptance test already covers the ticket and survived mutation.

## Harness
`acceptance:setup` ran (node_modules linked, Chromium installed). `npx playwright test acceptance/aoe4-chart-layout.spec.ts`: 26 passed, 0 failed.
`vitest chart-layout.test.ts`: 44 passed. `commands.lint` (tsc and jscpd): exit 0.

## Criteria coverage
- Same-render pair, edge check and reported position (criteria 1, 2): unit tests `moveChartByKey` in `components/apps/aoe4-build-order/chart-layout.test.ts` (the ticket allows a pure-helper target). They pass.
- Key press mid-drag, before and after 4px, then a drop (criterion 3): acceptance test at `acceptance/aoe4-chart-layout.spec.ts:293`. It asserts the order and an empty status after each key press, then the drop order and its status.
- Arrows reorder again after the drag ends (criterion 4): the last step of the same test (ArrowUp after the drop reorders).
- Single arrow press, focus and announcement (criterion 5): existing tests at lines 137 to 196 pass.
- Doc (criterion 6): the `docs/aoe4-build-order.md` diff adds the mid-drag rule.
- Edge keys at either end (criterion 2) are covered by existing acceptance tests 8 to 10 plus the unit `returns null` rows.

## Mutation check
- Break: replaced `if (drag.sessionActive()) return` in `components/apps/aoe4-build-order/results.tsx` (`moveByKey`) with a comment.
- Result: test at line 293 failed at `expectLayout` (spec.ts:302), the first ArrowDown pressed mid-drag, with the order changed. This is the assertion naming the behavior.
- Undone: `git checkout -- results.tsx`; `git diff --exit-code` clean; worktree clean.

## Not expressible
- The same-render pair at the component level (no jsdom, per the ticket); the pure helper covers it. The ticket also lets the acceptance test cover only the mid-drag case.
- The "fails at base" claim was not run against base. The mutation, which restores base behavior in `moveByKey`, shows the test fails without the guard.

No processes left running.
