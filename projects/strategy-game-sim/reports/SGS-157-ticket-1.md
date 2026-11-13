# SGS-157 ticket report

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-157-aoe4-buildings-chart-overlapping-lines.md
Lint: ticket-lint.py printed no errors.

Summary: "Keep each building identifiable in the AoE4 Buildings chart". Bug, aoe4-build-order, medium, Risk standard, about 70 LOC, no dependencies, On merge none. Root cause: `SeriesChart` (`line-chart.tsx`) plots every series at its exact integer count, and `buildingSeries` (`result-series.ts`) yields integer counts, so equal counts coincide. Fix: in the Buildings view of the Units produced chart only, draw each visible building at a small, distinct, symmetric vertical offset (total spread under one building). Offsets come from a pure function in `chart-rows.ts`. Hidden series take no slot, a pinned line shares its current line's offset, the tooltip shows true counts, and the y axis keeps whole ticks. One opt-in prop on `SeriesChart`, passed from `results.tsx`, plus a doc sentence in `docs/aoe4-build-order.md`. Dashes were rejected because dashed already means pinned. Existing units-view dash assertions in acceptance are unaffected.

Diagrams: none (single-component).
Open questions: none.
Overlap: none found with open tickets (not exhaustively checked against the TASK-GRAPH).
Unverified assumptions listed: recharts 3.10.1 Tooltip formatter gets the row payload; Line can draw a display value distinct from the raw count.
Not run: no mutation or search criteria, so none to execute. The Units view has the same equal-count shape but was left out of scope.
