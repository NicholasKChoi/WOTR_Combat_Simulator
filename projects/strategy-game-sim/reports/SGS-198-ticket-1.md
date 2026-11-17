# SGS-198 ticket report 1

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-198-units-chart-unit-lines-and-upgrade-dots.md

Summary: "Draw the Units chart as one line per unit line, with upgrade dots for the current and the pinned run". Feature, aoe4-build-order, M11, risk standard, about 130 business lines (result-series.ts, valueAt in chart-rows.ts, dots in line-chart.tsx, results.tsx). Depends on SGS-191 and SGS-197 (transitively 195, 196, 194). Criteria cover unitLineSeries, unitUpgradeDots, valueAt, B-U1..B-U9 (acceptance on the Knight/Longbow template with API preconditions first, pinned case at a shorter duration), and the existing-test rewrites (pin-compare spec keyed by baseId, unitSeries tests). On merge: none.

Diagrams: none (single-component, one-line sentence).

Open questions: none. Lint passes.

Notes:
- docs/aoe4-build-order-ui.md row "Units produced (Units view)" (`<name> (tier <tier>)`) becomes untrue; the plan assigns that edit to K (SGS-200), so the ticket names it out of scope and says so. It is wrong on main between the two merges.
- Unverified assumption listed: recharts ReferenceDot forwards data-* and a title child (exercised for real by the acceptance spec).
- pin-compare spec: lines 75-79 key by unitId and need rewriting; lines 198-209 read keys from legend items, so they likely still work and are only to be rechecked.
- No overlap with other open tickets found.
- No scratch checkout made (file reads at origin/main only).
