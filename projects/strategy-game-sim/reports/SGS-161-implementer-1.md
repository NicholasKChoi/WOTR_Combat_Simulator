# SGS-161 implementer 1

Status: needs_review

- Ticket: SGS-161. Branch `sgs-161-chart-axis-corner-labels`, tip `774514b5a801b82ce546da318fff96de4079deae`, base origin/main `d4fd59a`.
- Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-161-chart-axis-corner-labels`

## Files touched
- `components/apps/aoe4-build-order/line-chart.tsx`: `XAxis` gets `tickMargin={X_TICK_MARGIN_PX}` (12) and `height={X_AXIS_HEIGHT}` (40); two constants and one comment added.
- `acceptance/aoe4-chart-views.spec.ts`: one test per width (360, 768, 1280).

## Cause confirmed
Reproduced at base: `chart-units-produced "0:00" overlaps "0"` at all three widths. The boxes intersect, so the criterion holds as written (no minimum-gap fallback needed). Measured at 1280: the `0:00` box top was 782.8 and the `0` box bottom 785.2 (text boxes are 24 px tall), so they overlapped by about 2 px vertically and horizontally.

## Fix
- `tickMargin` 8 with the default axis height still overlapped (the test failed at the break below).
- `tickMargin` 12 cleared the overlap but clipped `0:00` at the svg bottom, so the x axis height went from the default 30 to 40.
- Only the x axis changed. Y axis anchor and `[text-anchor="end"]` selector untouched. `Y_AXIS_WIDTH`, `CHART_MARGIN_PX`, `plotWidth` and `placeMarkers` untouched, because the plot's left and right extents did not change. The plot is 10 px shorter (the taller x axis).
- Other XAxis/YAxis pairs: `git grep XAxis -- components` finds only `SeriesChart`. None other to fix.
- Docs: grep of `docs/aoe4-build-order.md` and `ARCHITECTURE.md` for tick or axis wording found nothing the change makes untrue; no doc edit.

## Tests
- New: 3 Playwright tests (360, 768, 1280). Each runs the Buildings view on `chart-units-produced` (offset-lines y axis) and the default view on the other `CHART_IDS` charts. One `evaluate` per chart reads all tick label rects. Asserts: `0:00` tick exists, more than 2 ticks, no two tick boxes intersect, no tick outside the svg (left, right, bottom), and `documentElement.scrollWidth <= clientWidth`.
- Result with the fix: 3 passed. At base (before the fix): 3 failed on `"0:00" overlaps "0"`.
- Existing acceptance specs run, because this changes chart geometry: chart-views, marker-labels, chart-layout, chart-readability, pin-compare, step-band, gathered-resources, narrow-layout, small-screen. 124 passed, 0 failed. No pre-existing test edited. The full acceptance suite was not run.
- Unit: `npm test` 2609 passed, 15 skipped (the existing skips). Lint (`tsc --noEmit` and `lint:dup`): 0 issues, 0 clones. `next build`: succeeded. Codegen: not set.

## Mutation check
- Break: removed `tickMargin={X_TICK_MARGIN_PX}` from the `XAxis` in `line-chart.tsx` (the 1280 test, with height 40 kept). Failed with `chart-units-produced "0:00" overlaps "0"`. Restored; the commit has the prop.
- The clip assertions were exercised by the margin 12 / height 30 state, which failed with `"0:00" clipped`. I did not run a separate break of the overflow assertion (`scrollWidth`); it is not independently mutation-checked.

## Doc claims
- Comment above `X_TICK_MARGIN_PX` (`line-chart.tsx`): "Lowers the x tick labels so the 0:00 label clears the y axis's bottom tick, which is centred on the axis line; the taller axis keeps them inside the chart." Backed by the measurements above.

## Invariants
No INVARIANTS.md entries apply (ticket: none). Existing marker-label tests keep their assertions and pass.

## Unverified assumptions
None added. The ticket's recharts layout assumption is exercised by the Playwright test, not faked.

## Out-of-scope findings
None.
