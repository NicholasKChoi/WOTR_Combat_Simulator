# SGS-195 implementer report 1

- Branch sgs-195-marker-control, tip b0c4d3517996ba588b9f4e62fe203862d4fdb2f9, checkout /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-195-marker-control
- Status: needs_review

Resumed from an interrupted run: the uncommitted work was reviewed against the ticket and kept. I added the docs edit, removed a stray leading blank line in chart-rows.ts, ran the checks and committed.

## Files
- components/apps/aoe4-build-order/chart-markers.ts (new): moved marker constants and helpers; new MarkerView, visibleMarkers, labelKindOf; liveMarkerKind without `collapsed`.
- chart-markers.test.ts (new): moved cases plus visibleMarkers, labelKindOf, liveMarkerKind rows.
- chart-legend.tsx: MarkerLegend replaced by MarkerControl (h3, aria-pressed, 50% opacity when hidden, onToggle).
- chart-legend.test.ts: MarkerControl markup cases.
- chart-rows.ts / chart-rows.test.ts: marker exports removed; generic toggleHidden plus a ChartMarkerKind row.
- line-chart.tsx / line-chart.test.ts: markerView prop, per-chart marker state and legend removed, pinned age-ups follow the age-up toggle; hidden-age-up pinned-legend cases.
- results.tsx: holds hidden/hover/focus kinds, renders MarkerControl between chart-order-status and chart-table, passes a shared markerView.
- acceptance/aoe4-marker-labels.spec.ts rewritten for the single control; aoe4-chart-readability.spec.ts and aoe4-chart-layout.spec.ts import changes only.
- docs/aoe4-build-order-ui.md: the marker legend, click, collapse and pinned-legend order statements rewritten.

## Checks
- tsc --noEmit and lint:dup: clean. next build: ok.
- Unit: full suite 2696 passed, 15 skipped; app dir 874 passed.
- Acceptance specs were rewritten and type-check, but NOT run (acceptance-test gate owns them).

## Mutation checks
Three breaks, all undone:
- chart-markers.ts visibleMarkers filter replaced with a pass-through: visibleMarkers and labelKindOf rows failed.
- chart-legend.tsx aria-pressed inverted: the "is pressed and full opacity while shown..." test failed.
- line-chart.tsx ageUpHidden ignoring "current run has an age-up marker": "age-up hidden with no current age-up marker" failed.

## Doc claims
All in docs/aoe4-build-order-ui.md, matching MarkerControl and results.tsx: one control above the charts, click/Enter/Space toggles, `aria-pressed` "false" when hidden, hidden kinds not stored, pinned age-ups hidden with age-up unless the current run has none, pinned legend after the series legend, collapse hides the series legend and the plot.

## Pre-existing tests edited
Marker tests moved from chart-rows.test.ts and line-chart.test.ts into chart-markers.test.ts, as the ticket directs; the liveMarkerKind rows lost `collapsed`.

## Notes
- Invariants: no engine or data code touched.
- No unverified assumptions added.
- Out-of-scope findings: none.
