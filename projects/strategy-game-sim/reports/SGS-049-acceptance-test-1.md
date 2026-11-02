# SGS-049 acceptance-test 1: PASS (tip 8484e87)

Written by the manager from the agent's returned text.

- Added two Playwright tests in a new commit 8484e87: pinned run (pinned lines 6 4, markers 8 2, markers still draw) and shortened horizon (only markers within it, on every chart). All 7 `chart markers` tests pass.
- All other criteria were already proven by existing tests (counts and data-*, stroke colours, dash, legend order/swatches/absence, no marker for start -> sheep, label rows at 1280/768/390, end-of-horizon marker, Food toggle).
- Mutation checks: dasharray 8 2 -> 6 4, fixed stroke, reversed legend order, markers dropped on one chart each failed tests. Changing a hex in MARKER_COLORS passes the browser tests (they import the table); chart-rows.test.ts pins the exact hex.
- The agent did not run the full suite or tsc; the suite step follows.
