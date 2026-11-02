# SGS-070: Separate and label the chart legends, and stop marker labels overlapping

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M4 / M4.11
- **Priority**: medium
- **Risk**: standard
  <!-- One component, no API or `lib/**` change, no critical path. Not low: a new component file plus edits to `line-chart.tsx`, and it replaces the legend three acceptance specs click. -->
- **Invariants**: S1 (imports only `lib/aoe4-build-order/model` and `format-time`, never another app); A1 and A3 untouched (display only)
- **LOC estimate**: 120 (`chart-legend.tsx` ~65; `line-chart.tsx` ~55 net: drop recharts `Legend`, measured widths, margin; business logic only, tests and docs excluded)
- **Depends on**: SGS-056 (turns on `strictNullChecks`; new code is written under it)
- **On merge**: none
- **Source**: M4.11; design/M4.md C12 (Charts), Behavior rules "Charts (M4.11)"; plan M4-20261102 outline N; BACKLOG "line-chart.tsx:75 recharts Legend and :128 chart-marker-legend read as one"

## Context

On `main`, `line-chart.tsx` renders the recharts `Legend` (line 75) and, directly under it, the marker
`<ul data-testid="chart-marker-legend">` (line 128). The two read as one legend, neither is titled, pinned
series are not grouped with their current series, and marker labels (placed by the non-exported
`placeMarkers`, 7 px per char estimate) overlap for the knight + longbow build between 10:00 and 17:00.
This ticket splits them into two labelled legends and makes label placement use measured widths. Display only.

## Scope

Contract names are design C12's; do not rename. Files are under `components/apps/aoe4-build-order/`.

1. New `chart-legend.tsx` exporting `SeriesLegend` and `MarkerLegend` (React components, HTML, not SVG), with props `SeriesLegend { series: readonly ChartSeries[]; pinned?: PinnedSeries; hidden: ReadonlySet<string>; onToggle(key: string): void }` (`hidden` holds hidden keys, `pinned:<key>` for pinned ones) (respec 1).
   - `SeriesLegend`: `data-testid="chart-series-legend"`, heading text "Series". One `button` per series with
     `data-testid="chart-series-legend-item"`, `data-series` = series key (`pinned:<key>` for a pinned series), `aria-pressed`
     = true when that key is hidden, a swatch (a solid horizontal line in the series colour; dashed `6 4` for a pinned
     series) and the series name (`<name> (pinned)` for pinned, as the chart lines are named today). Click calls an
     `onToggle(key)` prop; current and pinned keys toggle separately. Order: for each current series in result order its
     item, then its `pinned:<key>` item if the pinned run has that key; then pinned-only keys in pinned order. Hidden
     items are visibly dimmed.
   - `MarkerLegend`: `data-testid="chart-marker-legend"` (kept), heading "Markers", rendered as its own row below the
     series legend with a top border (Bootstrap `border-top`). One `data-testid="chart-marker-legend-item"` (kept,
     `data-kind`) per marker kind present in `CHART_MARKER_KINDS` order; swatch is a short vertical line in
     `MARKER_COLORS[kind]` (a `span` inside the item, as today, so its `background-color` is still the kind colour);
     text `MARKER_KIND_LABELS[kind]`. When nothing is passed to draw it renders nothing, so a run with no markers has no
     `chart-marker-legend` in the DOM. Props (C12): `{ markers: readonly ChartMarker[]; pinnedAgeUps?: boolean }`, returns `JSX.Element | null`. This ticket declares only `markers` (`pinnedAgeUps` is added by SGS-071 with its use) (respec 1).
2. `line-chart.tsx`:
   - Remove the recharts `Legend` import and element; render `SeriesLegend` then `MarkerLegend` below the
     `ResponsiveContainer`, inside the `testId` wrapper. The series legend drives the existing `hidden` state through
     `toggleHidden`; markers never hide.
   - Current-run marker lines (`ReferenceLine`, `data-testid="chart-marker"`, `data-kind`, `data-label`, `data-at` kept) become
     solid (drop `strokeDasharray="8 2"`), as C12 specifies, so pinned (dashed) and current (solid) lines stay distinguishable.
   - Export `placeMarkers(markers, end, plotWidth)` (pure, returns `PlacedMarker[]`) from `line-chart.tsx` and export `PlacedMarker`.
     Each label goes in the first row where its box does not overlap any already placed label; rows are unbounded. Label
     width comes from the text's measured width (`getComputedTextLength` of an SVG text element in the chart's label
     font, measured after mount and re-measured on resize), or `8` px per character before the first measure (was 7).
     Keep the existing left-edge pinning of a label that fits on neither side of its line. Signature (C12): `placeMarkers(markers: readonly ChartMarker[], end: number, plotWidth: number, labelWidth?: (label: string) => number): PlacedMarker[]`; `labelWidth` defaults to `label.length * 8`, and `SeriesChart` passes the measured width once measured. Pinned markers have no text label and are never passed to `placeMarkers` (respec 1).
   - The chart's top margin grows by `rows × 14` px (`LABEL_LINE_HEIGHT`) above recharts' default 5, where `rows` is the
     number of label rows used, so no two label boxes intersect at any width and labels do not cover the plot's lines
     any more than today.
   - Pinned lines stay dashed `6 4` in the colour of their current series (unchanged); the legend now shows them next to it.
   - Do not touch `YAxis` width (`Y_AXIS_WIDTH`) or its label.
3. Tests that assert the old legend or dash change (rule: a test of the changed behaviour gets the new expected value; the
   implementer lists every test edited):
   - `acceptance/aoe4-build-order.spec.ts` (legend click test near line 190, marker test near line 448, dash assertions
     `'8 2'` near lines 410-430 and 470) and `acceptance/aoe4-build-order-pin-compare.spec.ts` (pinned legend test, line 77):
     replace `li.recharts-legend-item` / `.inactive` with `chart-series-legend-item` and `aria-pressed`; marker dash now none.
   - `line-chart.test.ts`: keep the marker legend tests (they still hold); add the series legend and heading cases below.
4. Docs: `docs/aoe4-build-order.md` section after "A 200 draws three line charts" (lines ~786-800, 818-820): "toggleable legend"
   becomes a series legend titled "Series" (buttons, pinned item follows its current item); markers are solid vertical
   lines; the marker legend is titled "Markers" and sits in its own row; labels are stacked in rows by measured width. Leave
   the sentence "the pinned run draws none" (true until the pinned-marker ticket).

**Out of scope:** pinned-run markers and the `pinned-age-up` legend item (`SeriesChart` prop `pinnedMarkers`,
`chart-pinned-marker`), `YAxis`/tick overlap, tooltip, chart colours and `PALETTE`, mobile layout, any `lib/**` change.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] Every chart renders `chart-series-legend` with heading "Series" and, when markers exist, `chart-marker-legend` with heading "Markers" in a separate row below it; neither is inside the other (Playwright: marker legend is not a descendant of the series legend and its bounding box is below it).
- [ ] `git grep -n "recharts-legend-item\|<Legend" -- components acceptance pages` has no matches (today it finds 10 lines: `line-chart.tsx` 2, `aoe4-build-order.spec.ts` 5, `aoe4-build-order-pin-compare.spec.ts` 3).
- [ ] Series items carry `data-series` equal to the line's `data-series`; clicking `food` sets `aria-pressed="true"` on that item only and removes `path[data-series="food"]`; clicking again restores it; markers and the marker legend stay.
- [ ] With a pinned run the legend order is: each current series followed by its `pinned:<key>` item, then pinned-only keys; the pinned item's swatch has a dashed stroke and the current item's is solid; clicking `pinned:food` hides only the pinned line (unit test on the ordering function or render, plus the updated pin-compare acceptance test).
- [ ] `placeMarkers` is exported; a unit test gives it markers 100 s apart with long labels and asserts no two placed boxes `[from, to]` in the same row intersect, that a marker whose label fits uses row 0, and that with a larger width estimate rows increase (the test fails if the first-fit row search is replaced by always row 0).
- [ ] A unit test passes a measured-width argument wider than the estimate and asserts rows change accordingly (the optional width parameter is honoured).
- [ ] At 1280 px wide, for the English knight + longbow prebuilt build, in all three charts no two `chart-marker` label text boxes (`getBoundingClientRect`) intersect, including the markers between 10:00 and 17:00; the chart's top margin is `5 + rows × 14` px.
- [ ] Current-run marker lines have no `stroke-dasharray`; `chart-marker`, `chart-marker-legend`, `chart-marker-legend-item` ids and `data-kind`/`data-label`/`data-at` remain; a run with no markers has no `chart-marker-legend`.
- [ ] `docs/aoe4-build-order.md` describes the two legends, solid markers and row placement; no sentence in it still says markers are dashed or that the legend is a single toggleable legend.
- [ ] `npm test`, `npx tsc --noEmit` and `npm run acceptance` pass; the implementer lists every test it edited.
- [ ] No INVARIANTS.md regressions

## Open questions

None.

## Re-spec 2026-11-02

- Underspecified: `placeMarkers` width parameter, legend prop shapes and the solid-marker placement were open `designer` questions.
- Changed: aligned to design C12 (`labelWidth?`, exported `PlacedMarker`, `SeriesLegend`/`MarkerLegend` props, `pinnedAgeUps?` left to SGS-071); solid current markers confirmed in this ticket; open questions removed.
- Stands: all earlier scope and criteria are unchanged.
