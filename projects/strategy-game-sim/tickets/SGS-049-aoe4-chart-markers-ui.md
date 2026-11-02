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

- [ ] `chart-rows.ts` exports `MARKER_COLORS`, `MARKER_KIND_LABELS` and `markerLabel` with exactly the values in Scope item 1,
      and `markerLabel` gets `formatMinSec` from `lib/aoe4-build-order/format-time` (respec 1; `git grep -n "formatMinSec" -- components/apps/aoe4-build-order/chart-rows.ts` shows an import, not a definition or re-export);
      a unit test fails if any hex, any legend name or the `<label> <m:ss>` format changes.
- [ ] A unit test computes the WCAG contrast ratio of each `MARKER_COLORS` value against `#ffffff` and `#212529` and requires at least 3:1, and requires that none is in `PALETTE`. (I computed these today: the lowest is 3.23.)
- [ ] In the browser, for a run whose response has N markers, each of the three charts contains exactly N `chart-marker` elements inside its SVG, in `result.markers` order, whose `data-kind`, `data-label` and `data-at` equal the marker's `kind`, `label` and `at`; each has `stroke` equal to `MARKER_COLORS[kind]` and a non-empty `stroke-dasharray` that is not the grid's `3 3`; no series `path[data-series]` has a `stroke-dasharray`.
- [ ] A marker's visible label text is `markerLabel(marker)`. Two markers with the same `at` (or `at` within a few seconds) have non-intersecting label bounding boxes.
- [ ] `chart-marker-legend` is present under a chart exactly when its markers are non-empty, outside the recharts `Legend`; it has one `chart-marker-legend-item` per kind present, in `CHART_MARKER_KINDS` order, each with `data-kind`, a swatch in `MARKER_COLORS[kind]` and the text `MARKER_KIND_LABELS[kind]`.
- [ ] A run with `markers: []` (for example `start -> sheep` with no steps) draws no `chart-marker` and no `chart-marker-legend`, and the three charts still draw their lines (`expectChartsDrawn`).
- [ ] Clicking a series legend entry hides that series (existing test unchanged) and leaves every `chart-marker` and the marker legend in place.
- [ ] Every marker is drawn (none discarded for lying outside the x domain): with markers whose largest `at` equals `durationSeconds`, the `chart-marker` count still equals `markers.length`.
- [ ] `git grep -n "markers={result.markers}" -- components/apps/aoe4-build-order/results.tsx` finds 3 lines (it finds none today, and `git grep -n -i "ReferenceLine\|marker" -- components pages/apps` finds nothing today).
- [ ] Mutation: dropping `markers` from one of the three `SeriesChart` calls fails the browser count test; replacing the `MARKER_COLORS[marker.kind]` stroke with a series color fails the stroke check; sorting the legend items by encounter order instead of `CHART_MARKER_KINDS` fails the server-render legend test. (These mutate code this ticket adds; they cannot be run before it exists.)
- [ ] `docs/aoe4-build-order.md` describes marker lines and the marker legend as in Scope item 5, and `git grep -n -i "marker" -- docs/aoe4-build-order.md` shows the chart paragraph.
- [ ] After rebasing onto SGS-052 and SGS-048, the diff touches none of their lines: the `YAxis` element and `LineChart` margin, `toChartRows`, `pinned` handling, and the existing Y-axis Playwright test still pass.
- [ ] `npx tsc --noEmit`, `npm test` and `npm run acceptance` pass; no INVARIANTS.md regressions.

## Open questions

None.
