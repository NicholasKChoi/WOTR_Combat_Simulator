# SGS-049 tech-lead 1

## Decision
No blockers. Opened draft PR.

- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/54 - base `main`, head `sgs-049-aoe4-chart-markers-ui` @ 8484e878306fd00a407381dbcb064171e4364646 (draft)

### Merge risk
**low** - page-only rendering; touches no API, schema, config or critical-path symbol, a revert fully undoes it, and unit and browser tests pin the marker count, attributes, stroke, legend order and label non-overlap.

### Review focus
No hotspots: display-only change on one page; the worst miss is an overlapping or clipped label. Browser tests check label overlap at 1280 px and 768 px, and the simulation and its response are untouched.

## What I reviewed
- Range: merge-base(origin/main, 8484e87)..8484e87, 4 commits (43b8a0b, 14a4d62, ccbba95, 8484e87), authored choinickolas@gmail.com, no ticket ids or PR numbers in messages.
- Files: line-chart.tsx (+86/-5), chart-rows.ts (+21), results.tsx (+3), compare.ts (+1/-3); tests chart-rows.test.ts, line-chart.test.ts, acceptance/aoe4-build-order.spec.ts; docs/aoe4-build-order.md.
- Reviewable LoC +111/-8 (unit tests, Playwright spec and docs excluded); total +346/-14.
- Trial merge with origin/main 2665e94 clean (git merge-tree). Pushed the tip unchanged, no new commits.
- Invariants: S1 holds (imports only from lib/aoe4-build-order/model and format-time). A1/A2/A3 untouched: no lib/** edit. No criticalPaths symbol touched. CONTEXT open questions: none. No security, concurrency, irreversibility or contract change (SeriesChartProps.markers is optional, default []).

## Non-blocking notes
- line-chart.tsx placeMarkers estimates label width at 7 px per character and assumes the x domain starts at 0 (`end` only). That holds today (times start at 0); a non-zero domain start would shift row placement only, cosmetic.
- Markers render only after ResponsiveContainer's onResize reports a width, so server render has no marker lines (legend still renders). Intended per the ticket.
- `git push -u` with a SHA source does not set local upstream tracking; irrelevant for the factory.
