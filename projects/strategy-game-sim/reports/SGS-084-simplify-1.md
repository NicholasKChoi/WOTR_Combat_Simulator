# SGS-084 simplify pass 1

Result: no changes.

Tip SHA: 94a0c7b6cfab642aba3165113a7be6aa9f8031c6 (unchanged). The task named 32fda03 as the tip, but the worktree HEAD is 94a0c7b, a descendant that adds the acceptance spec commit. No commit was made.

Reviewed `git diff 9dfe36f...HEAD` for non-test source: simulate.ts (gathererCounts, gatherers series), model.ts, result-series.ts (perVillagerSeries reuses resourceSeries), results.tsx (gatherRateSeries helper shared by live and pinned runs), line-chart.tsx (headerControls). No duplication, dead code, narrating comments, or missed helper reuse worth changing. Test and acceptance files and openapi.json were left alone by instruction.

Checks: not re-run, since nothing changed.
