# SGS-137 ticket author report

File: `projects/strategy-game-sim/tickets/SGS-137-chart-view-toggles.md` (ticket-lint passes).

Summary: "Replace the Per villager checkbox with view toggles on Gather rates and Units produced". Component aoe4-build-order, Risk standard, about 120 business-logic lines, Depends on SGS-134, SGS-135, SGS-136. Covers C7: `chart-view-toggle.tsx` (new), `buildingSeries` in `result-series.ts` (and removal of `perVillagerSeries`), view state and chart table in `results.tsx`, pinned-line behavior per view, new `acceptance/aoe4-chart-views.spec.ts` replacing the deleted `aoe4-gather-rates-per-villager.spec.ts`, the checkbox uses in `aoe4-chart-layout.spec.ts` (rewritten by SGS-135), and the `docs/aoe4-build-order.md` statements about the checkbox.

Diagrams: none (single-component, outside the core loop).
Open questions: none.
Overlap: SGS-135 rewrites `aoe4-chart-layout.spec.ts` and the "Chart controls" doc paragraph while keeping the checkbox; SGS-137 then updates the remaining checkbox references in both. No scope overlap, but SGS-137 must land after SGS-135. The ticket does not edit `chart-header.tsx` or `line-chart.tsx`, per design.
Note: the Units produced y label changes from `Units` to `Count` (design C7 table).
