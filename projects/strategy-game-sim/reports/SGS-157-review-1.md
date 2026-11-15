# SGS-157 review 1

Verdict: REQUEST CHANGES
Branch: sgs-157-buildings-chart-overlap, tip c8cb3b349640878f39a7c6ead2c405bece76c55f, base origin/main e50e074 (not stacked). Full review (not delta).

## Blocking findings

1. `components/apps/aoe4-build-order/line-chart.tsx:159` - correctness - With `allowDecimals={false}` and recharts' default `tickCount` of 5, the Buildings y axis stretches far above the data, so the lines sit in the bottom of the plot. Measured with the UI inspection: BARRACKS_PASTE (`start 6 sheep -> sheep` / `@1:00 build barracks with 1 from sheep`) has a highest drawn value of 1.225. The axis runs 0-4 on the tip (ticks `0,1,2,3,4`) where the base ran 0-1. The top line is at y=245 of a 5-325 plot at every width (360/390/700/768/1280), so about 75% of the plot is empty (screenshots `shots-tip/barracks-*.png`). A 4-building build with a highest drawn value of about 4.3 gets an axis of 0-8 (`shots-tip/twoBarracks-1280.png`). - Why it matters: this is a visible regression in the view the diff changes. It also shrinks the vertical gap between offset lines, which is the point of the fix: on the 0-8 axis, adjacent count-1 lines are 4.3 px apart at 1280 px (y 320.7 / 316.4 / 312.1). A 0-5 axis would give about 7 px. - Direction: keep whole-number ticks, but make the top of the axis the smallest whole number at or above the highest drawn value: 2 for BARRACKS_PASTE (drawn max 1.225), not 4. One option is explicit `ticks` (integers 0..top, thinned when there are many) with `domain={[0, top]}`. Another is a domain function plus a `tickCount` that fits; the implementer picks the mechanism. Add to the new acceptance test in `acceptance/aoe4-chart-views.spec.ts` (`Buildings draws whole-number y ticks ...`) an assertion that the largest y tick is 2 for BARRACKS_PASTE. It fails on the current `line-chart.tsx:159` (largest tick 4) and passes once the fix lands (2). The precondition holds: the result has two production buildings, each with count 1 at most, so the drawn max is below 2. Assert that precondition first from the `runOk` result (`Math.max(...result.productionBuildings.flatMap((b) => b.counts)) === 1`).

2. `components/apps/aoe4-build-order/chart-rows.test.ts:206` / `acceptance/aoe4-chart-views.spec.ts:150` - test - This is a Bug ticket, and the implementer's report has no record of the regression test failing at the base on the assertion that names the bug ("Bug-ticket regression-on-base run: ... I did not run the scratch-checkout base check"). The unit tests can only fail at the base on a missing import, which is a setup failure. At the base the acceptance test fails on the y-tick assertion, not on overlap: the inspection saw base ticks `0, 0.25, 0.5, 0.75, 1`. No test asserts in the rendered chart that two buildings with equal counts draw distinct lines. - Why it matters: nothing shows the shipped chart stops drawing equal-count buildings on top of each other. The unit seams could be correct while `SeriesChart` still passes `toChartRows` rows. - Direction: add a regression in `acceptance/aoe4-chart-views.spec.ts` on the Buildings view with BARRACKS_PASTE. First assert the data precondition from the `runOk` result: Capital Town Center and Barracks both have count 1 at the last sample. Then assert that the last point of `path[data-series="capital-town-center"]` and `path[data-series="barracks"]` has different y coordinates. Read both `d` attributes in one `evaluate`, per LESSONS.md. It fails when `line-chart.tsx:154` passes `toChartRows(times, series, pinned)` in place of `toOffsetChartRows(...)`. Before the fix, both paths end at y=5 (identical; base inspection). After it, they end at y=245 and y=307 on the current axis. Run it once at the base (a scratch at origin/main with the test file copied in) and record in the implementer report that it fails there on this assertion.

3. `acceptance/aoe4-chart-views.spec.ts:166-168` - convention - The new test re-implements the file's `hoverPlot` (`aoe4-chart-views.spec.ts:44-48`: `plotPoint`, then two `mouse.move` calls), hard-wired to `UNITS`, because `hoverPlot` and `readTooltip` are hard-wired to `RATES`. - Why it matters: two copies of the hover sequence drift (the same file already reads the tooltip one way in `readTooltip` and another way here). - Direction: give `hoverPlot(page, id = RATES)` and `readTooltip(page, id = RATES)` a chart-id parameter and use them in the new test: `await hoverPlot(page, UNITS)`, then check `Object.values((await readTooltip(page, UNITS)).values)`. Existing call sites stay unchanged.

4. `docs/aoe4-build-order.md:991` - contract (text) - "each line is drawn a small amount above its true count" is false for slot 0: `lineOffsets` (`chart-rows.ts:48`) gives the first visible building an offset of `0 * 0.45 / n = 0`, so its line sits exactly on its count (the implementer's Notes say so). Replace the paragraph with:
   "In the Buildings view each line is drawn at or a small amount above its true count (a different amount per visible building, none for the first, the same at every time, always below half a building), so buildings with equal counts do not draw on top of each other; the y axis shows whole numbers only and the tooltip shows each building's true count. A pinned building's line is drawn at the same offset as the current line with its key, and a building hidden in the legend takes no offset."
   Facts kept: a different amount per visible building; the same at every time; always below half a building; the purpose (equal counts do not draw on top of each other); the y axis shows whole numbers only; the tooltip shows true counts; pinned lines share the current line's offset; hidden buildings take no offset. Fact corrected: "a small amount above" becomes "at or a small amount above", with "none for the first".

## Spec gaps

None.

## Acceptance criteria

- (respec 1) Offset-function unit test: pass. `chart-rows.test.ts` `lineOffsets` `it.each([2, 3, 17])` checks distinct, >= 0, < 0.5 and increasing. Equal counts with several series are covered in `toOffsetChartRows`. The implementer's mutations (negated, `(i+1)*0.5/n`) failed it.
- (respec 1) Row-building unit test: pass. "draws equal counts at distinct values ..." first asserts `raw[0].a === raw[0].b`, then checks each value is distinct and within [count, count+0.5). Without the opt-in, `line-chart.tsx:154` calls the unchanged `toChartRows`, and the existing `toChartRows` tests cover that path. No separate "without opt-in" test exists; by construction it is the same function.
- (respec 1) Count 0 is drawn at >= 0: pass. The first test checks `row[s.key] >= s.values[i]` at t=5, where every count is 0; the negation mutation failed it.
- Hidden building takes no slot: pass (compared against a chart without `a`; the filter-drop mutation failed it). The inspection confirms it in the browser: after hiding Capital Town Center, Barracks moved to offset 0 (y=325 at count 0).
- Pinned shares offset; pinned-only gets a distinct one: pass (`rows[0]['pinned:b'] === rows[0].b`; `pinned:z` is distinct and above `c`).
- (respec 1) True-count lookup test and formatter: pass. `trueCount` returns 2 where `row.b === 2.225`. `trueCountFormatter` (`line-chart.tsx:101-102`) uses it. The inspection tooltip showed `Barracks : 1`, `Capital Town Center : 1`.
- (respec 1) Acceptance test (whole-number ticks >= 0, whole-number tooltip values): pass by reading. It can fail: at the base the ticks were 0.25-stepped, and the implementer's formatter and `allowDecimals` mutations failed it. Findings 1 and 3 add to and reshape it.
- Units view and other charts unchanged: pass. `offsetLines` is set only for `chart-units-produced` + `buildings` (`results.tsx:109`); the Units view ticks at the tip (`0,4,8,12,16` and `0,20,...`) match the base.
- Legend items, `data-series`, colors unchanged: pass. The `Line` props are untouched, and the legend names and `data-series` keys in the inspection match the base.
- Docs state the offset rule and true-count tooltip: fail (finding 4, text). Nothing else in the doc contradicts it; "Tooltip values are shown rounded to at most 1 decimal place" (line 996) still holds.
- No INVARIANTS.md regressions: pass.

Bug-type checks: the fix lands at the cause the Context names (`SeriesChart` rows, `line-chart.tsx:154`). The base-failure record is missing (finding 2).

## Invariants touched

- A1, A2, A3 (path `components/apps/aoe4-build-order/**`): hold. The change is display-only, with no simulation or data path and no randomness or time (the offsets are deterministic from slot order).
- S1-S3: not touched (no `pages/apps/**` or shared paths).

## Spec-checklist

- Contracts: no API, field or metric names changed. Scope: nothing out of scope, nothing under `golang/`. Open questions: none were answered with a constant; 0.45 sits within the ticket's "below half a building". Naming: `offsetLines`, `lineOffsets`, `toOffsetChartRows`, `trueCount` state intent. A1-A3: hold.

## Bot reconciliation

No `reviewBot.cli` and no `rulesFile` in REPO.md; section skipped.

## Lint

`npx tsc --noEmit`: clean. `npm run lint:dup`: 0 clones. `npx next build` (Every-diff checklist): passes. `chart-rows.test.ts`: 38 passed.

## UI inspection

Served the task checkout at the tip (`npx next dev`, port 3987) and, for comparison, my scratch at origin/main (port 3988). Both are stopped. Loaded `/apps/aoe4-build-order` at 360x760, 390, 700, 768 and 1280 px. Ran BARRACKS_PASTE and a four-building paste, switched Units produced to Buildings, hovered at 80% of the plot, hid the first legend item (1280), and switched back to Units (1280).
- Overflow inside the chart: none. Document horizontal overflow: none at any width.
- Overlapping tick labels: `0:00` x tick against `0` y tick at every width. This is pre-existing (identical at the base) and out of scope; see notes.
- Mid-word wrapping: none seen in the screenshots.
- Lines: at the tip, equal-count buildings draw distinct paths (y 245 vs 307 for count 1 vs offset). At the base both are at y=5 and identical, which confirms the bug and the fix.
- Y axis: whole-number ticks at the tip, but stretched to 0-4 or 0-8 (finding 1). The base showed `0, 0.25, 0.5, 0.75, 1`.
- Tooltip: whole-number true counts at every width.
- Screenshots: `shots-tip/` and `shots-base/` in the scratch; removed with it.

## Non-blocking notes

- `chart-rows.ts:46`: the comment repeats the literal `0.45` next to `MAX_LINE_OFFSET`. Say "Slot i of n gets i * MAX_LINE_OFFSET / n" so the two cannot drift.
- `chart-rows.ts:52`: `offsetSlotKeys` is exported but used only inside `chart-rows.ts` and not tested directly. It could stay module-private.
- `line-chart.tsx:16`: in the alphabetized import list, `toOffsetChartRows` sits before `toChartRows`.
- Out of scope, pre-existing: in every `SeriesChart` the `0:00` x tick label overlaps the `0` y tick label at the origin, at all widths, on the base too. The REPO.md AoE4 checklist forbids overlapping tick labels; worth a BACKLOG item.

## Coverage

Reviewed all six changed files: `chart-rows.ts`, `chart-rows.test.ts`, `line-chart.tsx`, `results.tsx`, `acceptance/aoe4-chart-views.spec.ts`, and `docs/aoe4-build-order.md` (line 991 and the surrounding chart paragraphs). Siblings compared: `aoe4-chart-views.spec.ts:44-77` (hover and tooltip helpers) and `acceptance/helpers.ts:123` (`plotPoint`). The REPO.md review checklist's Every diff and AoE4 build order sections were applied (360x760/768/1280 and 390/700/1280 widths). No acceptance or e2e tests were run.
