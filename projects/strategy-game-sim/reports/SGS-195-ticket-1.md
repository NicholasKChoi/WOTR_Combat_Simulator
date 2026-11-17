# SGS-195 ticket report 1

Ticket: `$PROJECT_DIR/tickets/SGS-195-one-marker-control-for-every-chart.md` (Feature, aoe4-build-order, M11, risk standard, depends on SGS-194, On merge none). `ticket-lint.py` printed no errors.

Summary: Moves every marker rule into new `chart-markers.ts` (C8) and replaces the per-chart `MarkerLegend` with one `MarkerControl` (C9). The control sits between `chart-order-status` and `chart-table`, and `results.tsx` holds `hidden`, hover and focus state. `SeriesChart` takes a `markerView` prop and no longer owns that state. `toggleHidden` becomes generic (C16b). Pinned age-up lines follow the age-up toggle (B-M7). About 150 lines of business logic. Criteria cover B-M1 to B-M10, the `labelKindOf`, `liveMarkerKind` and `pinnedLegendShown` cases, and the rewrite of `aoe4-marker-labels.spec.ts`. The marker-legend sentences in `docs/aoe4-build-order-ui.md` that become untrue are in Scope. The ticket was written against SGS-194's end state (tbody root, `chart-header-row`, `chart-body-row`, `chart-table`).

Diagrams: none (single-component, no control loop).

Open questions: none.

Findings:
- Overlap with K: K's docs scope also touches `docs/aoe4-build-order-ui.md` and adds `chart-markers.ts` to `ARCHITECTURE.md`. SGS-195 fixes only the marker-legend statements that its change makes untrue, and leaves `ARCHITECTURE.md` and the rest of the page description to K.
- Overlap with I2 and H: all three edit `line-chart.tsx`, so they stay serialized as the plan says.
- Tests found by search: `line-chart.test.ts`, `chart-rows.test.ts`, `acceptance/aoe4-marker-labels.spec.ts` and `acceptance/aoe4-chart-readability.spec.ts` (imports). `aoe4-build-order-step-band` and `aoe4-build-order-pin-compare` read `chart-marker` and `chart-pinned-marker` and are unchanged.
- Checkouts: no scratch checkout made; all reads used `git show origin/main:<path>` at 87f0cd7 plus the SGS-194 ticket text.
