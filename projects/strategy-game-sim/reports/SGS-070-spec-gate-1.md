# SGS-070 spec gate 1

Verdict: NEEDS_SPEC (3 gaps, none owner-only)

Checked against origin/main: line-chart.tsx, line-chart.test.ts, both acceptance specs, docs/aoe4-build-order.md, design/M4.md C12 and "Charts (M4.11)", INVARIANTS, SGS-071, TASK-GRAPH. Grounding, contracts (SeriesLegend/MarkerLegend/placeMarkers signatures match C12), dependencies, size, risk, diagrams, decisions, on-merge, docs scope and the rule for existing tests all pass.

## Gaps

1. Scope 2 (top margin) / criterion 7 - where labels are drawn relative to the margin is unstated - Today labels use `insideTopLeft/Right` with `dy = row*14`, so they sit inside the plot and over the lines. Growing the top margin only shifts the plot down; labels stay inside it, so "labels do not cover the plot's lines any more than today" is unachievable or meaningless as written, and the implementer must guess whether labels move into the margin. Fix: state the label position (e.g. labels drawn in the extra top margin, above the plot area, row r at y offset r*14 from the chart top; or "labels stay inside the plot and the margin growth is only X"), and drop or restate the "do not cover lines" clause.
2. Criterion 4 / Scope 1 (swatches) - "dashed stroke" on a swatch that Scope says is HTML, not SVG - Nothing says how a test observes solid vs dashed (inline SVG `<line stroke-dasharray>`, CSS `border-top: 2px dashed`, a data attribute). Also the swatch colour for a pinned item (current series' palette colour, else `series.length + i`, as the chart line) is not stated, and "visibly dimmed" for hidden items has no observable form. Fix: specify the swatch element and its observable attribute (e.g. `span[data-testid="chart-series-legend-swatch"]` with `border-top-style: dashed|solid`, or SVG `stroke-dasharray="6 4"` / none), state the pinned colour rule, and dimmed = `opacity` 0.5 (or `text-muted`).
3. Criterion 6 - "chart's top margin is `5 + rows × 14` px" has no observable in the DOM - recharts does not expose the margin; a Playwright test cannot confirm it. Fix: name the observable (e.g. the plot clip rect / `.recharts-cartesian-grid` first rect `y` equals `5 + rows*14`, with rows read from the max `row` of rendered labels + 1), or have SeriesChart expose `data-label-rows` on the wrapper and assert against that.

## Notes

- Criterion 2 count is off: today `git grep` with that pattern finds 9 lines (line-chart.tsx 1: only `<Legend`, the import line does not match; aoe4 spec 5; pin-compare 3), not 10.
- Measurement mechanism (Scope 2) leaves open where the SVG text element for `getComputedTextLength` lives (a hidden `<svg><text>` in the wrapper, font-size 12, inherited font-family) and how a resize re-measure triggers; name it. `SeriesChart` is server-rendered in `line-chart.test.ts`, so the measure must be effect-only (the 8 px/char default covers SSR).
- Acceptance spec line 435 (`legend.locator('.recharts-legend-wrapper')` count 0) and the test titles saying "dashed" at lines 404 and 454 should be updated with the dash change; Scope lists the dash assertions but not the titles.
- Invariants: S1 holds (new file imports only chart-rows, model, format-time). No LESSONS entries exist. SGS-071 (depends on this) matches the `pinnedAgeUps` deferral.
