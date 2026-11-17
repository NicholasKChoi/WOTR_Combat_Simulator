# Tech-lead gate: batch SGS-195-SGS-195

## Decision
APPROVE - draft PR opened. No blockers, no untested hotspots.

## PRs (bottom to top)
- SGS-195: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/203 - base `main` - new - head 9bc74f960ab74f7b7a1bbd3d77dbd541dae1ee7c (draft)

### Merge risk
**low** - UI-only state and markup in the AoE4 results page; no API, schema, config or `criticalPaths` symbol touched, a revert fully undoes it, and unit plus acceptance tests pin the new behavior.

### Review focus
- [`components/apps/aoe4-build-order/line-chart.tsx:69-70`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/203/files#diff-17b99f04400281566be4134563c956ce7effa88f0fa5028946f698b678c2c167R69-R70) - pinned age-up lines are hidden only when `age-up` is hidden and the current run has an age-up marker; inverting or dropping the second condition would hide pinned age-ups with no control entry left to bring them back, or leave them drawn when the user hid age-ups - check both conditions and that the pinned legend counts only drawn pinned age-ups - pinned by [`components/apps/aoe4-build-order/line-chart.test.ts`: pinned legend with hidden marker kinds](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/203/files#diff-129e2bfd30e4154dd486cf4fab0b63b3a8a366338ea4d44aa501c9c4e31e0fa1R87-R112)

## What I reviewed
- Range: origin/main 38320d8 ... sgs-195-marker-control 9bc74f9 (3 commits: 518c1c2, 1243f3d, 9bc74f9).
- 14 files, +605/-417 total. Production: chart-markers.ts (new, mostly moved), chart-legend.tsx, chart-rows.ts, line-chart.tsx, results.tsx = +133/-95; docs/aoe4-build-order-ui.md +8/-8; rest unit tests and acceptance specs.
- Invariants: A1-A3 not touched (no engine, data or simulate change); S1-S3 not touched. No criticalPaths symbol touched. No open questions in PROJECT.md. No API/schema/config change; nothing irreversible; no security surface.
- Stack check: single member on main; diff holds only this task. Dependency SGS-194 integrated.
- Hotspot pin: the pinned age-up rule is pinned by the `it.each` table in line-chart.test.ts (`age-up hidden with a current age-up marker` -> false, `... with no current age-up marker` -> true); labelKindOf and liveMarkerKind rows in chart-markers.test.ts; acceptance aoe4-marker-labels.spec.ts covers the cross-chart behaviors.
- No issue line: the ticket Source names no `GitHub issue #<n>`. No Preview checks: Unverified assumptions none.

## Non-blocking notes
- `results.tsx` builds a fresh `markerView` object each render; harmless since `SeriesChart` is not memoized.
- `estimateLabelWidth` is now exported from chart-markers.ts (previously private) because line-chart.tsx still uses it for its fallback; fine.
