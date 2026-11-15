# SGS-160 implementer report

- Branch sgs-160-results-split-chart-id-filter, tip ff83f4fe76b4ebea5079eefedfd648c72ce05ad5, base origin/main e50e074.
- Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-160-results-split-chart-id-filter
- Files: acceptance/aoe4-results-split.spec.ts line 45, filter now `CHART_IDS.some((chart) => chart === id)` instead of `startsWith('chart-')`. Only file in `git diff --name-only origin/main`.
- Tests: whole spec file 5/5 pass. tsc and lint:dup clean. No build run (test-only change).
- Base failure: at base spec, the test fails at the filter assertion; received has chart-reorder-help and chart-order-status ahead of the four charts.
- Mutations of results.tsx (reverted, git status shows only the spec file):
  - Wrap each SeriesChart in a div: fails at line 45, received `[]`.
  - Move chart-order-status after the charts: fails at line 46 (`slice(-4)`), received ends with chart-order-status.
- Name independence: the filter uses only CHART_IDS membership, so extra hidden paragraphs with any test id leave line 45 passing. Not run with an extra paragraph; this follows from the code.
- Doc claims: none added. Pre-existing tests edited: none besides the target spec line.
- Unverified assumptions added: none. Out-of-scope findings: none.
- Status: needs_review
