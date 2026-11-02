# SGS-049 ticket report 1

File: tickets/SGS-049-aoe4-chart-markers-ui.md (milestone M3, outline O, branch sgs-049-aoe4-chart-markers-ui).

Summary: Draw age-up and research markers on the three AoE4 charts. Component aoe4-build-order, ~70 business LOC.
Depends on SGS-044 (marker data), SGS-052 (Y-axis fix), SGS-048 (pin/compare; not on disk when written, so the
design's toChartRows(times, series, pinned?) and SeriesChartProps.pinned? contract was relied on; this ticket never
edits toChartRows or pinned). Scope: chart-rows.ts (MARKER_COLORS, MARKER_KIND_LABELS, markerLabel), line-chart.tsx
(markers prop, one dashed ReferenceLine per marker with data-testid chart-marker and data-kind/label/at, stacked
same-time labels, separate HTML marker legend), results.tsx (3 props), unit + server-render + Playwright tests, doc
paragraph in docs/aoe4-build-order.md.

Risk: standard (plan said medium; template has no medium). Not high: no lib/** edit, no API change. On merge: none.
Diagrams: none required. Open questions: none.

Checks run: contrast of the five colors computed (min 3.23 vs #212529, 3.25 vs #fff, all >= 3). recharts 3.10.1
ReferenceLine forwards data-* props to the line (read source). git grep of ReferenceLine/marker in components, pages/apps and
docs is empty today, as the criteria state; `SeriesChart` appears 4 times in results.tsx (import + 3). Mutation
criteria target code the ticket adds, so they could not be run now (stated in the ticket).

Overlap: SGS-048 and SGS-052 edit line-chart.tsx; SGS-048 also chart-rows.ts and results.tsx; SGS-044 adds a markers
bullet to the same docs result-field list (this ticket adds only the chart paragraph). SGS-054 audits docs.
Playwright paste is left to the implementer to confirm yields markers (including two close in time).
