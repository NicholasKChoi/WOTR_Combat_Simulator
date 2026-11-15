# SGS-157 acceptance-test 1

Verdict: PASS. Branch sgs-157-buildings-chart-overlap, new tip a38608c2fba33708fb8ea27ebee0a8a67259d60a (was 5d97056). Only `acceptance/aoe4-chart-views.spec.ts` changed. No failures.

Harness ran: acceptance:setup, then Playwright (Chromium, own next dev). 94 of 94 passed across aoe4-chart-views, aoe4-build-order-pin-compare, aoe4-chart-layout, aoe4-chart-readability, aoe4-marker-labels and aoe4-gathered-resources (the first two include the two new tests). `npx tsc --noEmit` and `lint:dup` are clean.

## Tests written (the implementer's two already covered the tick and end-y criteria)
- `hiding a Buildings line in the legend widens the gap between the remaining lines`: three buildings, each at count 1. Hiding the last one (legend click) makes the gap between the other two lines' end y grow, so a hidden series gives up its slot.
- `Buildings draws a pinned line at the same height as the current line with its key`: after Pin and a rerun, `pinned:barracks` and `pinned:capital-town-center` end at the same y as their current lines, and the two pinned lines end at different y values.

## Existing implementer tests (run, passing)
- Whole-number ticks from 0, largest tick 2 for BARRACKS_PASTE, whole-number tooltip values.
- capital-town-center and barracks (count 1 each) end at different y.
- Units-view, pin-compare dash and the other chart specs are unchanged and passing.

## Mutation checks (each undone with `git checkout`; `git diff --exit-code` on components clean)
- `chart-rows.ts` `offsetSlotKeys`: dropped the `.filter(!hidden)`. The hiding test failed at `expect.poll(gap).toBeGreaterThan(before)`, 24 vs 24.
- `chart-rows.ts` `toOffsetChartRows`: `offsets[seriesKeyOf(key)]` changed to `offsets[key]`. The pinned test failed at `expect(endY('pinned:barracks')).toBe(endY('barracks'))`, 165 vs 129.
- `chart-rows.ts` `lineOffsets`: every offset set to 0. The equal-counts test failed at `townCenterEnd` not equal to `barracksEnd`.
- `chart-rows.ts` `trueCount`: returned `row[key]`. The tick/tooltip test failed at the whole-number tooltip assertion.
- `chart-rows.ts` `wholeNumberAxis`: top raised by 2. The tick/tooltip test failed at `max tick toBe(2)`, got 4.
- Offsets changed to start at -0.3. The tick test failed at `max tick toBe(2)`, got 1. A negative offset is therefore caught only through the axis top here; the negative-offset and count-0 floor criteria are pinned by the unit tests.

## Not expressible in this harness
- Units view and the other three charts "drawn at exact values": there is no cheap build with two units at equal counts, so this is covered only by the passing unchanged chart and pin-compare specs and the opt-in prop default.
- Exact offset values and the "below half a building" bound are unit-level; the page only shows end y positions in pixels.

Out-of-scope findings: none.
