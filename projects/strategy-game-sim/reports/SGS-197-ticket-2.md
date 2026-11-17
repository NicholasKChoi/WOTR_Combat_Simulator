# SGS-197 ticket re-spec 1 (ticket-2)

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-197-drag-select-zoom-pan-reset-on-every-chart.md
Read at origin/main 87f0cd7. SGS-194/195/196 are not integrated; I read their end state from the tickets. ticket-lint: clean. No scratch checkout made. No SGS-197 branch or checkout exists.

## Summary

SGS-197, "Add drag-select zoom, pan and reset to every results chart". Component aoe4-build-order, M11, Risk standard, about 260 LOC (`use-chart-zoom.ts`, `line-chart.tsx` `SeriesChart`, `chart-drag.ts` / `use-chart-drag.ts` threshold move, `results.module.css`). Depends on SGS-195 and SGS-196. Covers B-Z1 to B-Z15 and C11 plus the zoom parts of C13, through a new `acceptance/aoe4-chart-zoom.spec.ts`.

## Gate findings folded in

1. Plot-box cycle (gap 1). Decision: the hook takes a getter, `useChartZoom(end, readPlot: () => PlotBox | null)`, called once at pointer down. The box is the `.recharts-cartesian-grid` rect, which is the option the design's "left to the implementer" list allows. Only `left`/`width` map pointer x, and label rows do not change those. New criterion: mapping at both viewports, and a press in the label rows starts nothing.
2. Collapse or unmount mid-drag (gap 2). Scope: a session ends when the plot element leaves the document, either on collapse or when `SeriesChart` unmounts. That end counts as a cancel: the selection clears, a pan restores the window it had at pointer down, and listeners are removed. The repo has no jsdom or testing-library, so an unmount case would need new dependencies. I dropped it from the criteria. The collapse-mid-drag acceptance case tests the same cleanup path.
3. Capped window (gap 3). Decision: when `end` changes, the stored window is replaced by `clampWindow(window, end)`. A capped result is stored, so the old `to` does not come back. This matches B-Z12 "kept, then re-clamped" and the existing null rule. New spec case: shorten so `to` is capped, then lengthen and check it stays capped. The duration-changing cases run with no pin.
4. Notes:
   - The existing-test rule now reads "every existing assertion keeps its value". The `chart-plot` wrapper is acknowledged.
   - The `DRAG_THRESHOLD_PX` criterion is now the typecheck plus the existing 4px layout cases. I checked their names against base.
   - `pinnedLegendShown` keeps SGS-195's rule, which counts the drawn pinned age-ups, so while zoomed it counts the ones inside the window.
   - Band edges: an area is drawn over its overlap when that overlap has width. A one-point band is drawn when its time is inside, edges included. `data-from`/`data-to` keep the step's times.
   - "Inside" means `from <= t <= to`.

## Diagrams

One state diagram for the per-chart pointer interaction. I added transitions for plot unmount. There is no component diagram (single component).

## Open questions

none. Manager action: design/M11.md C11 still shows `plot: PlotBox | null` as a render-time argument. A designer should align it with the getter form (`readPlot: () => PlotBox | null`, read at pointer down) so later readers don't see a contradiction. The ticket states this deviation and the reason for it.

## Overlap

None new. SGS-198 (unit lines) depends on this ticket and owns `upgradeDots`/`pinnedUpgradeDots`. This ticket excludes them explicitly.
