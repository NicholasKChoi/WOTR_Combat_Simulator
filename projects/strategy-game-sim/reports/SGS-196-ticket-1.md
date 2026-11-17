# SGS-196 ticket report

File: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-196-chart-time-window-math-and-zoom-bar.md`

Summary: "Add the chart time-window math and the zoom bar", Feature, M11, component aoe4-build-order, risk low, about 110 lines (four new files: `chart-zoom.ts`, `chart-zoom.test.ts`, `chart-zoom-bar.tsx`, `chart-zoom-bar.test.ts`), no dependencies, On merge none. Criteria cover `zoomTo` (29 vs 30 s, ordering, clamping, `[0,end]` null), `clampWindow`, `panWindow` (span kept at both edges), `panStepSeconds`, `timeAtX` (outside the plot), `rowsInWindow` edge rows, and `ChartZoomBar` markup (names, order, `aria-disabled` at each edge, never `disabled`). Per Q129, Scope states the `rowsInWindow` edge-row rule explicitly (last row before `from`, first row after `to`, so edge values can stretch the later y axis). The click-does-nothing rule for disabled pan buttons is left to the drag-select ticket's acceptance spec, since a static render cannot click.

Diagrams: none (single-component, outside the control loop).
Open questions: none.
Overlap: none (new files only; no existing doc or test depends on them). Ticket lint passes. No scratch checkout was made.
