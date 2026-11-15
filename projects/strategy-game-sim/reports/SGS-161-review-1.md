# SGS-161 review 1

Verdict: APPROVE (tip 774514b5, base origin/main)

## Blocking findings
None.

## Acceptance criteria
- No two tick labels overlap at 360/768/1280 on every CHART_IDS chart, fails at base on 0:00/0: pass by reading. The new test reads all rects in one `evaluate` per chart and checks pairwise disjointness. The implementer recorded 3 failures at base on `"0:00" overlaps "0"` and a mutation check (removing `tickMargin`) failing on that pair. I ran no browser tests.
- Buildings (offset-lines) and default y axes both covered: pass. UNITS is switched to Buildings and the other charts stay default.
- No clipped tick, no new horizontal overflow at 360: pass by reading. Left, right and bottom are checked against the svg bounds and `scrollWidth <= clientWidth` is asserted. Top clipping is not checked, which is acceptable since the change only lowers x labels. The overflow assertion was not mutation-checked, per the implementer.
- Marker labels still inside the plot: pass. Plot left and right extents are unchanged, so `placeMarkers`, `Y_AXIS_WIDTH` and `CHART_MARGIN_PX` stay valid. The plot gets 10 px shorter. The implementer ran the marker-labels, chart-layout, chart-readability and other specs, 124 passed. I did not rerun them.
- Pre-existing tests keep their assertions: pass. The diff only adds to the spec file.
- INVARIANTS: none apply (ticket says none), none touched.

## Scope and other checks
- `git grep XAxis -- components` finds only `SeriesChart`, so there is no other axis pair.
- Docs: `docs/aoe4-build-order.md` and `ARCHITECTURE.md` contain no wording the change makes untrue.
- Doc claim: the comment above `X_TICK_MARGIN_PX` matches the code (the margin lowers the labels and the height 40 keeps them inside the svg).
- Lint: `npx tsc --noEmit && npm run lint:dup` is clean, 0 clones.
- Review bot: none configured.
- Convention: the test uses the file's existing `chart`, `option`, `expectPressed` and `runOk` helpers and a width loop, with no copied blocks. The one-evaluate rule from LESSONS.md is followed. Constants are named and sit next to the sibling layout constants.

## Non-blocking notes
- The ticket's UI inspection did not run, because it needs a simulation run before the charts render. Coverage here is the acceptance test's own rect measurements.
- `X_TICK_MARGIN_PX` of 12 is tuned to the current 24 px label box. It is covered by the test, so a regression fails loudly.

## Coverage
Reviewed `components/apps/aoe4-build-order/line-chart.tsx`, `acceptance/aoe4-chart-views.spec.ts` and the implementer report. Not reviewed: no UI screenshots were taken.
