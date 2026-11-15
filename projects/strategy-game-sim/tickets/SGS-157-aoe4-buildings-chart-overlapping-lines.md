# SGS-157: Keep each building identifiable in the AoE4 Buildings chart

- **Type**: Bug
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: medium
- **Risk**: standard
- **Invariants**: A1, A2, A3 (their Paths cover `components/apps/aoe4-build-order/**`; touched but not affected, the change is display-only and does not touch the simulation or data)
- **Unverified assumptions**: recharts 3.10.1 `Tooltip` `formatter` receives, for each entry, the hovered row (`payload`) and the entry's `dataKey`, so the tooltip can show the row's true count while the line is drawn at an offset; recharts 3.10.1 `Line` can draw a value other than the row's raw count (a `dataKey` function or a separate display key) while the `data-series` attribute and the custom `SeriesLegend` stay keyed by the series key; recharts 3.10.1 `YAxis` with `allowDecimals={false}` and the default domain lower bound of 0 renders only whole-number ticks when the plotted values are non-integers
- **LOC estimate**: 80 (offset and row-building functions plus the true-count lookup in `chart-rows.ts`, a prop, `YAxis` and `Tooltip` wiring in `line-chart.tsx`, one line in `results.tsx`)
- **Depends on**: none
- **On merge**: none
- **Source**: BACKLOG.md item, "AoE4 Buildings line chart: overlapping lines" (owner UI/UX feedback, 2026-11-12); owner answered it as a standalone bug

## Context

In the Units produced chart's Buildings view, many production buildings share the same count (1 or 2), so
their lines draw on top of each other and only the last-drawn one is visible; the owner cannot tell which
buildings exist. Cause: `SeriesChart` in `components/apps/aoe4-build-order/line-chart.tsx` plots every
series at its exact y value (rows from `toChartRows` in `chart-rows.ts`), and `buildingSeries` in
`result-series.ts` yields integer counts (`b.counts`), so equal counts coincide exactly. The existing tests
assert the line set and `data-series` keys, never that lines at equal values are distinguishable, so
nothing caught it. The Units view has the same shape (equal counts) but is not what the owner reported.

## Scope

- Buildings view of the `chart-units-produced` chart only: draw each visible building's line at a small
  per-building vertical offset above its true count, so equal counts no longer coincide.
- Offset rule:
  - Offsets are non-negative (a line is never drawn below its true count, so a building at count 0 stays
    on or above the y-axis floor and the default domain lower bound of 0 still holds), distinct per slot,
    increase with slot order, and all stay below half a building, so a line is always drawn nearer its own
    count than the next one.
  - A building keeps the same offset at every time (it does not depend on the count), so a line does not
    jump when its count changes.
  - Slot order: visible current series in `series` order, then visible pinned-only keys in `pinned.series`
    order. Hidden series (legend toggle, the `hidden` set in `SeriesChart`) take no slot. A pinned line takes
    the same offset as the current line with the same key, so a building's pair stays together.
  - Known limit, accepted: the spacing between adjacent slots shrinks as the number of visible buildings
    grows, since all offsets fit below half a building. Hiding buildings in the legend widens it. No minimum
    spacing is enforced.
- Seams, all pure and exported from `chart-rows.ts` so they are unit-tested without a DOM:
  - the offset function: visible series keys (in slot order) to an offset per key;
  - the row-building function: `toChartRows` or a sibling of it, taking the opt-in (or the offsets) as an
    argument. Rows are built inside `SeriesChart` because the `hidden` state lives there; `SeriesChart` calls
    this function with its `hidden` set. Without the opt-in, rows are exactly what `toChartRows` returns today.
  - the true-count lookup: given a row and a series key, returns the building's true count (not the drawn
    value). The `Tooltip` `formatter` in `SeriesChart` uses it in the Buildings view.
- The y axis in the Buildings view shows only whole-number ticks and no tick below 0, and its top is the
  smallest whole number at or above the highest drawn value (for example 2 when the highest drawn value is
  1.225), so the plot is not stretched past the data (rework 1). The implementer picks the mechanism.
- The tooltip in this view shows each building's true count, never the drawn value (`formatChartValue`
  rounds to one decimal, so it would show the offset). Series names, the `SeriesLegend` items, `data-series`
  keys and line colors are unchanged.
- `SeriesChart` gets an opt-in prop for this behavior; `results.tsx` passes it for the Buildings view of
  `chart-units-produced` only. The other charts and the Units view are drawn exactly as today.
- Docs: `docs/aoe4-build-order.md`, the paragraph after the chart table (Units produced offers Units and
  Buildings): states that each line is drawn at or a small amount above its true count, none for the first
  visible building, and that the tooltip shows true counts (rework 1: exact sentence in Rework 1).
- Existing tests: a test of the Buildings view's drawn values may need the offset; any test of another
  chart or view keeps its expected values (examples: `acceptance/aoe4-chart-views.spec.ts` Buildings tests,
  which check legend names and `path[data-series]` counts; `acceptance/aoe4-build-order-pin-compare.spec.ts`
  units-chart dash checks, which stay on the Units view; `chart-rows.test.ts` `toChartRows` tests).

**Out of scope:** the Units view and the other three charts; changing colors or the palette; dashed or
stepped line styles (dashes mean "pinned"); changing the simulation or `productionBuildings`; marker labels;
a minimum slot spacing.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] (respec 1) A unit test of the offset function covers equal counts with 2 series and with many series: every offset is non-negative and below half a building, offsets are distinct per slot and increase in slot order (current series in order, then pinned-only keys). A test fails if two slots share an offset or any offset is negative.
- [ ] (respec 1) A unit test of the row-building function, with the opt-in, shows two series with the same count at a time get different row values for their drawn lines, each at or above its true count and below it plus half a building; without the opt-in, the rows equal the raw series values (the same rows `toChartRows` returns for those inputs).
- [ ] (respec 1) A building with true count 0 is drawn at or above 0, inside the plot; a test fails if a count-0 row value is below 0.
- [ ] Hiding a building in the legend removes its offset slot: the remaining lines' offsets are those of a chart that never had it. A test fails if hidden series still reserve a slot.
- [ ] A pinned line and the current line with the same key are drawn at the same offset; a pinned-only building gets an offset distinct from every other visible line.
- [ ] (respec 1) A unit test of the true-count lookup shows that, for a row built with the opt-in, it returns the building's true integer count for a series whose drawn value is offset; a test fails if the drawn value is returned. The Buildings view `Tooltip` formatter uses this lookup.
- [ ] (respec 1) An acceptance test in `acceptance/aoe4-chart-views.spec.ts` on the Buildings view checks every rendered y-axis tick label is a whole number and none is below 0, and hovering the chart shows tooltip values that are whole numbers.
- [ ] (rework 1) The same acceptance test asserts the largest y-axis tick for BARRACKS_PASTE is 2 (the smallest whole number at or above the highest drawn value); it fails on tip c8cb3b3, which renders 4.
- [ ] (rework 1) An acceptance test asserts `path[data-series="capital-town-center"]` and `path[data-series="barracks"]` each have count 1 and end at different y values. It is run once at the base (e50e074) and the implementer report records it failing there on the end-y assertion (both end at the same y).
- [ ] (rework 1) The Buildings tests reuse the spec file's `hoverPlot` and `readTooltip`, given a chart-id parameter that defaults to the gather-rates chart; no copy of either helper remains.
- [ ] The Units view and the gather rates, gathered resources and floating resources charts draw every line at its exact value, as before.
- [ ] Series legend items, `data-series` keys and line colors in the Buildings view are unchanged.
- [ ] (rework 2) A row where the current run has no value (pinned run longer) keeps the current key `undefined` after the offset is applied, never `NaN`; a unit test in `chart-rows.test.ts` covers it.
- [ ] (rework 1) `docs/aoe4-build-order.md` states the offset rule as "at or a small amount above" its true count, none for the first visible building, and that tooltips show true counts; no doc statement contradicts it.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-13

- Underspecified: behavior at count 0 against the y-axis floor, the testable seams for the tooltip and whole-number ticks, a unit test of the row building with and without the opt-in, slot order, and the Invariants field.
- Changed: offsets are now upward-only below half a building (count 0 stays at or above the floor, default domain kept, whole ticks); named three pure seams in `chart-rows.ts` (offsets, row building, true-count lookup) with unit criteria plus one acceptance criterion for ticks and tooltip; stated slot order and accepted the shrinking-spacing limit; Invariants names A1-A3 as touched but not affected.
- No branch work exists yet.

## Rework 1 - 2026-11-15 (review)

Review of tip c8cb3b3 (report `reports/SGS-157-review-1.md`): REQUEST CHANGES. Earlier gates passed: implementer at c8cb3b3.

Findings:
- `components/apps/aoe4-build-order/line-chart.tsx:159`: `allowDecimals={false}` with recharts' default 5 ticks stretches the Buildings y axis far past the data (BARRACKS_PASTE highest drawn 1.225, axis 0-4; a four-building build gets 0-8 and its lines end about 4 px apart).
- Bug-ticket regression evidence missing: the unit tests fail at base only on a missing import, and the acceptance test fails at base on fractional ticks, not on overlap.
- `acceptance/aoe4-chart-views.spec.ts:166-168`: the new test copies `hoverPlot` instead of reusing it (the helpers only target the gather-rates chart).
- `docs/aoe4-build-order.md:991` (text): "each line is drawn a small amount above its true count" is false for the first visible building, whose offset is 0.

Required fixes:
- [x] Buildings y-axis top is the smallest whole number at or above the highest drawn value; add the acceptance assertion that BARRACKS_PASTE's largest tick is 2.
- [x] Add the acceptance assertion that `capital-town-center` and `barracks` paths (count 1 each) end at different y values; run it once at base e50e074 and record its failure in the report.
- [x] Give `hoverPlot` and `readTooltip` a chart-id parameter (default the gather-rates chart) and use them in the Buildings test; remove the copy.
- [x] (text) Replace the doc sentence with: "In the Buildings view each line is drawn at or a small amount above its true count (a different amount per visible building, none for the first, the same at every time, always below half a building), so buildings with equal counts do not draw on top of each other; the y axis shows whole numbers only and the tooltip shows each building's true count. A pinned building's line is drawn at the same offset as the current line with its key, and a building hidden in the legend takes no offset."

## Rework 2 - 2026-11-15 (tech-lead)

Tech-lead on tip 57d342a (report `reports/batch-SGS-157-SGS-157-tech-lead-1.md`): NEEDS HUMAN REVIEW; owner answered board Q99 "A) Rework now". Earlier gates passed: review 2 at 5d97056, acceptance-test at a38608c, simplify at 57d342a, suite at 57d342a.

Findings:
- `components/apps/aoe4-build-order/chart-rows.ts:63-68` (also `:76`, `line-chart.tsx:102-103,163`): in the Buildings view, when the pinned run has times the current run lacks, `toChartRows` leaves current keys `undefined` in those rows and `toOffsetChartRows`'s `lift` turns them into `NaN` (`value + offset`). Recharts' tooltip filter drops only `== null`, so the tooltip shows "<building>: NaN" for every current building when hovering past the end of a shorter run.

Required fixes:
- [x] In `lift`, pass `undefined` (and `null`) values through unchanged, so a missing value stays missing after the offset.
- [x] Add a `chart-rows.test.ts` case where the pinned run's times extend past the current run's and the current key in the pinned-only row stays `undefined` after `toOffsetChartRows`. Correction (review 3): this case passes on 57d342a, because `toChartRows` omits current keys from pinned-only rows; `NaN` arises only when a series has fewer values than `times`, which Buildings data never produces, so the reported tooltip was not reachable and the guard is defensive. The fewer-values case is the one that fails without it.

## Rework 3 - 2026-11-15 (review)

Delta review of 5d97056..134c9a9 (report `reports/SGS-157-review-3.md`): REQUEST CHANGES. Earlier gates passed: review 2 at 5d97056, acceptance-test at a38608c, simplify and suite at 57d342a; rework 2 code at 134c9a9 approved.

Findings:
- `acceptance/aoe4-chart-views.spec.ts:207-209` and `:227-231`: the two Buildings tests added in a38608c each define the same `endY` lambda, read one path per `evaluate`, and compare values from separate reads with no poll (the `before` gap at :209; the three `expect(await endY(a)).toBe(await endY(b))` at :229-231). The chart can redraw between reads (top margin depends on marker-label rows, `line-chart.tsx:151`), which is the flake LESSONS.md records for `acceptance/**`; the branch also has three copies of the end-y parse.

Required fixes:
- [ ] Add one file-level `lineEndYs(page, id, keys)` helper that reads every requested path's end y in one `chart.evaluate` (the body of :186-191), use it in all three Buildings tests, and wrap the pinned test's three equality assertions in `toPass()`. No assertion changes; no other copy of the end-y parse remains.
