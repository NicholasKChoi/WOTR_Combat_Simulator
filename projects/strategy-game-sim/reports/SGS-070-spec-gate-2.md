# SGS-070 spec gate 2

Verdict: READY

All three gate-1 gaps are closed and nothing new blocks.

- Gap 1 (label position): labels go in extra top margin, margin.top = 5 + rows*14, dy = (row - rows)*14. Stated and consistent with criterion 7.
- Gap 2 (swatch): span `chart-series-legend-swatch`, observable `border-top-style`/`border-top-color`, pinned colour rule matches line-chart.tsx lines 96, dimming = opacity 0.5.
- Gap 3 (margin observable): `data-label-rows` on the wrapper plus first `.recharts-cartesian-grid` rect y.
- Grep count: 9 matches on origin/main, as the ticket says.
- Contracts match design C12 (SeriesLegend, MarkerLegend, placeMarkers with labelWidth?, exported PlacedMarker). `seriesColor` is already exported from chart-rows.ts. `PlacedMarker` is not yet exported, and the ticket says to export it.
- Existing-test rule, test titles (acceptance spec lines 404, 454) and the legend-wrapper assertion (line 435) are listed.
- Measurement is effect-only with an SSR fallback; no open questions; Risk standard is defensible; S1 holds; no LESSONS entries; docs in scope.

## Notes
- Implementer should confirm in the browser that recharts does not clip ReferenceLine labels drawn above the plot (the default `ifOverflow` of `discard` should not clip them). Criterion 7 would catch it.
- pin-compare spec line 77 region and the aoe4 spec lines 194-202, 448-449 need the new selectors (already in Scope 3).
