# SGS-087 ticket author report

File: projects/strategy-game-sim/tickets/SGS-087-aoe4-chart-readability.md
Branch to name: sgs-087-aoe4-chart-readability. Risk low. Depends on SGS-082. Covers BACKLOG.md lines 63 and 73.

Verified against origin/main cc9bb04 (local main is stale): line-chart.tsx SeriesChart has no Tooltip formatter and labels every marker via placeMarkers; docs/aoe4-build-order.md says labels are stacked in rows.
Dependency on SGS-082: its spec tests assert a text label on each marker, which the default fix removes.
Open questions (owner): marker-crowding approach (default age-up labels only, research lines with hover title); tooltip precision (default 1 decimal).
No diagrams. No commands run beyond greps and file reads; no mutation checks run (no existing check exercises the new behaviour; the new acceptance spec is the pin).
Overlap: none with open tickets; SGS-082 deletes the old marker tests.
