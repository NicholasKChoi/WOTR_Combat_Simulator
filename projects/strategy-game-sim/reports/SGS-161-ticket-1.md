# SGS-161 ticket report

File: $PROJECT_DIR/tickets/SGS-161-aoe4-chart-axis-corner-label-overlap.md (lint clean)

Bug, aoe4-build-order, low priority, low risk, ~15 LOC, no dependencies. Cause: `SeriesChart` in `components/apps/aoe4-build-order/line-chart.tsx` uses default tick offsets on `XAxis` and `YAxis`, so the first x tick (`0:00`, centred on the plot's left edge) and the first y tick (`0`) overlap at the corner. The only `XAxis` site is `line-chart.tsx`, so no other chart shares the defect. The existing overlap test (pin-compare spec) compares only the y title against ticks, which is why it was missed. The cause comes from review inspection and is not reproduced; the ticket tells the implementer to confirm it in the browser. Criteria: pairwise tick-box disjointness at 360, 768 and 1280 px for every `CHART_IDS` chart (both offset-lines and default y axes), failing at the base; no clipping or overflow; marker labels unaffected; existing tests keep their assertions.

Diagrams: none. Open questions: none. Overlap with other tickets: none found. No scratch checkout was made.
