# SGS-048 ticket report (ticket-1)

File: projects/strategy-game-sim/tickets/SGS-048-aoe4-pin-compare.md

Summary: "Pin a run and compare key numbers and chart overlays", aoe4-build-order, ~190 business LOC (compare.ts,
compare-panel.tsx, chart-rows.ts, line-chart.tsx, results.tsx, page, docs section). Depends on SGS-043 (spent,
populationCapReachedAt) and SGS-052 (Y-axis fix); transitively SGS-035. Risk standard (plan said medium; over ~100 lines,
no strongModelTrigger, not a criticalPath). On merge: none. No OpenAPI change.

Criteria: key-number extraction, compareRows order and delta, toChartRows union with absent keys, pinned key/name, dashed
overlay and legend toggle, pin lifecycle (survive runs, edits, failed runs; unpin; repeat pin), different durations,
docs Page section, mutation checks, no data.ts in bundle.

Diagrams: none required (single component, client-only; one-line statement).

Owner answers applied: (9) states N before O (SGS-049 depends on this ticket and rebases on its lines); SGS-045/047 also
touch results.tsx and the page, rebase only.

Choices the ticket makes where the design is silent (not open questions): PinnedSeries.series holds the pinned run's ordinary
series and toChartRows/SeriesChart apply pinnedKey and the " (pinned)" name; pin-run and unpin-run are always rendered
and disabled when not usable; ComparePanel sits under the Results heading in the page, Results takes `pinned`.

Checks run: grep counts on origin/main f078c11. `git grep -i "pin-run|pinned run|compare-key" docs` = 0 (matches the
doc criterion's "0 today"). Mutation criteria cannot run yet (compare.ts and its tests do not exist); marked to run at
implementation. Confirmed toChartRows has 3 existing tests and 2 call sites (line-chart.tsx, result-series.test.ts).

Overlap: SGS-049 (same three files, ordered after), SGS-045/047 (results.tsx, page), SGS-052 (line-chart.tsx YAxis, left untouched).
Open questions: none.
