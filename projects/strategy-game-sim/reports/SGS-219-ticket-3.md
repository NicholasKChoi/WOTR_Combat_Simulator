# SGS-219 re-spec report (ticket 3)

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-219-units-chart-population-cap-mark.md

Both mechanical gaps from spec-gate-2 are folded in, as are the two non-blocking notes. Both gap fixes are the ones the gate stated. I re-searched `acceptance/` for `CHART_IDS`, `chart-units-produced` and `UNITS` as the pattern search.

1. The acceptance-spec rule now covers every spec that reads the Units chart by the literal id, a `UNITS` constant, or `CHART_IDS` or an index into it. The examples are the five the gate named, plus `aoe4-units-chart-upgrade-dots`, `aoe4-chart-zoom` and `aoe4-chart-views`. The ticket gives the search command.
2. Criterion 5 is now the stated rule, tagged respec 1. With the cap reached, `data-label-rows` equals the row count for the marker labels alone. Marker lines, series paths and upgrade dots equal those of the same run without the mark. The mark label is the only extra `text.recharts-label` and is not counted in `data-label-rows`.
3. The overlap stop condition is concrete. Overlap with tier text or an offset line is reported only, and the owner decides. The blocker is the label clipped by the plot or chart body, or drawn on the x-axis line.
4. The unit bullet now states no unit case: the `charts` record is local to `results.tsx`, there is no results test file, and Playwright covers the change.

A `## Re-spec 1 - 2026-11-24` section was appended. `ticket-lint.py --graph --spec` printed no errors or warnings. No branch work exists yet.
