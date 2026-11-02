# SGS-052 ticket report 1

File: tickets/SGS-052-aoe4-chart-yaxis-overlap.md
Title: Stop the chart Y-axis label overlapping 4-digit ticks. Type Bug, component aoe4-build-order, milestone M3 / M3.8, risk low, no dependencies, On merge none, ~10 LOC in line-chart.tsx plus a Playwright bounding-box test in acceptance/aoe4-build-order.spec.ts.
Grounding: line-chart.tsx:23 (`position: 'insideLeft'`), validate.ts:20 (duration max 3600), results.tsx yLabels, design/M3.md Y-axis rule. No existing viewport tests in the spec.
Criteria: bounding-box non-overlap on all three charts at 1280 px; test must fail on main's file (implementer reverts in a throwaway worktree); label still present; existing tests pass; diff limited to YAxis/LineChart props so N (SGS-048) and O (SGS-049) rebase cleanly.
Diagrams: none required. Docs: no doc mentions the label placement (grep clean); re-grep at implementation.
Not run: the mutation criterion (the test does not exist yet) and I did not reproduce the overlap in a browser; the 4-digit floating paste (`start -> sheep`, no steps, 3600 s) is a suggestion the implementer must confirm.
Open questions: none. Overlap: none with existing tickets; same-file neighbors SGS-048/049 (ordered after this one).
