# SGS-201 ticket report

File: projects/strategy-game-sim/tickets/SGS-201-series-legend-aria-pressed.md (lint clean).

Summary: Bug, aoe4-build-order, Milestone none, Priority low, Risk low, about 1 line of logic, no dependencies. Cause: `SeriesLegend` in `chart-legend.tsx` sets `aria-pressed={hidden.has(item.key)}`; `MarkerControl` uses `!hidden.has(kind)`. Tests pinned the inverted value, so none failed. No other inverted site (chart-view-toggle, build-input are selected-option semantics).

Scope: flip the expression; update tests that pin the old value (by rule; examples: line-chart.test.ts series-legend test, acceptance pin-compare, chart-layout, chart-views, units-chart-upgrade-dots specs; help-modal spec only compares snapshots, unchanged); add unit coverage for SeriesLegend markup (incl. pinned-only item) and a live acceptance check also asserting dimming; add one doc sentence in docs/aoe4-build-order-ui.md.

Diagrams: none (single component, no control loop). Open questions: none. Overlap with open tickets: none checked beyond SGS-199/200 (help-modal spec only snapshots aria-pressed).
Scratch checkouts: none made. Mutation criteria: none (unit-test criterion is new; not run).
