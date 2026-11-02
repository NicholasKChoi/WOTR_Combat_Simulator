# SGS-049: Draw age-up and research markers on the three charts

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M3 / M3.10 (UI side)
- **Priority**: medium
- **Risk**: standard
  <!-- Plan said medium. One component, no API change, no `lib/**` edit, so not high; not low because it edits `line-chart.tsx`, `chart-rows.ts` and `results.tsx` that SGS-048 and SGS-052 also edit, and adds test ids a later Playwright flow relies on. -->
- **Invariants**: S1 (components import `ChartMarker`/`CHART_MARKER_KINDS` from `lib/aoe4-build-order/model.ts` only, never `data.ts` or another app); A1 and A3 are not touched (display only)
- **LOC estimate**: 70 (`chart-rows.ts` constants and `markerLabel` ~25; `line-chart.tsx` reference lines, label stacking and legend ~40; `results.tsx` 3 props; business logic only, tests and docs excluded)
- **Depends on**: SGS-035 (moves `formatMinSec` to `lib/aoe4-build-order/format-time.ts`, no re-export), SGS-044 (`ChartMarker`, `ChartMarkerKind`, `CHART_MARKER_KINDS`, `result.markers`), SGS-052 (Y-axis fix in `line-chart.tsx`), SGS-048 (pin and compare; edits the same three files, so this ticket rebases onto it)
- **On merge**: none
- **Source**: M3.10; design/M3.md "Markers" (colors and legend labels table), "Page props and test ids" (`chart-marker*`), Behavior rows `chart markers | render`, `legend and toggles`, `pinned run`, `x range`; plan M3-20261101 outline O and design question 9

## Context

M3.10 wants every chart to mark each age reached and each research completed. SGS-044 puts `markers` on the result;
this ticket draws them as labeled dashed vertical lines on all three charts, with a marker legend separate from the
series legend. Display only: nothing in the simulation changes.

SGS-048 (pin and compare) was not on disk when this was written. The contract used here is the design's
`toChartRows(times, series, pinned?)` and `SeriesChartProps.pinned?: PinnedSeries`. This ticket does not touch
`toChartRows`, `pinnedKey` or `PinnedSeries`. Names from SGS-044 and SGS-052 are used as those tickets wrote them.

## Scope

Contract names are the design's; do not rename.

1. `components/apps/aoe4-build-order/chart-rows.ts` (add; do not edit `toChartRows`, `PALETTE`, `seriesColor`, `toggleHidden`):
   - `MARKER_COLORS: Readonly<Record<ChartMarkerKind, string>>` = `age-up #b8860b`, `economy #008080`,
     `unit-tier #c43bb0`, `blacksmith #5f7d8c`, `other #6b6bd6`.
   - `MARKER_KIND_LABELS: Readonly<Record<ChartMarkerKind, string>>` = `Age-up`, `Economy`, `Unit tier`, `Blacksmith`, `Other`.
   - `markerLabel(marker: ChartMarker): string` = `<label> <m:ss>` using `formatMinSec`
     (`Castle 13:24`, `veteran-longbowmen 14:30`).
   - `import { formatMinSec } from '../../../lib/aoe4-build-order/format-time'` (respec 1: SGS-035 moved it out of
     `chart-rows.ts` and nothing re-exports it, so import from `format-time`, never from `chart-rows`).
   - `import type { ChartMarker, ChartMarkerKind }` from `../../../lib/aoe4-build-order/model`.
2. `components/apps/aoe4-build-order/line-chart.tsx`:
   - `SeriesChartProps` gains `markers?: readonly ChartMarker[]` (default `[]`). Add the prop beside the others; SGS-048
     adds `pinned?` in the same interface, so each ticket adds its own line.
   - Inside `LineChart`, one `ReferenceLine` per marker: `x={marker.at}`, `stroke={MARKER_COLORS[marker.kind]}`,
     dashed (`strokeDasharray` value is the implementer's, and must differ from the grid's `"3 3"`), a `label`
     of `markerLabel(marker)`, and `data-testid="chart-marker"`, `data-kind`, `data-label={marker.label}`,
     `data-at={marker.at}`. recharts 3.10 forwards `data-*` props to the `<line>` (verified in
     `ReferenceLine.js` via `svgPropertiesAndEvents`). Series `Line`s stay solid. Same-`at` markers stack their
     labels so each stays readable; the method (per-index `dy` or offset) is the implementer's, kept internal to
     `line-chart.tsx` (no new export).
   - A marker legend rendered as HTML below the `ResponsiveContainer`, inside the `testId` wrapper, separate from the
     recharts `Legend`: `data-testid="chart-marker-legend"` (absent when `markers` is empty), one
     `data-testid="chart-marker-legend-item"` per kind present in `markers`, in `CHART_MARKER_KINDS` order, with
     `data-kind`, a swatch filled with `MARKER_COLORS[kind]` and the text `MARKER_KIND_LABELS[kind]`.
   - Clicking a series legend entry still hides only that series. Markers have no toggle and are not affected by
     `hidden`.
   - Do not touch SGS-052's `YAxis` and margin lines.
3. `components/apps/aoe4-build-order/results.tsx`: pass `markers={result.markers}` to all three `SeriesChart`s
   (units produced, gather rates, floating resources). Only the current result's markers are drawn; the pinned run
   (SGS-048) draws none.
4. Tests (excluded from the LOC estimate):
   - `chart-rows.test.ts`: pins the exact `MARKER_COLORS` and `MARKER_KIND_LABELS` tables; every marker color
     has WCAG contrast ratio at least 3:1 against `#ffffff` and against `#212529`, and is absent from `PALETTE`;
     `markerLabel({kind:'age-up', label:'Castle', at:804})` is `Castle 13:24` and
     `markerLabel({kind:'unit-tier', label:'veteran-longbowmen', at:870})` is `veteran-longbowmen 14:30`.
   - `line-chart.test.ts` (server render): with `markers` of two kinds given out of order, the html has one
     `chart-marker-legend-item` per kind in `CHART_MARKER_KINDS` order, each with `data-kind` and its
     `MARKER_KIND_LABELS` text; with `markers` empty or omitted there is no `chart-marker-legend`. (The legend is plain
     HTML outside `ResponsiveContainer`, so `renderToString` sees it; the SVG lines need the browser.)
   - `acceptance/aoe4-build-order.spec.ts`: a Playwright test on a paste whose run reaches an age-up and completes
     at least one research (the implementer confirms the chosen paste really yields the markers, and picks one that
     yields two markers within a few seconds of each other for the stacking check; read the `markers` from the
     response to assert, do not hard-code times). For each of the three charts: `chart-marker` count equals
     `markers.length`; each has `data-kind`, `data-label`, `data-at` matching the response in order; legend items match
     the kinds present. Stacking: no two marker label bounding boxes in one chart intersect. Series legend: clicking
     an entry leaves the `chart-marker` count unchanged.
5. Docs: `docs/aoe4-build-order.md` "A 200 draws three line charts, each with a toggleable legend" (line ~561): add
   that each chart also draws the result's markers as dashed vertical lines labeled `<label> <m:ss>`, with a
   separate marker legend, that clicking a series legend entry does not hide markers, and the five kind colors
   and legend names. `git grep -n -i marker -- docs/aoe4-build-order.md` is empty today; SGS-044 adds a `markers` bullet in the
   result fields, so rebase and do not duplicate it. The cross-cutting M3 sections are SGS-054's.

**Out of scope:** the engine side (`markers.ts`, `result.markers`, OpenAPI; SGS-044); marker toggles, pinned-run
markers, new kinds; the Y-axis fix (SGS-052); `pinned`, `toChartRows`, `compare.ts` (SGS-048); the message lists and
timeline (other tickets); a dark theme.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [x] `chart-rows.ts` exports `MARKER_COLORS`, `MARKER_KIND_LABELS` and `markerLabel` with exactly the values in Scope item 1,
      and `markerLabel` gets `formatMinSec` from `lib/aoe4-build-order/format-time` (respec 1; `git grep -n "formatMinSec" -- components/apps/aoe4-build-order/chart-rows.ts` shows an import, not a definition or re-export);
      a unit test fails if any hex, any legend name or the `<label> <m:ss>` format changes.
- [x] A unit test computes the WCAG contrast ratio of each `MARKER_COLORS` value against `#ffffff` and `#212529` and requires at least 3:1, and requires that none is in `PALETTE`. (I computed these today: the lowest is 3.23.)
- [x] In the browser, for a run whose response has N markers, each of the three charts contains exactly N `chart-marker` elements inside its SVG, in `result.markers` order, whose `data-kind`, `data-label` and `data-at` equal the marker's `kind`, `label` and `at`; each has `stroke` equal to `MARKER_COLORS[kind]` and a non-empty `stroke-dasharray` that is not the grid's `3 3`; no series `path[data-series]` has a `stroke-dasharray`.
- [x] A marker's visible label text is `markerLabel(marker)`. Two markers with the same `at` (or `at` within a few seconds) have non-intersecting label bounding boxes.
- [x] `chart-marker-legend` is present under a chart exactly when its markers are non-empty, outside the recharts `Legend`; it has one `chart-marker-legend-item` per kind present, in `CHART_MARKER_KINDS` order, each with `data-kind`, a swatch in `MARKER_COLORS[kind]` and the text `MARKER_KIND_LABELS[kind]`.
- [x] A run with `markers: []` (for example `start -> sheep` with no steps) draws no `chart-marker` and no `chart-marker-legend`, and the three charts still draw their lines (`expectChartsDrawn`).
- [x] Clicking a series legend entry hides that series (existing test unchanged) and leaves every `chart-marker` and the marker legend in place.
- [x] Every marker is drawn (none discarded for lying outside the x domain): with markers whose largest `at` equals `durationSeconds`, the `chart-marker` count still equals `markers.length`.
- [x] `git grep -n "markers={result.markers}" -- components/apps/aoe4-build-order/results.tsx` finds 3 lines (it finds none today, and `git grep -n -i "ReferenceLine\|marker" -- components pages/apps` finds nothing today).
- [x] Mutation: dropping `markers` from one of the three `SeriesChart` calls fails the browser count test; replacing the `MARKER_COLORS[marker.kind]` stroke with a series color fails the stroke check; sorting the legend items by encounter order instead of `CHART_MARKER_KINDS` fails the server-render legend test. (These mutate code this ticket adds; they cannot be run before it exists.)
- [x] `docs/aoe4-build-order.md` describes marker lines and the marker legend as in Scope item 5, and `git grep -n -i "marker" -- docs/aoe4-build-order.md` shows the chart paragraph.
- [x] After rebasing onto SGS-052 and SGS-048, the diff touches none of their lines: the `YAxis` element and `LineChart` margin, `toChartRows`, `pinned` handling, and the existing Y-axis Playwright test still pass.
- [x] `npx tsc --noEmit`, `npm test` and `npm run acceptance` pass; no INVARIANTS.md regressions.

## Open questions

None.

## Rework 1 - 2026-11-01 (review)

Bounced by review (report `reports/SGS-049-review-1.md`) at branch tip 43b8a0b58efb65777d188000e251616473e07355. No earlier gate had passed it. Gates pass at 1280 px; no acceptance criterion fails.

### Findings
- `components/apps/aoe4-build-order/line-chart.tsx:17-19,28-40` and `docs/aoe4-build-order.md:668-669` (contract): `placeMarkers` assumes the plot is always 900 px wide (`PLOT_WIDTH_PX`) at 7 px per character. Measured plot widths: 966 px at a 1280 px viewport and 786 at 1024 (no overlaps); 546 at 768 (`horticulture 6:49` and `iron-undermesh 9:41` overlap on the ENG 1TC run on all three charts); at 576 `Feudal 4:23` overlaps `double-broadax 6:49`; at 390 `iron-undermesh 9:41` runs past the right edge. This contradicts the doc sentence "markers that fall close in time stack their labels in rows so each stays readable" and the code comment "Labels near the right edge extend leftward to stay inside the plot".

### Required fixes
- [x] (rework 1) Measure the plot width instead of assuming 900 px: take the chart width from `ResponsiveContainer` `onResize(width, height)` (recharts 3.10.1 has it; hold it in state), subtract the Y-axis width (110) and the chart margins, and pass the result to `placeMarkers` in place of `PLOT_WIDTH_PX`. Remove the fixed constant; keep label stacking and right-edge flipping working off the measured width. Add a Playwright check at 768 px that no two marker label bounding boxes intersect on all three charts for the ENG 1TC run, and mutation-check it (restoring a fixed 900 must fail it). Keep the doc sentence true.
- [x] (rework 1) `components/apps/aoe4-build-order/compare.ts:37` defines its own `AGE_NAMES`, a copy of the one exported by `lib/aoe4-build-order/model.ts` (REPO.md: a copied constant is blocking). Import it instead and delete the copy. No behavior change; compare tests must pass unchanged.
- [x] (rework 1, optional, same commit) The marker acceptance spec imports `CHART_MARKER_KINDS` instead of hard-coding the kinds; the horizon test asserts `markers.length > 0`; `ReferenceLine` keys are stable (kind and label, not the index); add bottom margin to the marker legend so it does not touch the next chart heading.

## Rework 2 - 2026-11-01 (review)

Bounced by review (report `reports/SGS-049-review-2.md`) at branch tip 14a4d62edb2acea88636ac60dc0d52e0947d4e52. The rework-1 fix (measured plot width, `compare.ts` AGE_NAMES import, tidy items) holds at 1280, 1024, 768 and 576 px; the 768 px test is sound.

### Findings
- `components/apps/aoe4-build-order/line-chart.tsx:29,34-35` (contract): at 390 px (plot width 216 px) on the ENG 1TC run, `steeled-arrow 8:41` and `iron-undermesh 9:41` start 12 px past the left edge of the plot, on all three charts, drawn over the Y-axis tick values. A label flips right when `at + width > end`, with no check that `at - width >= 0`; on a narrow plot an 18-19 character label fits on neither side. This contradicts the comment "Labels near the right edge extend leftward to stay inside the plot" and the doc sentence that labels stack so each stays readable. (Choosing the side with more room is still about 1 px over on `iron-undermesh`.)

### Required fixes
- [x] (rework 2) Clamp a label that fits on neither side so it stays inside the plot (for example a `dx` offset keeping its box within `[0, plotWidth]`); labels must still not overlap each other (stack in rows). Re-wrap the ~200-character comment on line 29 and make it true.
- [x] (rework 2) Extend the narrow-screen Playwright test to 390 px with a check that each marker label box lies inside the plot (grid) box on all three charts, in addition to the no-overlap check; mutation-check it (removing the clamp must fail it).
- [x] (rework 2, optional, same commit) Skip drawing marker labels while the measured width is still `null` (avoids the one-frame transient); remove the now-unused `i` parameter at `line-chart.tsx:~99`; add a short comment that `CHART_MARGIN_PX = 5` mirrors recharts' default chart margin (or pass the margin explicitly so the two cannot drift).
