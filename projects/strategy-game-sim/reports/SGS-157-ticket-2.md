# SGS-157 ticket report 2 (re-spec 1)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-157-aoe4-buildings-chart-overlapping-lines.md
Lint: ticket-lint.py printed no errors.

## Summary

SGS-157 "Keep each building identifiable in the AoE4 Buildings chart" (Bug, aoe4-build-order, standalone, standard risk, ~80 LOC, no dependencies). Re-read `line-chart.tsx` (`SeriesChart`), `chart-rows.ts` (`toChartRows`, `formatChartValue`), `results.tsx` and INVARIANTS A1-A3 at origin/main. All four spec-gate-1 gaps are folded in:

1. Count 0 / y floor: offsets are now upward-only (non-negative, distinct per slot, below half a building, constant over time), so a count-0 line stays at or above 0, the default domain lower bound holds, and whole-number ticks with none below 0 are required. New criterion for count 0.
2. Testable seams: a pure exported true-count lookup in `chart-rows.ts` (row + series key -> true count) used by the Buildings `Tooltip` formatter, unit-tested; plus an acceptance criterion in `acceptance/aoe4-chart-views.spec.ts` for integer, non-negative tick labels and whole-number tooltip values on hover.
3. Row building: Scope states rows are built inside `SeriesChart` because `hidden` lives there, via a pure exported row-building function (`toChartRows` or a sibling) taking the opt-in; criterion requires a unit test with the opt-in (equal counts get different drawn values within [count, count + 0.5)) and without (rows equal raw values).
4. Invariants: A1, A2, A3 named as touched (paths) but not affected.

Also: slot order stated (visible current series in order, then visible pinned-only keys in pinned order; hidden take no slot); the shrinking spacing with many buildings is accepted explicitly as a known limit (no minimum spacing, out of scope). Unverified assumptions extended with the `data-series`/legend staying keyed by the series key and `YAxis allowDecimals={false}` behavior. Changed criteria tagged `(respec 1)`; `## Re-spec 1 - 2026-11-13` appended.

Diagrams: none (single-component, no control loop).
Open questions: none.
Overlap: none found; no SGS-157 branch exists, so no branch work is affected.
