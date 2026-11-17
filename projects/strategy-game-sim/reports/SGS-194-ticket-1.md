# SGS-194 ticket report

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-194-results-charts-one-table.md

Summary: "Render the Results charts as one table", Feature, M11, aoe4-build-order, about 120 lines, Depends on none,
Risk standard, On merge none. Covers M11.4 (B-T1..B-T6): `ChartHeaderRow` (C14), the chart `table` with `colgroup`
(C15), the tbody shape of `SeriesChart` (C13), table CSS, and the test updates the change forces.

Findings beyond the outline:
- `acceptance/aoe4-chart-layout.spec.ts` `readLayout` and `sectionBoxes` select `results-last-good > [data-collapsed]`
  (direct children); the design says that spec "keeps every case via chart ids", but these two helpers break and
  are in Scope.
- A `data-dragging` opacity on both tbody and rows would compound to 36%; the criterion requires 60% once, measured on the rendered rows.
- `docs/aoe4-build-order-ui.md` chart-controls prose stays true, so no doc edit here (the docs ticket adds the table).

Diagrams: none (single-component, no control loop). Open questions: none. Overlap: none found with SGS-189/191/196;
this ticket edits `line-chart.tsx` before G, I2 and H (as the plan orders). Lint: ticket-lint passed. No scratch checkout made.
