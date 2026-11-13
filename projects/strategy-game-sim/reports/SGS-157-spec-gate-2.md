# SGS-157 spec gate 2

Verdict: READY

Read at origin/main (`git fetch origin` printed a `gc` failure but the refs were present; main tip e50e074). Read `chart-rows.ts`, `line-chart.tsx`, `results.tsx`, `docs/aoe4-build-order.md`, the four AoE4 chart acceptance specs, `chart-rows.test.ts`, and `model.ts` (`counts: number[]`). Confirmed recharts is 3.10.1 in package.json and node_modules.

## Spec-gate-1 gaps

1. Count 0 and the y-axis floor: closed. Offsets are non-negative and below half a building, the default domain stays, and a criterion covers a count-0 row value.
2. No testable seam for tooltip and ticks: closed. The true-count lookup is a pure export with a unit criterion, and one acceptance criterion in `acceptance/aoe4-chart-views.spec.ts` covers tick labels and tooltip values.
3. Row data with and without the opt-in: closed. The row-building criterion covers both.
4. Invariants field: closed. It now names A1, A2 and A3.

The notes from gate 1 are also folded in: slot order is stated and the shrinking spacing is accepted explicitly.

## Checks

- Grounded: `SeriesChart`, `toChartRows`, `formatChartValue`, `chart-units-produced`, the `unitsProducedView === 'buildings'` branch in `results.tsx`, and the doc paragraph after the chart table all exist. `SeriesChart` owns the `hidden` state, so the rows are built there as Scope says.
- Existing tests: the `chart-views` Buildings test checks legend names and a `path[data-series]` count only. The `d` comparisons in `chart-views` use the Gather rates chart. The pin-compare units dash checks use the Units view. `chart-rows.test.ts` covers only `toChartRows` without the opt-in. None depends on the Buildings drawn values. Scope's existing-tests rule covers the rest.
- Docs: the doc line that says tooltip values are rounded to one decimal stays true. The paragraph addition is in Scope.
- Risk standard, On merge none, Depends on none, size about 80 lines, and no overlap with another open ticket (TASK-GRAPH shows none touching these files). No diagram trigger. Validation does not apply (no trust-boundary input).
- Unverified assumptions cover the tooltip payload, the drawn value versus `data-series`, and the whole-number ticks. That is adequate.

## Notes (non-blocking)

- Row building must pass a missing value (`undefined`, a time the pinned or current run lacks) through unchanged. Adding the offset to `undefined` gives `NaN`, which could change how the pinned line (`connectNulls={false}`) breaks. Add a unit row for it if convenient.
- The true-count lookup reads a row whose drawn value is `count + offset`. Because counts are integers and offsets are below 0.5, flooring recovers the count. A separate stored true value would also satisfy the criterion. Either is fine, and the implementer picks one.
