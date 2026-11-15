# SGS-161 spec gate 1

Verdict: READY

Read at origin/main. No scratch checkout made, and no tests or browser runs.

## Checked
- Scope grounding: `SeriesChart`, `Y_AXIS_WIDTH` (110), `CHART_MARGIN_PX` (5), `placeMarkers`, `wholeNumberAxis`, `XAxis` and `YAxis` (lines 161-162) all exist in `components/apps/aoe4-build-order/line-chart.tsx` and `chart-rows.ts`. The quoted `XAxis` props match the code.
- `git grep XAxis -- components` finds only one XAxis/YAxis pair, in `line-chart.tsx`. The "check every other pair" step is satisfied by that one.
- The quoted test exists: `acceptance/aoe4-build-order-pin-compare.spec.ts:411` ("axis labels do not overlap the tick labels"). It filters ticks with `/^\d+$/`, so it never sees `0:00` ticks, as the ticket says.
- `CHART_IDS` is `RESULT_CHART_IDS` in `acceptance/helpers.ts`.
- `docs/aoe4-build-order.md` and `ARCHITECTURE.md` contain no tick-position or axis-layout wording the change would make untrue.
- Open questions: none. Invariants: none touched. Risk: low is right, since no critical path is touched. On merge: `none` is valid.
- The existing-test rule is stated as a rule (criterion 5), not as a list of today's tests.
- Unverified assumptions lists the recharts layout dependency.

## Notes (non-blocking)
1. Criterion 1 says the test "fails at the base on the `0:00` / `0` pair". The ticket admits the overlap was found by inspection and not reproduced. Bounding-box intersection of the two text boxes is plausible but unconfirmed: the `0` box is about 7 px wide and ends 6-8 px left of the plot edge, and its bottom is about 7 px below the axis line. Whether the `0:00` box top is above that line depends on recharts' tick offset. If the boxes do not intersect at the base, the criterion cannot hold. Suggested wording: "if the boxes do not intersect at the base, the implementer reports that and the test asserts a minimum gap between the two labels."
2. `acceptance/aoe4-chart-views.spec.ts:169` selects y ticks with `[text-anchor="end"]`. The Scope levers (tick margin, padding, offset) leave that anchor alone. If the implementer changes the y axis orientation or anchor, that selector breaks. Criterion 5 already covers this, so no change is needed.
3. Criterion 3 ("no new horizontal overflow at 360 px") can be proved by comparing `document.documentElement.scrollWidth` with `clientWidth` in the same `page.evaluate`.
