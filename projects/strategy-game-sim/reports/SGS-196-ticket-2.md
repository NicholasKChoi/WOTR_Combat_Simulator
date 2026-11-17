# SGS-196 ticket re-spec (report 2)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-196-chart-time-window-math-and-zoom-bar.md

## Summary

Re-spec 1 of "Add the chart time-window math and the zoom bar" (component aoe4-build-order, M11, about 110 business-logic lines, Depends on none, Risk low). Folds in the blocking gap and the notes from `reports/SGS-196-spec-gate-2.md`, checked against origin/main and design/M11.md C10:

- Blocking gap (`panStepSeconds`): Scope now gives C10's formula `max(1, round((to - from) / 2))` and states that the floor of 1 applies only to a span under 2 s passed in directly, since valid windows span at least `MIN_ZOOM_SECONDS`. The criterion (respec 1) is rewritten as rules: half the span rounded the way `Math.round` rounds (even spans give exactly half, odd spans the rounded half, and a test fails if the half is truncated), never under 1 (spans of 0 and 1 s give 1, and a test fails if the floor is dropped). It no longer claims anything about "the smallest spans a window can have".
- Note (`rowsInWindow` on empty rows): Scope and the criterion (respec 1) now require an empty array for empty `rows`.
- Note (`panWindow` with a span larger than `end`): Scope now says `panWindow` and `panStepSeconds` take windows that satisfy the `TimeWindow` invariant, and that behavior outside it is not specified. No criterion was added.
- Note (range separator): left to the implementer as before. The criterion already requires only both `formatMinSec` values.

Verified at origin/main: `chart-rows.ts`, `chart-legend.tsx`/`.test.ts`, `chart-header.test.ts`, and `lib/aoe4-build-order/format-time.ts` exist. None of the new `chart-zoom*` files exist.

Re-spec 1 history section appended. `ticket-lint.py` printed no errors.

## Diagrams

None. The ticket stays a single-component change outside the core loop.

## Open questions

none

## Overlap

None found.
