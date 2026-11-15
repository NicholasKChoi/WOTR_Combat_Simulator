# Tech-lead: SGS-161

Decision: no blockers, no untested hotspots. Draft PR opened.

PR #170 (base main): https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/170
Merge risk: low (presentational axis props, no public surface or critical path, revert undoes it, browser test pins it).
Review focus: No hotspots.

Reviewed: origin/main (d4fd59a)...774514b; line-chart.tsx +4/-1 (X_TICK_MARGIN_PX=12, X_AXIS_HEIGHT=40 on XAxis), acceptance/aoe4-chart-views.spec.ts +35 (tick overlap, clipping, overflow at 360/768/1280 over CHART_IDS). Only one XAxis exists in components. No invariants touched, no security or irreversibility issue.

Non-blocking: the XAxis height change shrinks the plot by 10 px vertically; marker placement uses only width/margins, so unaffected.
