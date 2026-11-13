# SGS-157 spec gate 1

Verdict: NEEDS_SPEC

Read at origin/main (`git fetch origin` hit the 120 s tool timeout and was backgrounded; the refs read were present). Checked `line-chart.tsx`, `chart-rows.ts`, `result-series.ts`, `results.tsx`, `acceptance/aoe4-chart-views.spec.ts`, `line-chart.test.ts`, and `docs/aoe4-build-order.md`. Checked TASK-GRAPH, INVARIANTS, LESSONS and PROJECT.md.

Grounded: every named file and function exists (`SeriesChart`, `toChartRows`, `buildingSeries`, `b.counts`, `chart-units-produced`). The doc paragraph after the chart table exists and stays true. Existing acceptance Buildings tests only check legend names, `path[data-series]` counts and line presence, so none breaks. Pinned-line tooltips use `tooltipType="none"`, so only current-run series reach the tooltip. No other open ticket touches these files. The `Risk` of standard and `On merge` of none are fine.

## Gaps

1. Acceptance criteria / Scope - behavior at count 0 and at the y-axis floor is unspecified - A building with count 0 (before it is built) and a negative offset gets a drawn value below 0. The recharts default y domain starts at 0, so the line is clipped or drawn outside the plot. Criterion 5 (whole ticks only) also constrains any domain fix, so an implementer must guess. Proposed fix: add a rule and criterion such as "a line at true count 0 is still fully visible inside the plot (the y domain's lower bound allows the lowest offset while ticks stay whole), and no tick below 0 is shown". Alternatively state that the offset is applied upward only for counts at the floor.
2. Acceptance criteria 4 and 5 - no testable seam named - The tooltip formatter and the y-axis ticks only exist in a browser render, since `renderToString` in `line-chart.test.ts` shows neither. "A test fails if the drawn value is shown" and "only whole-number ticks" cannot be unit-tested as written, and Scope does not say which level carries them. Proposed fix: require either a pure exported formatter (given a row and a series key, returns the true count) tested in Vitest, or a Playwright hover test in `acceptance/aoe4-chart-views.spec.ts` that reads the tooltip text. Pair that with an acceptance check that tick labels are integers.
3. Acceptance criterion 1 - "drawn at different y positions" is only unit-checked on the pure function - The criterion promises drawn positions, but the unit test covers only the offset function. Nothing says the chart's row data really carries the offsets, or that the Units view and other charts' rows are unchanged (criterion 6). Proposed fix: state that the row-building function, with and without the opt-in, is also unit-tested: with it, two equal-count series get different row values; without it, rows equal the raw values.
4. Invariants field - lists `none`, but the files touched are under `components/apps/aoe4-build-order/**`, which are the Paths of A1-A3 - The field must name entries whose Paths it touches. Proposed fix: set `Invariants: A1, A2, A3 (paths touched; not affected, display-only change)`.

## Notes

- Offset spacing shrinks as the building count grows (a total spread below 1 split over N slots). With 10 or more buildings the spacing may be only a few px on the 360 px chart. The owner's complaint is visibility, so consider a minimum spacing in the criteria (for example "adjacent slots differ by at least 0.05 of a building") or accept the limit explicitly.
- Slot order is unspecified (current series in order, then pinned-only keys). Say so, so the "same as a chart that never had it" criterion has one meaning.
- The offset logic needs `hidden`, which is state inside `SeriesChart`, so rows must be built there (not in `results.tsx`). The Scope wording already implies this.
- The Unverified assumptions entry is adequate (Tooltip `formatter` payload, `Line` display value). Add that a `Line` `dataKey` / separate display key leaves `data-series` and the legend as they are, if the implementer uses a separate key.
