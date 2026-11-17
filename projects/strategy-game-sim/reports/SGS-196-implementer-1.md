# SGS-196 implementer report 1

- Ticket SGS-196, branch `sgs-196-chart-window-math`, tip `7364631ff491489f3e01599afac930da4da88606`, base origin/main 87f0cd7.
- Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-196-chart-window-math`

## Files (all new, in components/apps/aoe4-build-order/)
- `chart-zoom.ts`: TimeWindow, MIN_ZOOM_SECONDS, zoomTo, clampWindow, panWindow, panStepSeconds, timeAtX, rowsInWindow.
- `chart-zoom-bar.tsx`: ChartZoomBar and exported `PanDirection = 'earlier' | 'later'`.
- `chart-zoom.test.ts`, `chart-zoom-bar.test.ts`: table tests per function; markup tests.

## Tests
New: 50 tests, all pass. Full suite `npm test`: 85 files passed, 2663 tests passed, 15 skipped. Invariants encoded: 29 vs 30 s span, full-game null (also from clamping), pan keeps span at both edges, rounded (not truncated) pan step with floor 1, timeAtX clamped, rowsInWindow edge rows (none added when a row sits on the edge), aria-disabled never `disabled`.
Pre-existing tests edited: none.

## Implementation choices
- `rowsInWindow`: a row exactly on `from` or `to` suppresses the extra neighbour row on that side (per Scope).
- `timeAtX` returns `shown.from` when `plot.width <= 0` (avoids NaN; ticket silent).
- The pan buttons' onClick does nothing while aria-disabled (guard in the component); the ticket leaves this to the acceptance spec but it is the safe behavior.
- Range text is `<from> to <to>` (e.g. `1:05 to 2:05`).

## Mutation checks (all undone; final run green)
- chart-zoom.ts panStepSeconds -> `max(0, floor(...))`: failed "odd span rounds the half up", "span of 1 s", "span of 0 s".
- panWindow upper clamp `end - span` -> `end`: failed "later past the end stops at the end and keeps the span".
- rowsInWindow drop `i === after`: failed "rows inside plus both edge rows" and 3 more rowsInWindow rows.
- timeAtX drop clamp: failed "left of the plot", "right of the plot".
- usableWindow drop full-game check: failed 4 (zoomTo and clampWindow full-game rows).
- chart-zoom-bar earlier aria-disabled removed: failed "at the start marks the edge pan button aria-disabled".
- Not mutated: the 30 s span threshold rows and reset/name markup (covered by tables but no break run).

## Doc claims
No docs or comments added.

## Results
- codegen: none set. build (`next build`): passes. lint (`tsc --noEmit` + `lint:dup`): zero issues, 0 clones. Diff holds only the four new files.
- Invariants: none apply; S1 respected (imports only lib/aoe4-build-order and sibling files).
- Unverified assumptions added: none.
- Out-of-scope findings: none.

Status: needs_review
