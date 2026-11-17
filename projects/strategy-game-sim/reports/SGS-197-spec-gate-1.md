# SGS-197 spec gate 1

Verdict: NEEDS_SPEC

Read at origin/main (87f0cd7). SGS-194/195/196 are not integrated, so their end state was read from the tickets.
Existing pieces confirmed: `line-chart.tsx` (`SeriesChart`, `placeMarkers`, layout constants), `use-chart-drag.ts` (private
`DRAG_THRESHOLD_PX = 4`, session/finish/Escape pattern), `chart-drag.ts`, `chart-header.tsx` (`chart-collapse`
caret exists only with `layout`), `acceptance/helpers.ts` `plotPoint` (uses `.recharts-cartesian-grid` rect),
recharts 3.10.1. `.dimmed` is `opacity: 0.5` only, so B-Z15 is not blocked by pointer-events. The ticket's
checks 1, 3 to 5, 7 to 12, 14 and 15 pass. No scratch checkout was made.

## Gaps

1. **Scope (`useChartZoom(end, plot)`) - circular input - the implementer must guess the plot-box source.**
   `plot` is a hook argument, but its `top` and `height` come from the label rows (`CHART_MARGIN_PX + rows *
   LABEL_LINE_HEIGHT`), and `rows` comes from `placeMarkers` over the window, which is `shown`, which the hook
   returns. The ticket says "from the chart width and the layout constants" or "from the grid's rect" is the
   implementer's choice, but only the grid-rect read breaks the cycle, and a rect read at pointer down is not
   a render-time argument. Fix: state that `PlotBox` is read at pointer down (the hook takes a getter or a
   ref, `useChartZoom(end, getPlot)`), or that only `left` and `width` (independent of label rows) come from
   the chart width and `top`/`height` from the grid rect at pointer down. Align with C11 in the design if the
   signature changes.

2. **Scope / criterion "A drag of any kind leaves no listener behind" - collapse mid-drag and unmount mid-drag.**
   The hook state lives in `SeriesChart`, but the plot (listener target and pointer-capture holder) is
   unmounted when the chart collapses. A listener on a removed element gets no `lostpointercapture`, so the
   document Escape listener and the session guard stay and a "following drag" can be blocked. Space on the
   caret while the button is held can do this. Fix: Scope says the session ends (and the selection clears)
   when the plot unmounts, collapse included, and the criterion adds a collapse-mid-drag case. The "chart
   unmounts mid-drag" case is not reachable from the page in an acceptance spec; say it is a unit test of the
   hook's cleanup or drop it and keep the collapse case.

3. **Criterion Survives (B-Z12) - what a capped window stores is undefined.** Only a `null` `clampWindow`
   result is said to clear state. When the end shrinks so that `to` is capped but the span stays at least
   30 s, does the stored window become the capped one (so it stays capped when the end grows) or stay as
   stored (so `to` returns)? The ticket pins the `null` case only. Fix: state the rule (suggested: the clamped
   window replaces the stored one, consistent with "the old window does not return" for null) and add a spec
   case. Also say the shorten/lengthen case runs without a pinned run, since `end` includes `pinned.times`.

## Notes (non-blocking)

- Wrapping `ResponsiveContainer` in `div[chart-plot]` changes unzoomed DOM, so "Unit tests ... gain no zoom
  markup" is not literally true. Existing tests I grepped (`line-chart.test.ts`, specs reading `chart-body`)
  do not assert chart-body children, so none is expected to break. Reword to "every existing assertion keeps its value".
- The `DRAG_THRESHOLD_PX defined once` criterion is a search over code. Replace with: the existing reorder case in
  `aoe4-chart-layout.spec.ts` still starts a drag after 4 px, plus the typecheck.
- Specify whether `pinnedLegendShown` counts the pinned age-ups inside the window or all of them while zoomed,
  and the rule for a one-point step band (`from === to`, a `ReferenceLine`) at a window edge. Both are edge
  behavior, so a stated default is enough.
- "Inside" is `from <= at <= to` (matches `rowsInWindow`); say so for markers.
