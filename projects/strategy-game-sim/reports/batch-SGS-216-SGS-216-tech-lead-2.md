# Tech-lead gate, SGS-216 (batch SGS-216-SGS-216)

Decision: no blockers, no untested hotspots. Stacked draft opened.

## PR
- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/225 , base main, new, head 29973d953fadc13837bbe89f906160c75852d017

### Merge risk
**low** - UI-only change with no criticalPaths symbol and no API, schema or config change; a stored chart layout without the new id is normalized by appending it, and a revert restores the four-chart page.

### Review focus
- line-chart.tsx:278-295 - label side uses an estimated width; wrong estimate overlaps the x axis or passes the grid edge - pinned by acceptance/aoe4-population-cap-mark.spec.ts (label stays inside the grid right edge and above the x axis line, 1200/1280/1800)
- chart-markers.ts:49-51 - zoom origin ignored or strict boundary flips the label side - pinned by chart-markers.test.ts "places the label for %s"
- line-chart.tsx:72-73 - window check dropped or strict draws or hides the mark wrongly - pinned by line-chart.test.ts "a mark %s is drawn"

## Reviewed
Commits 7d74800..29973d9 (4 commits), 21 files, +340/-70; reviewable code +70/-7 (excluding tests, acceptance, docs). Single-member stack, no base-only branch; stack check trivially holds.

## Notes (non-blocking)
- populationCapMark compares `=== null`; the engine on main types the field as number | null, so no producer of undefined.
- No ticket names a GitHub issue; no Fixes/Refs line.
- Label width is estimated (8 px per char), documented in the UI doc.
