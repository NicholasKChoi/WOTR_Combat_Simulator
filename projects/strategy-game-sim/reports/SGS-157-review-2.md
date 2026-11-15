# SGS-157 review 2 (rework 1 re-review)

Verdict: APPROVE
Branch: sgs-157-buildings-chart-overlap, tip 5d970560fb5c83291d6303a14a8b4cd9b8218bb2, base e50e074 (origin/main is now c5bd608; its new commits touch only `acceptance/aoe4-results-split.spec.ts` and `lib/combat-simulator`, none of the files in this diff). Not stacked. I reviewed the whole branch (`git diff e50e074...HEAD`, six files) and checked each Rework 1 required fix.

## Blocking findings

None.

## Rework 1 required fixes

1. Y-axis top: landed. `wholeNumberAxis` (`chart-rows.ts:87-95`) sets the domain to `[0, max(1, ceil(highest visible drawn value))]` and builds whole-number ticks with step `ceil(top/5)`. `line-chart.tsx:140,162` passes them to `YAxis` only when `offsetLines` is set. The acceptance test asserts the data precondition (max count 1) and then `Math.max(...tickValues) === 2` (`aoe4-chart-views.spec.ts:153,165`). The implementer recorded this assertion failing with "Received 4" when the tip's `allowDecimals={false}` was restored. The inspection confirms the result: for BARRACKS_PASTE the y axis now runs 0-2 at every width (grid 5-325, Capital Town Center ends at y=165 (count 1.000) and Barracks at y=129 (1.225), so 1 unit is 160 px). The tip c8cb3b3 ran 0-4.
2. Equal-count regression test: landed. `Buildings draws two buildings with equal counts as separate lines` (`spec:176-195`) first asserts both last counts are 1. It then reads both `d` attributes in a single `evaluate` (per LESSONS.md) and asserts the end y values differ. The implementer report records the base run at e50e074 failing at spec line 194 on `not.toBe` with both paths ending at y=5, the assertion that names the bug, and the data preconditions passed. My inspection matches at the tip: the two paths end at y=165 and y=129.
3. `hoverPlot` / `readTooltip` take a chart-id parameter that defaults to `RATES` (`spec:44,55`). The Buildings test calls `hoverPlot(page, UNITS)` and `readTooltip(page, UNITS)`, and the copied hover code is gone. Existing call sites are unchanged.
4. (text) `docs/aoe4-build-order.md:991` matches the required replacement word for word (diffed against the ticket).

## Spec gaps

None.

## Acceptance criteria

- (respec 1) Offset-function unit test: pass. `lineOffsets` `it.each([2, 3, 17])` checks that offsets are distinct, non-negative, below 0.5 and increasing; this is unchanged since review 1.
- (respec 1) Row-building unit test, with and without the opt-in: pass. Without the opt-in, `line-chart.tsx:139` calls the unchanged `toChartRows`, which its existing tests cover.
- (respec 1) Count 0 is drawn at or above 0: pass (unit test). In the inspection the count-0 segments sit above the floor (screenshots).
- Hidden building takes no slot: pass. The unit test covers it, and so does the browser: with Capital Town Center hidden, Barracks moves to offset 0 (y=5 at count 1 on a 0-1 axis), and in the "many" paste Dock moves to 1.225.
- Pinned line shares its offset, and a pinned-only building gets a distinct one: pass (unit test). The offset logic is unchanged since review 1. `wholeNumberAxis` counts pinned rows and drops a hidden key's pinned line (unit test `ignores hidden buildings and their pinned lines`, both directions).
- (respec 1) True-count lookup test and formatter: pass. `trueCount` is tested, and `trueCountFormatter` (`line-chart.tsx:101-102`) uses it. The inspection tooltip showed `Barracks : 1`, `Capital Town Center : 1` and, for the many paste, `Barracks : 2 / Capital Town Center : 1 / Dock : 1`.
- (respec 1) Acceptance test: whole-number ticks at or above 0, and whole-number tooltip values: pass by reading. Each assertion can fail: a fractional tick, a drawn value of 1.2 shown in the tooltip.
- (rework 1) Largest tick is 2 for BARRACKS_PASTE: pass (`spec:165`). The precondition is asserted, and the recorded failure on the old axis was Received 4.
- (rework 1) The `capital-town-center` and `barracks` paths end at different y values, with a recorded failure at the base on the end-y assertion: pass (implementer report "Bug regression on base").
- (rework 1) The tests reuse `hoverPlot` / `readTooltip` with a chart-id parameter, and no copy remains: pass.
- Units view and the other three charts draw exact values as before: pass. `offsetLines` is set only for `chart-units-produced` with the `buildings` view (`results.tsx:109`). Without it, `domain` and `ticks` are `undefined`, and recharts' `resolveDefaultProps` (`node_modules/recharts/lib/util/resolveDefaultProps.js`, used at `YAxis.js:172`) replaces undefined props with the defaults. The inspection's Units view at 1280 shows recharts' default 0/15/30/45/60 ticks.
- Legend items, `data-series` keys and colors unchanged: pass. The `Line` and legend code is untouched, and the inspected legend names and `data-series` keys match the series.
- (rework 1) The doc states the rule as "at or a small amount above", "none for the first", and tooltips showing true counts: pass. No other doc sentence contradicts it, and "Tooltip values are shown rounded to at most 1 decimal place" still holds for the other charts.
- No INVARIANTS.md regressions: pass.

Bug-type checks: the fix lands at the cause the Context names (the rows and axis in `SeriesChart`), and the regression test is recorded failing at the base on the overlap assertion.

Pre-existing tests: no assertion in a base test was changed. The only removed lines in the test diffs are the two helper signatures, which gained a defaulted parameter, and the `chart-rows.test.ts` import line, which was extended. No base test was weakened.

## Invariants touched

- A1, A2, A3 (path `components/apps/aoe4-build-order/**`): hold. The change is display-only: `wholeNumberAxis` is a pure function of the rows, with no simulation, data, randomness or time.
- S1-S3 and W1-W2: not touched.

## Spec-checklist

Contracts: no API, field or metric names change. Scope: nothing out of scope is implemented and nothing touches `golang/`. Open questions: none answered with an invented constant (`MAX_Y_TICK_STEPS = 5` matches recharts' default tick count and decides no open question). Naming: `wholeNumberAxis`, `seriesKeyOf` and `MAX_Y_TICK_STEPS` state intent. A1-A3 hold.

## Bot reconciliation

REPO.md has no `reviewBot.cli` and no `rulesFile`, so this section was skipped.

## Lint and build

- `npx tsc --noEmit`: clean.
- `npm run lint:dup`: 0 clones.
- `npx next build`: compiled successfully.
- `vitest run chart-rows.test.ts`: 44 passed.
- I ran no acceptance tests.

## UI inspection

Served the task checkout (`npx next dev -p 3977`) and stopped it afterwards (`serve.sh stop`: port free). `inspect.cjs` loaded `/apps/aoe4-build-order` at 360x760, 390, 700, 768 and 1280 px with two pastes: BARRACKS_PASTE, and a "many" paste with two barracks and a dock, ending at Capital Town Center 1, Barracks 2, Dock 1. On each page it switched Units produced to Buildings and hovered at 80% of the plot. At 1280 px it also hid the first legend item and switched back to Units.

- Clipped overflow inside the chart: none. Document horizontal overflow: 0 at every width.
- Overlapping labels: only `0:00` against `0` at the origin, at every width. This is pre-existing (seen on the base in review 1) and out of scope.
- Mid-word wrapping: none.
- Lines: equal counts draw apart. BARRACKS_PASTE ends at 165 and 129. The many paste ends at Capital Town Center 218.3, Dock 186.3 and Barracks 95.7, on a 0-3 axis (highest drawn value 2.15), which matches the rule.
- Y axis: in the screenshots the ticks are 0,1,2 (BARRACKS_PASTE) and 0,1,2,3 (many). With the first building hidden, the axis refits to 0-2 and offset 0 lines sit on the top gridline (many-1280-hidden). The Units view keeps the default ticks.
- Tooltip: true whole-number counts everywhere. At 360 px a tooltip placed near the right edge cuts off "Capital Town Center : 1". This is recharts' tooltip placement for a hover at 80% of the plot, pre-existing and the same on any chart; the diff does not change it. At 768 px the "many" hover point fell below the viewport (grid top 905 in a 900 px viewport), so that one reading is empty, an artifact of my script.
- My script's y-tick selector (`.recharts-yAxis ...`) matched nothing, so I read the tick values from the screenshots instead. Screenshots read: barracks-1280, many-360, many-1280-hidden, many-1280-units. They were in the scratch and were removed with it.

## Non-blocking notes

- `chart-rows.ts:88-89`: when `top` is not a multiple of `step` (top above 5, for example 7 gives ticks 0,2,4,6, and 14 gives 0..12), the top gridline has no label. The code comment says so and the ticket does not forbid it, but a reader may find an unlabeled top band odd. Choosing a step that divides `top` (or labelling the top too) would avoid it. This is a follow-up at most.
- `chart-rows.ts:46` (carried over from review 1): the comment repeats the literal `0.45` next to `MAX_LINE_OFFSET`.
- `chart-rows.ts:91`: `Math.max(0, ...values)` spreads every row value. This is fine at today's sample counts (hundreds of rows times about 10 series); a reduce would avoid argument-count limits if rows grow a lot.

## Coverage

Reviewed `chart-rows.ts`, `chart-rows.test.ts`, `line-chart.tsx`, `results.tsx`, `acceptance/aoe4-chart-views.spec.ts` and `docs/aoe4-build-order.md:991` in full, plus the c8cb3b3..HEAD delta line by line. Siblings compared: the spec file's own `hoverPlot` / `readTooltip` / `hoverRead` (`spec:44-77`) and `acceptance/helpers.ts:123` (`plotPoint`). Applied the REPO.md review checklist's Every diff section (build, page load) and its AoE4 build order section (widths 360x760/768/1280 and 390/700/1280, overflow, label overlap). `LSP` was not used; `offsetLines` and `wholeNumberAxis` have a single call site each (`results.tsx:109`, `line-chart.tsx:140`).
