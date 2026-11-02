# SGS-048 implementer 1
Branch sgs-048-aoe4-pin-compare, tip 27d0baa4eba24e417b8e5cf47032e487c9ccbb40, worktree .claude/code-factory/worktrees/sgs-048-aoe4-pin-compare, base origin/main 77fa279.
Status: needs_review
Files: compare.ts, compare-panel.tsx (new); chart-rows.ts (PinnedSeries, pinnedKey, toChartRows pinned); line-chart.tsx (dashed pinned lines); results.tsx (pinned prop); pages/apps/aoe4-build-order.tsx (pinned state, ComparePanel); docs/aoe4-build-order.md; compare.test.ts (new), chart-rows.test.ts (added tests).
Results: vitest 772/772; tsc and lint:dup clean (0 clones); next build ok; Playwright 379/379. No pre-existing tests edited.
Mutation checks (all failed as expected, restored): delta p-c; indexOf offset; age match fixed to 2; `?? 0` for age; union to intersection; pinned key not prefixed.
Manual 1280px check via a throwaway Playwright spec (deleted): pinned path dashed, current not, 7 rows, legend toggle of Food (pinned), axis labels not overlapping.
Not written: new Playwright acceptance tests (separate gate owns them).
Notes: delta zero shows "0"; nonzero time deltas "+m:ss"/"-m:ss". compareRows takes KeyNumbers.
Out-of-scope: none.
