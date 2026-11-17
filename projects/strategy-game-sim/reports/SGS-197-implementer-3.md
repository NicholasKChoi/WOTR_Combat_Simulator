# SGS-197 implementer report 3 (resume)

- Ticket: SGS-197. Branch: `sgs-197-chart-zoom-pan`. Tip: `8a7ce31c77b54c235f3f7d1bb21c17ef6863d247` (two commits on `22c47e0`, which is origin/main; no sync needed).
- Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-197-chart-zoom-pan`
- Status: `needs_review`

## Resume handling
Kept the interrupted work after reading it against the ticket (hook, `line-chart.tsx`, `chart-markers.*`, `chart-drag.ts`, `use-chart-drag.ts`, CSS); no code changes were needed. Deleted `acceptance/zz-probe.spec.ts` (and two probe specs I made and removed). Added the acceptance spec.

## Files touched
- `components/apps/aoe4-build-order/use-chart-zoom.ts` (new): `useChartZoom(end, readPlot)`; select (B-Z1..3,5), Shift+drag pan, pointer capture, capture-phase Escape, `finish` removes every listener; `plotRef` ends a session as a cancel when the plot unmounts; render-time re-clamp on `end` change stores the clamped window; `panBy`, `reset`.
- `components/apps/aoe4-build-order/line-chart.tsx`: hook wiring, `chart-plot` wrapper, `ChartZoomBar` only while zoomed, `data-zoom-from/to`, numeric x domain `[from,to]` with `allowDataOverflow`, `rowsInWindow` rows feeding the chart and `wholeNumberAxis`, markers/pinned age-ups filtered to `from <= at <= to`, `placeMarkers` over the window, `pinnedLegendShown` count from drawn pinned age-ups, exported `bandIn` for the step band, `chart-zoom-selection`, Reset focuses `chart-collapse`.
- `components/apps/aoe4-build-order/chart-markers.ts`: `placeMarkers` takes an `origin` (default 0).
- `components/apps/aoe4-build-order/chart-drag.ts`, `use-chart-drag.ts`: `DRAG_THRESHOLD_PX` exported, private copy deleted.
- `components/apps/aoe4-build-order/results.module.css`: `user-select` off on the plot, crosshair/grabbing cursors, disabled-looking zoom-bar buttons (`aria-disabled`).
- `components/apps/aoe4-build-order/chart-markers.test.ts`, `line-chart.test.ts`: unit rows for `origin` and `bandIn`.
- `acceptance/aoe4-chart-zoom.spec.ts` (new): 27 tests covering B-Z1..B-Z15 and the listener/collapse criteria, at 1200 and 1800 px for the plot-box case.

## Tests
- Unit (`npm test`): 88 files passed, 1 skipped; 2745 passed, 15 skipped. Invariants encoded: `placeMarkers` measures from the origin; `bandIn` clips a span, drops a zero-width overlap, keeps a one-point band on the edges.
- `acceptance/aoe4-chart-zoom.spec.ts`: 27 passed. Existing specs run and passing unchanged: `aoe4-chart-layout`, `aoe4-chart-readability`, `aoe4-chart-views`, `aoe4-split-tab-order`, `aoe4-marker-labels` (57 passed); `aoe4-build-order-step-band`, `aoe4-build-order-pin-compare`, `aoe4-results-split`, `aoe4-auto-run` (73 passed).
- Pre-existing tests edited: none.
- Pinned outputs: none beyond the spec's data checks. The y-axis case relies on the Buildings view lifting a later line by a fraction of a count (top 2 from the inside rows alone, above 2 once the edge row with count 2 is included); the build is `TWO_BARRACKS` in the spec, asserted from the API result first.

## Mutation checks
Each break was made in the committed code, the named test run, and the break undone with `git checkout -- components`.
- `use-chart-zoom.ts` `y >= plot.top &&` removed: label-rows press zooms (`short, spans ...` fails at "from the label rows above the grid", window 360-840). Needed the spec to read the box after the page settled (`steadyBox`); before that the case passed vacuously.
- `DRAG_THRESHOLD_PX` replaced by 0: "selection shows only while button is down" (both viewports) and the short-drag table fail on `chart-zoom-selection` count.
- `allowDataOverflow` removed: "x axis spans" fails on the marker x position (5.3 px off the window mapping), window chosen so rows fall outside both edges (asserted).
- Zoomed `wholeNumberAxis` rows filtered to strictly inside: Buildings y-axis test fails (`top` 2, expected above 2).
- Plot-unmount cancel removed (`plotRef` no-op): "collapsing the chart while a selection is held" fails.
- Re-clamp on `end` change removed: "a shorter run caps the window" fails.
- `panBy` step `+ 1`: "pan buttons move the window by panStepSeconds" fails.
- `pointerup` listener left in `finish`: "Escape and pointercancel end a selection" fails (release after Escape zooms).
- Marker/pinned drawn-in-window filter replaced by the full list: "with every line hidden, the pinned legend shows only while a pinned age-up is inside the window" fails (legend count 1). The marker-DOM test does not fail on this break because recharts discards reference lines outside the domain; label placement is covered by the `origin` unit row.
- Reset focus line removed: Reset, Enter and Space tests fail on `toBeFocused`.
- `placeMarkers` `origin` ignored: unit row fails. `bandIn` `<` to `<=`: two unit rows fail (zero-width overlap).
- Weak spot: the clip-width assertion in "x axis spans" holds for any recharts line, so only the marker-position and tick assertions guard our code.

## Build, lint, codegen
- codegen: none set. `npx next build`: passed. `npx tsc --noEmit` and `npm run lint:dup`: clean (0 clones). Unit suite above.
- No server left running (checked `next dev` processes: 0).

## Doc claims
- `chart-markers.ts` comment: "`end` is the plot's span in seconds and `origin` the time at its left edge." True of `placeMarkers` (width scale uses `end`, positions use `marker.at - origin`).
- `line-chart.tsx` `bandIn` comment: "its overlap with the window when it spans time, its own time when it is one point, null when it falls outside." Matches the function body.
- Spec comments: Buildings lift and marker-position comments describe `wholeNumberAxis`/axis behaviour as read from `chart-rows.ts`.

## Invariant check
No A1 to A3 touch: only chart UI state and drawing changed; nothing stored (spec asserts the layout storage value unchanged).

## Unverified assumptions added
None beyond the ticket's list; all are exercised in Chromium by the spec.

## Notes / deviations
- Playwright treats `aria-disabled="true"` as not actionable, so the spec clicks disabled pan buttons with `force: true`.
- Spec's step-band case covers inside and wholly-outside; partial-overlap clipping and one-point edges are unit-tested through `bandIn` only.
- The marker-label overlap check cannot distinguish a placeMarkers given the full-game end on this build; that rule is pinned by the unit row.

## Out-of-scope findings
None.
