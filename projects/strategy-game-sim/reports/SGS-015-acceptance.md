# SGS-015 acceptance

Result: PASS

- Branch sgs-015-aoe4-series-chart at 0b6419f (base main 43a0331), task worktree.
- Ran `npm ci` (succeeds with recharts 3.10.1 in the lockfile) then `npm run acceptance` (Playwright, Chromium, own next dev server): 209 passed, 0 failed, in 10.2s. Covers landing, combat simulator page and fight API specs; no regression.
- Node was v22.17.0 against `engines` 24.x; no effect on results.
- No new spec: the ticket adds an unused component and no public surface (no page, route or API). Series and toggle assertions belong to the later page ticket (SGS-022).
- Worktree clean after the run (no tracked files modified); no processes left running.
