# Batch 7 simplify
All three rebased onto origin/main 20f59e4; no pushes.
- SGS-013 sgs-013-aoe4-design-doc: rebased clean. Docs only; no change. Checks not run (no change). Tip 555bb41
- SGS-014 sgs-014-aoe4-data-model-loader: rebased clean. Reviewed comments/code; all comments meet the bar; no change. Checks not run. Tip 81dc459
- SGS-015 sgs-015-aoe4-series-chart: rebase conflicted on package-lock.json name line; kept main's name (wotr_combat_simulator), the branch's recharts changes retained; the branch's second commit "Restore package-lock root name" became redundant and was skipped (now 1 commit ahead). git diff origin/main -- package-lock.json has no "name": "sgs-" lines. Simplify: removed unused re-exports (ChartSeries, toChartRows) from line-chart.tsx. tsc --noEmit clean, npm test 71 passed. Tip 7524915
