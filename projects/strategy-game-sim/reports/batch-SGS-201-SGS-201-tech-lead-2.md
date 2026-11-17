# Tech-lead report: batch SGS-201

Decision: no blockers, no untested hotspots. Draft PR opened.

PR: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/210, base main, new, head 79d17e17e0a730a239e6e465aa5a793379d5aa24

Merge risk: **low** - one ARIA attribute expression on a chart control; no public API, schema or critical-path symbol touched, a revert fully undoes it, and tests pin both values.

Review focus: No hotspots: a one-expression inversion, pinned by the SeriesLegend markup unit test (chart-legend.test.ts) and acceptance/aoe4-legend-pressed-state.spec.ts, which assert shown and hidden items in the same render.

Reviewed: merge-base(origin/main)...79d17e1, 9 files, +129/-13 (production +1/-1 in chart-legend.tsx; rest tests and one doc sentence). Invariants A1-A3 not touched; no security, irreversibility or concurrency concerns; no open questions answered.

Non-blocking notes: none.
