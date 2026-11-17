# Tech-lead gate: batch SGS-194-SGS-194

## Decision

PASS. No blockers and no untested hotspots. Opened one draft PR.

## PRs (bottom to top)

- SGS-194: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/200 - base `main` - `new` - head `4dc3bd8a899aede40b41fd95e543b560895260fe` (draft)

### Merge risk
**low** - markup and CSS of the Results charts only: no API, schema, config or critical-path engine code, stored layout format untouched, a revert fully undoes it, and acceptance specs pin alignment, collapse, reorder and opacity.

### Review focus
- [`components/apps/aoe4-build-order/line-chart.tsx:127-136`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/200/files#diff-17b99f04400281566be4134563c956ce7effa88f0fa5028946f698b678c2c167R127-R136) - the measuring `<svg>` now sits in the body row, which is `display: none` while collapsed, so any measurement taken then returns 0 and marker labels overflow the plot's right edge after expanding - check the effect skips while collapsed and re-runs when `collapsed` flips back - pinned by [`acceptance/aoe4-chart-layout.spec.ts`: a chart whose markers change while collapsed places its labels like an always-expanded chart once expanded](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/200/files#diff-c96481d83a1a29b026f5b17e13955617f2921ec9d039aa12a70cadcd1c9b4d0aR487-R510)

## What I reviewed

- Range `87f0cd7db397363420d50d6c7af663cac4c8e61f...4dc3bd8a899aede40b41fd95e543b560895260fe` (3 commits: 819d789, 141a253, 4dc3bd8).
- Files: `components/apps/aoe4-build-order/{line-chart.tsx, chart-header.tsx, results.tsx, results.module.css, chart-header.module.css}`, plus unit tests `chart-header.test.ts`, `line-chart.test.ts` and acceptance specs `aoe4-chart-layout.spec.ts`, `aoe4-results-split.spec.ts`.
- LoC: +402/-202 total; reviewable (excluding tests) +224/-185, most of `line-chart.tsx` being re-indentation.
- Checked against INVARIANTS (A1-A3 untouched: no engine, data or API change; S1 holds, no cross-app import), PROJECT.md Open questions (none), criticalPaths (none touched). `SeriesChart` and `ChartHeaderRow` have a single consumer each (`results.tsx`, `line-chart.tsx`), so the `tbody` root cannot land outside a table. Chart layout storage (`chart-layout.ts`, `use-chart-layout.ts`) is unchanged.
- Hotspot pin verified: the acceptance case at `acceptance/aoe4-chart-layout.spec.ts:487-510` asserts the re-expanded chart's label anchor and right-edge fit match the always-expanded chart's, which fails if measurement runs while collapsed.
- Stack check: single member on `main`, diff contains only its own task. No existing PR for the branch before creation. Push was a fast-forward new branch; no force.

## Non-blocking notes

- The 60% opacity acceptance case (`aoe4-chart-layout.spec.ts:419-433`) asserts computed opacity (tbody 0.6, rows 1), which proves it is applied once but not that Chromium paints opacity on a table section; review's UI inspection covered the visual.
- The PR body's stack footer lists only #200: SGS-195 depends on SGS-194 but has no PR yet.
