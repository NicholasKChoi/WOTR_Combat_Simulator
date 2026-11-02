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
     = true when that key is hidden, a swatch and the series name (`<name> (pinned)` for pinned, as the chart lines are named today). Click calls an
     `onToggle(key)` prop; current and pinned keys toggle separately. Order: for each current series in result order its
     item, then its `pinned:<key>` item if the pinned run has that key; then pinned-only keys in pinned order. Hidden
     items are dimmed: the item has `opacity: 0.5` (unhidden items have no opacity style) (respec 2).
   - Swatch (respec 2): a `span` with `data-testid="chart-series-legend-swatch"` inside the item, 24 px wide, `border-top: 2px <style> <colour>`, so the observable is its computed `border-top-style` (`solid` for a current series, `dashed` for a pinned one; the chart line's `6 4` dash is not reproduced) and `border-top-color`. Colour rule is the chart line's: the current series' `seriesColor(i)`; a pinned series uses the colour of the current series with the same key, else `seriesColor(series.length + i)` with `i` its index in the pinned series. `seriesColor` is imported from `chart-rows` (export it if it is not already).
   - `MarkerLegend`: `data-testid="chart-marker-legend"` (kept), heading "Markers", rendered as its own row below the
     series legend with a top border (Bootstrap `border-top`). One `data-testid="chart-marker-legend-item"` (kept,
     `data-kind`) per marker kind present in `CHART_MARKER_KINDS` order; swatch is a short vertical line in
     `MARKER_COLORS[kind]` (a `span` inside the item, as today, so its `background-color` is still the kind colour);
     text `MARKER_KIND_LABELS[kind]`. When `markers` is empty it renders nothing, so a run with no markers has no
     `chart-marker-legend` in the DOM. Props (C12): `{ markers: readonly ChartMarker[]; pinnedAgeUps?: boolean }`, returns `JSX.Element | null`. This ticket declares only `markers` (`pinnedAgeUps` is added by SGS-071 with its use) (respec 1).
2. `line-chart.tsx`:
   - Remove the recharts `Legend` import and element; render `SeriesLegend` then `MarkerLegend` below the
     `ResponsiveContainer`, inside the `testId` wrapper. The series legend drives the existing `hidden` state through
     `toggleHidden`; markers never hide.
   - Current-run marker lines (`ReferenceLine`, `data-testid="chart-marker"`, `data-kind`, `data-label`, `data-at` kept) become
     solid (drop `strokeDasharray="8 2"`), as C12 specifies, so pinned (dashed) and current (solid) lines stay distinguishable.
   - Export `placeMarkers(markers, end, plotWidth)` (pure, returns `PlacedMarker[]`) from `line-chart.tsx` and export `PlacedMarker`.
     Each label goes in the first row where its box does not overlap any already placed label; rows are unbounded. Label
     width comes from the text's measured width, or `8` px per character before the first measure (was 7). Measurement
     (respec 2): `SeriesChart` renders, inside its `testId` wrapper, a hidden `<svg aria-hidden="true" width="0" height="0" style="position:absolute">` holding one `<text fontSize="12">` (inheriting the chart font-family); a `useEffect` keyed on `chartWidth` (the existing `ResponsiveContainer` `onResize` state, so a resize re-measures) sets `text.textContent` to each label and reads `getComputedTextLength()`, storing a `Map<string, number>` in state. Effect-only: on the server render and before the first effect the map is empty, so `labelWidth` falls back to `label.length * 8` and `line-chart.test.ts` (server render) is unaffected.
     Keep the existing left-edge pinning of a label that fits on neither side of its line. Signature (C12): `placeMarkers(markers: readonly ChartMarker[], end: number, plotWidth: number, labelWidth?: (label: string) => number): PlacedMarker[]`; `labelWidth` defaults to `label.length * 8`, and `SeriesChart` passes the measured width once measured. Pinned markers have no text label and are never passed to `placeMarkers` (respec 1).
   - Label position (respec 2): labels are drawn in extra top margin above the plot, not inside it. The `LineChart` `margin.top` is `5 + rows × 14` px (`LABEL_LINE_HEIGHT`; `rows` = max placed `row` + 1, 0 with no markers), and labels keep the `insideTopLeft`/`insideTopRight` anchor with `dy = (row − rows) × 14`, so row `r` sits at y = `5 + r × 14` from the chart top and the lowest row ends at the plot's top edge. Today `dy = row × 14` puts labels inside the plot over the lines; this removes that overlap, so no label box intersects a line or another label. Other margins stay at recharts' default 5. `SeriesChart` sets `data-label-rows={rows}` on its `testId` wrapper (always present; `0` with no markers) as the DOM observable.
   - Pinned lines stay dashed `6 4` in the colour of their current series (unchanged); the legend now shows them next to it.
   - Do not touch `YAxis` width (`Y_AXIS_WIDTH`) or its label.
3. Tests that assert the old legend or dash change (rule: a test of the changed behaviour gets the new expected value; the
   implementer lists every test edited):
   - `acceptance/aoe4-build-order.spec.ts` (legend click test near line 190, marker test near line 448, dash assertions
     `'8 2'` near lines 410-430 and 470) and `acceptance/aoe4-build-order-pin-compare.spec.ts` (pinned legend test, line 77):
     replace `li.recharts-legend-item` / `.inactive` with `chart-series-legend-item` and `aria-pressed`; the `.recharts-legend-wrapper` count-0 assertion (near line 435) is dropped or becomes a `chart-series-legend` visibility check; marker dash now none; the test titles that say "dashed" markers (line 404 "labeled dashed lines", line 454 "the current run markers 8 2") are reworded to "solid" (respec 2).
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
- [ ] `git grep -n "recharts-legend-item\|<Legend" -- components acceptance pages` has no matches (today it finds 9 lines: `line-chart.tsx` 1, `aoe4-build-order.spec.ts` 5, `aoe4-build-order-pin-compare.spec.ts` 3) (respec 2).
- [ ] Series items carry `data-series` equal to the line's `data-series`; clicking `food` sets `aria-pressed="true"` on that item only and removes `path[data-series="food"]`; clicking again restores it; markers and the marker legend stay.
- [ ] With a pinned run the legend order is: each current series followed by its `pinned:<key>` item, then pinned-only keys; the pinned item's `chart-series-legend-swatch` has computed `border-top-style: dashed` and the current item's `solid`, both with `border-top-color` equal to the series line's `stroke`; a hidden item has `opacity: 0.5` (respec 2); clicking `pinned:food` hides only the pinned line (unit test on the ordering function or render, plus the updated pin-compare acceptance test).
- [ ] `placeMarkers` is exported; a unit test gives it markers 100 s apart with long labels and asserts no two placed boxes `[from, to]` in the same row intersect, that a marker whose label fits uses row 0, and that with a larger width estimate rows increase (the test fails if the first-fit row search is replaced by always row 0).
- [ ] A unit test passes a measured-width argument wider than the estimate and asserts rows change accordingly (the optional width parameter is honoured).
- [ ] At 1280 px wide, for the English knight + longbow prebuilt build, in all three charts no two `chart-marker` label text boxes (`getBoundingClientRect`) intersect, including the markers between 10:00 and 17:00; the chart wrapper's `data-label-rows` equals the max `row` among its placed labels + 1, and the first `.recharts-cartesian-grid` rect `y` (relative to the chart svg) equals `5 + data-label-rows × 14`, and every `chart-marker` label's bottom is at or above that y (labels are in the margin) (respec 2).
- [ ] `line-chart.test.ts` server-renders `SeriesChart` with markers without error and `data-label-rows` is present (measurement is effect-only) (respec 2).
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

## Re-spec 2026-11-02 (gate 1)

- Underspecified: where labels draw relative to the plot, how swatch dash/colour/dimming are observed, the unobservable margin criterion, the measuring element and resize trigger, and a wrong grep count (9, not 10).
- Changed: labels go in the extra top margin (`dy = (row - rows) * 14`), swatch span with `border-top-style`, `opacity: 0.5`, `data-label-rows` plus grid rect y, hidden measuring `<svg><text>` driven by `chartWidth`, test titles and the legend-wrapper assertion listed.
- Stands: contracts, signatures, legend structure, docs scope and all other criteria.
