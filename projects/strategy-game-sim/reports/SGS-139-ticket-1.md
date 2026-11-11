# SGS-139 ticket report

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-139-marker-legend-hover-focus-labels.md

Summary: "Marker legend items label that kind's markers on hover or focus". Component aoe4-build-order, Task, Risk standard, about 90 business-logic lines, Depends on SGS-138 (SGS-135 transitively). Covers M9.7 (design C8): `labelledMarkers`, `hoverKind`/`focusKind` state in `SeriesChart`, `MarkerLegend` buttons with `data-active`, the draw-every-marker-once rule (age-ups become plain lines with a title when another kind is active), state reset on collapse, pinned markers unchanged, docs fixes in `docs/aoe4-build-order.md`, new `acceptance/aoe4-marker-labels.spec.ts`, and the `line-chart.test.ts` and `aoe4-chart-readability.spec.ts` updates. Lint passes.

Diagrams: none (single component, no core loop).

Open questions:
- designer: an active kind whose markers all disappear (new run or edit while hovered or focused) leaves `active` stuck, so no labels show; should it fall back to null? No criterion covers this until answered.

Notes:
- The static-markup Vitest layer cannot fire events or probably render recharts content (design plan question 1, unresolved); hover, focus, collapse-reset and drawing cases are therefore Playwright criteria, with a pure-function extraction offered for a Vitest check of the drawing split.
- Plan design question 7 is applied as the design's behavior rules state (all unlabelled markers draw as plain lines; pinned markers stay age-up only).
- Overlap: serial on `line-chart.tsx` and `chart-legend.tsx` after SGS-138; no work a later ticket throws away. The final docs ticket (N) should find this ticket's doc edits already in place.
- Unverified: I did not run the criteria against code (no command-based criteria needing a mutation check).
