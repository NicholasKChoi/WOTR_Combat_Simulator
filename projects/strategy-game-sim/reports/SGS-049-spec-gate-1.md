# SGS-049 spec gate 1

Verdict: READY

Checks (all pass): scope files exist (chart-rows.ts, line-chart.tsx, results.tsx, docs line ~561 chart paragraph, acceptance spec with expectChartsDrawn); new names match design/M3.md Markers table and SGS-035/044/052/048 tickets (format-time import, ChartMarker/CHART_MARKER_KINDS, pinned? added by 048 on its own line); criteria observable; no open questions; S1 named, A1/A3 untouched; risk standard fits (no lib/**); ~70 LOC; diagram waiver valid; no LESSONS entries; docs in scope.

Notes (non-blocking):
- Marker at == durationSeconds sits on the x-domain end (sampleTimes always appends durationSeconds), so recharts default ifOverflow should not discard it; the criterion tests this, but the implementer may set ifOverflow="extendDomain"/"visible" if the browser test shows a drop.
- With a longer pinned run (SGS-048) the x domain widens, still containing all markers.
- Mutation criterion cannot be run before implementation; fine as stated.
