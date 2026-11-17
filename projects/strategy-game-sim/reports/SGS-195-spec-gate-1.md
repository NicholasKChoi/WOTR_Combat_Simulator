# SGS-195 spec-gate report 1

Ticket: `tickets/SGS-195-one-marker-control-for-every-chart.md` (depends on SGS-194). Read at `origin/main` (87f0cd7) plus the SGS-194 ticket text for its end state. No scratch checkout was made; all reads were `git show` / `git grep` on `origin/main`.

## Verdict: READY

## Gaps

None.

## What I checked

- Grounded scope. Every moved name exists where the ticket says: `MARKER_COLORS`, `MARKER_KIND_LABELS`, `markerLabel` in `chart-rows.ts`; `placeMarkers`, `PlacedMarker`, `ageUpMarkers`, `labelledMarkers`, `activeMarkerKind`, `liveMarkerKind`, `estimateLabelWidth`, `hasKind`, `LABEL_CHAR_PX` in `line-chart.tsx`. `MarkerLegend`, `pinnedLegendShown`, `toggleHidden` and `.markerButton` exist as described. Quoted comment about the unmounted item firing no mouseleave or blur is on today's `liveMarkerKind`. `chart-order-status` and `results-last-good` exist in `results.tsx`.
- Contracts. Names and shapes match design M11 C8, C9, C13 (`markerView`) and C16b, and B-M1 to B-M10. The SGS-194 end state (tbody, `chart-body-row`, `chart-table` after `chart-order-status`) matches what the ticket assumes. The `h3 h6` heading and the new accessible name `<label> markers` are in C9.
- Importers and tests. A whole-repo `git grep` for the moved names, `chart-marker-legend`, `MarkerLegend` and `toggleHidden` finds only: `chart-legend.tsx`, `chart-rows.ts`, `chart-rows.test.ts`, `line-chart.tsx`, `line-chart.test.ts`, `acceptance/aoe4-marker-labels.spec.ts`, `acceptance/aoe4-chart-readability.spec.ts`. All are in Scope. `aoe4-build-order-pin-compare.spec.ts` line 99 matches `^chart-(series|marker)-legend$` on the pinned legend's previous sibling, which is still the series legend, so "pass unchanged" holds. `aoe4-split-tab-order.spec.ts` walks Tab stops with `expectInOrder` and a 150-press cap. The extra marker items add stops but break no assertion.
- Docs. `docs/aoe4-build-order-ui.md` lines 132 to 140 and 149 are the untrue statements; the ticket lists each. No README, ARCHITECTURE or other md mentions the marker legend or these modules (ARCHITECTURE is rightly left to the docs ticket).
- Criteria are behavior-stated, with unit rows for `labelKindOf`, `liveMarkerKind`, `visibleMarkers`, `pinnedLegendShown` and `toggleHidden`. No pinned counts or hand-computed values. Moved test cases are described by rule, not a list.
- Open questions: none. Invariants: A1 to A3 not touched. Risk `standard` is right (no `criticalPaths` or `strongModelTriggers` item; about 150 lines). On merge `none` is correct. Input validation does not apply. Overlap: SGS-196, 197 and 198 also edit `line-chart.tsx` but add different parts; the ticket's order in the plan (marker control first) avoids throwaway work.

## Notes (non-blocking)

- The marker control's `aria-pressed` is `"true"` while the kind is SHOWN. `SeriesLegend` today uses `aria-pressed={hidden.has(key)}` (true while HIDDEN). The ticket and design both state the marker semantics explicitly, so this is not a gap, but the two controls on one page have opposite pressed meaning. The owner may want to align them later.
- Criterion "Tab from the info toggle reaches the first item" needs a run with info messages; the Knight/Longbow template should have them, and the spec should assert the info toggle exists first.
- `aoe4-chart-layout.spec.ts` is listed as "pass with no changed assertion". It has no marker references, but removing the in-chart marker legend changes chart body height; if any case pins an absolute height, the implementer will find it when running it.
