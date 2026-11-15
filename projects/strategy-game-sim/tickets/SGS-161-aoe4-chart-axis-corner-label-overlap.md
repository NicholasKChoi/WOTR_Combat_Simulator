# SGS-161: Stop the 0:00 x-axis label overlapping the 0 y-axis label on AoE4 series charts

- **Type**: Bug
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: low
- **Risk**: low
- **Invariants**: none
- **Unverified assumptions**: recharts lays out axis tick labels (anchor, offset from the axis, and tick margin) as its SVG renderer does in a real browser; jsdom has no layout, so only the Playwright check exercises it
- **LOC estimate**: 15 (axis props in `SeriesChart` in `components/apps/aoe4-build-order/line-chart.tsx`)
- **Depends on**: none
- **On merge**: none
- **Source**: BACKLOG.md item from the SGS-157 review (`reports/SGS-157-review-2.md`, Overlapping labels: "only `0:00` against `0` at the origin, at every width, pre-existing"); REPO.md review checklist forbids overlapping tick labels

## Context

On every AoE4 series chart, at the chart's bottom-left corner the first x tick (`0:00`, centred on the plot's left edge, below the axis) and the first y tick (`0`, right-aligned to the plot's left edge, centred on the bottom edge) are drawn on top of each other. It is the same on main at every width and for every chart that uses `SeriesChart`.

### Cause

`SeriesChart` in `components/apps/aoe4-build-order/line-chart.tsx` renders `XAxis` (`type="number"`, `domain={['dataMin','dataMax']}`, `tickFormatter={formatMinSec}`) and `YAxis` (`width={Y_AXIS_WIDTH}`) with recharts' default tick offsets and no spacing between the two axes' origin ticks. The x axis's first tick sits at the plot's left edge, so its centred label extends left under the y axis, into the box of the y axis's bottom tick. Nothing handles the corner: the one existing label-overlap test (`acceptance/aoe4-build-order-pin-compare.spec.ts`, "axis labels do not overlap the tick labels") compares the y-axis title against `\d+` ticks only, never tick against tick, so the gates did not catch it. The cause was found by review inspection, not reproduced by me; the implementer confirms it in the browser first.

## Scope

- Change the axis configuration in `SeriesChart` (`line-chart.tsx`) so the first x tick label and the first y tick label do not overlap, at every chart width. Examples of levers, the implementer picks one: x or y tick margin, axis padding, or a tick offset. Whatever is chosen must keep the data, domains (including `wholeNumberAxis`'s whole-number y ticks), the marker label placement (`placeMarkers`, which uses `Y_AXIS_WIDTH` and `CHART_MARGIN_PX` to compute plot width), and the plot-area geometry that existing tests rely on consistent. If the fix changes the plot's left or bottom extent, `plotWidth` and the label-width math follow it.
- Check every other `XAxis`/`YAxis` pair in `components/apps/aoe4-build-order/` for the same corner overlap (`git grep -n "XAxis" -- components`) and fix each one found; report any not touched.
- Add a Playwright check that reads tick label boxes inside one `page.evaluate` (LESSONS.md rule on layout reads) and asserts no two tick labels of a chart overlap. Put it next to the existing label-overlap test, or in the chart-views spec, using the shared helpers in `acceptance/helpers.ts`.
- Docs: grep `docs/aoe4-build-order.md` and `ARCHITECTURE.md` for axis or tick wording the change makes untrue; fix only if found.

**Out of scope:** y-axis tick values and domain (`wholeNumberAxis`), tooltip placement, marker label rows, other apps' charts, any change to chart data.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] On each AoE4 series chart (every id in `CHART_IDS`), no two axis tick labels' bounding boxes intersect, read in one `page.evaluate`, at viewport widths 360, 768 and 1280; the test fails at the base on the `0:00` / `0` pair.
- [ ] The check includes a chart with the Buildings view's offset lines and one with the default view, so both y-axis configurations are covered.
- [ ] No tick label is clipped by the chart container and the document has no new horizontal overflow at 360 px.
- [ ] Marker labels still stay within the plot and clear of the y-axis ticks (existing marker-label acceptance tests keep their assertions and pass).
- [ ] Pre-existing tests keep their assertions; any test whose pixel geometry assumption changes is listed in the implementer's report.
- [ ] No INVARIANTS.md regressions

## Open questions

none
