# SGS-196: Add the chart time-window math and the zoom bar

- **Type**: Feature
- **Component**: aoe4-build-order
- **Milestone**: M11
- **Priority**: medium
- **Risk**: low
- **Invariants**: none
- **Unverified assumptions**: none
- **LOC estimate**: 110 (`chart-zoom.ts` about 60, `chart-zoom-bar.tsx` about 50; business logic only)
- **Depends on**: none
- **On merge**: none
- **Source**: `design/M11.md` C10, C12 and rows B-Z3, B-Z4, B-Z8, B-Z12 (math part); `plans/M11-20261116.md` outline I1; owner answer Q129 (y axis counts the edge rows)

## Context

M11.1 lets the owner zoom each results chart to a time window. This ticket adds the pure window math (C10) and the `ChartZoomBar` markup (C12) that the later drag-select ticket wires into `line-chart.tsx`. Nothing imports them until then, so the ticket changes no behavior the owner sees; both files are unit-tested on their own.

## Scope

New files only, in `components/apps/aoe4-build-order/`. Names and signatures are the design's C10 and C12; use them exactly.

`chart-zoom.ts` (pure, no React):
- `interface TimeWindow { from: number; to: number }`: whole seconds, `0 <= from < to <= end`.
- `MIN_ZOOM_SECONDS = 30`.
- `zoomTo(a, b, end): TimeWindow | null`: orders the two times, rounds each, clamps each to `[0, end]`; `null` when the span is under `MIN_ZOOM_SECONDS` or the result is the full game `[0, end]` (B-Z3, B-Z4).
- `clampWindow(window, end): TimeWindow | null`: caps `to` at `end`; `null` for a `null` window, a span under `MIN_ZOOM_SECONDS`, or the full game (B-Z12).
- `panWindow(window, deltaSeconds, end): TimeWindow`: keeps the span, rounds `from + delta`, clamps `from` to `[0, end - span]` (B-Z8).
- `panStepSeconds(window)`: C10's `max(1, round((to - from) / 2))`. Every window `zoomTo` and `clampWindow` produce spans at least `MIN_ZOOM_SECONDS`, so the floor of 1 is reached only by a span under 2 s passed in directly; the function does not reject such a span.
- `panWindow` and `panStepSeconds` take windows that satisfy the `TimeWindow` invariant (as `zoomTo` and `clampWindow` return them); behavior for a span larger than `end` is not specified.
- `timeAtX(x, plot: { left: number; width: number }, shown: TimeWindow): number`: linear map from the plot box to `shown`, clamped to `shown` for an x outside the plot.
- `rowsInWindow(rows: ChartRow[], shown): ChartRow[]`: edge-row behavior is part of the contract, per the owner's answer that the y axis counts the edge rows while zoomed (C10 read literally). The result holds every row with `shown.from <= t <= shown.to`, plus the last row before `from` and the first row after `to` when each exists, so lines reach both plot edges. A row exactly on an edge is inside, and then no extra row is added on that side. A window that falls between two rows returns exactly those two rows; a window wholly before or after every row returns only the one neighbouring row. An empty `rows` array returns an empty array. Rows are in ascending `t` order, as `toChartRows` (`chart-rows.ts`) produces them, and the result keeps that order. The function does not drop values: a later ticket computes the y axis from this result, so a value on an edge row outside the window can stretch the y range by design. This ticket only states the rule; it draws nothing.

`chart-zoom-bar.tsx`: `ChartZoomBar({ title, shown, end, onPan(direction), onReset })` per C12: a `div[data-testid=chart-zoom-bar]` holding, in order, `span[data-testid=chart-zoom-range]` (text from `formatMinSec` in `lib/aoe4-build-order/format-time.ts` of `shown.from` and `shown.to`), `button[data-testid=chart-zoom-pan-earlier]` (accessible name `Show earlier in <title> chart`), `button[data-testid=chart-zoom-pan-later]` (`Show later in <title> chart`), `button[data-testid=chart-zoom-reset]` (visible text `Reset zoom`, accessible name `Reset <title> chart zoom`). The earlier button is disabled at `shown.from = 0` and the later one at `shown.to = end` by `aria-disabled="true"` and never the `disabled` attribute, so focus stays on them. Style with Bootstrap utility classes the sibling components use (`chart-legend.tsx` buttons), with no new CSS file; the selection fill and cursor CSS belong to the drag-select ticket. The `onPan` direction type is a two-value union the hook ticket consumes (earlier and later).

Tests: `chart-zoom.test.ts` (tables per function, `it.each` style as in `chart-legend.test.ts`) and `chart-zoom-bar.test.ts` (`createElement` plus `renderToStaticMarkup`, as in `chart-header.test.ts`). A static render cannot click, so the "a click on a disabled-looking pan button does nothing" rule is checked by the drag-select ticket's acceptance spec; the bar's own test covers markup only.

Existing docs and tests: nothing renders or imports these files yet, so no existing doc or test becomes untrue (searched `docs/`, `components/apps/aoe4-build-order/*.test.ts`).

**Out of scope:** `useChartZoom` and pointer handling; changes to `line-chart.tsx`, `chart-drag.ts`, `results.module.css`; drawing or clipping markers, band, or dots; storing the window; any acceptance spec; docs (the M11 docs ticket covers `ARCHITECTURE.md` and the UI doc).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `zoomTo` returns `null` for a span of 29 s and a window for a span of 30 s with the same start; the order of `a` and `b` does not change the result; inputs outside `[0, end]` are clamped before the span is judged; `[0, end]` returns `null`, including when it comes from clamping.
- [ ] `clampWindow` returns `null` for a `null` input, for a window whose clamped span is under 30 s (a `from` at or past `end` is one case), and for one that clamps to `[0, end]`; a window past `end` with a long enough span has `to` capped at `end` and `from` unchanged.
- [ ] `panWindow` keeps the span exactly, stops at `from = 0` when panning earlier and at `to = end` when panning later (a test fails if the span shrinks at either edge), and rounds a fractional delta to whole seconds.
- [ ] (respec 1) `panStepSeconds` is half the span, rounded the way `Math.round` rounds: an even span gives exactly half, and an odd span gives the rounded half (a test fails if the half is truncated instead of rounded). It is never under 1: a span of 0 or 1 s passed in directly gives 1 (a test fails if the floor is dropped).
- [ ] `timeAtX` maps `plot.left`, the middle, and `plot.left + plot.width` to `shown.from`, its midpoint, and `shown.to`; an x left of the plot or right of it returns `shown.from` or `shown.to` rather than a value outside the window.
- [ ] (respec 1) `rowsInWindow` includes the last row before `from` and the first row after `to`; a window starting exactly on a row's `t` adds no earlier row; a window between two rows returns just those two; a window before all rows returns only the first row; an empty `rows` array returns an empty array; the result stays in ascending `t`. A test fails if either edge row is dropped.
- [ ] `ChartZoomBar` markup: the four test ids appear in the order given; the range text contains `formatMinSec` of `from` and of `to`; the two pan buttons and the reset button carry the accessible names from C12 for a given `title`; the reset button's visible text is `Reset zoom`.
- [ ] `ChartZoomBar` markup at `from = 0` has `aria-disabled="true"` on the earlier button and not on the later one; at `to = end` the reverse; strictly between, neither; in no case does any button carry the `disabled` attribute.
- [ ] The typecheck passes and no existing file changes (the diff holds only the four new files).
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-16

- Underspecified: the `panStepSeconds` criterion claimed a step of 1 for "the smallest spans a window can have", but valid windows span at least 30 s, so the floor is reachable only through a sub-2 s span passed in directly; `rowsInWindow` on empty rows was unstated.
- Changed: Scope gives C10's `panStepSeconds` formula and says where its floor applies, states the input contract for `panWindow`/`panStepSeconds`, and adds the empty-rows rule; the `panStepSeconds` and `rowsInWindow` criteria are rewritten as rules (rounding, floor, empty input).
- No branch work exists yet; nothing to keep or discard.
