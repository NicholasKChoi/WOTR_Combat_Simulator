# Tech-lead gate: batch SGS-137, SGS-139

## Decision
PASS. No blockers and no untested hotspots. Both branches are pushed and the stacked draft PRs are open.

## Opened PRs (bottom to top)

### SGS-137: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/150 (base `main`, head `sgs-137-chart-view-toggles` @ 6de222d)

## Merge risk
**low** - UI-only change, a revert fully undoes it; no API, schema, config or critical engine path is touched and tests pin the series selection and the pinned-line behavior.

## Review focus
No hotspots: the per-view series choice is a pure function (`gatherRatesSeries`, `unitsProducedSeries`) pinned by Vitest cases that fail if Villagers plots rates, Buildings plots units, or a pinned run reads the current run; Playwright pins the drawn pinned lines in both views.

### SGS-139: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/151 (base `sgs-137-chart-view-toggles`, head `sgs-139-marker-legend-hover-focus-labels` @ 1538718)

## Merge risk
**low** - UI-only change, a revert fully undoes it; no API, schema, config or critical engine path is touched and tests pin the labelling, drawing and reset rules.

## Review focus
- [`components/apps/aoe4-build-order/line-chart.tsx:104-111`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/151/files#diff-17b99f04400281566be4134563c956ce7effa88f0fa5028946f698b678c2c167R104-R111) - the hover and focus kinds are reset by setting state during render; if the reset misses a case, collapsing a chart mid-hover brings back the hovered kind's labels on expand, and if it ever disagreed with its own result it would loop re-rendering - check the reset only fires when the slot differs from `liveMarkerKind` and that `active` is computed from the live values - pinned by [`components/apps/aoe4-build-order/line-chart.test.ts`: liveMarkerKind table](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/151/files#diff-129e2bfd30e4154dd486cf4fab0b63b3a8a366338ea4d44aa501c9c4e31e0fa1R251-R258) and [`acceptance/aoe4-marker-labels.spec.ts`: collapsing a chart while an item is hovered clears the hover](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/151/files#diff-7e56d6dd6d27f420bf42a88b523f43c6dcf4eaffcb7eb400183f0d0bcb7c592dR139-R150)

PR 151 also has a Preview checks section with three items, one for each unverified assumption in the SGS-139 ticket: labels re-render when a kind switches, label widths are measured for every kind, and the hover is cleared when the chart collapses. PR 150 has none, because the ticket lists `Unverified assumptions: none`.

## What was reviewed
- Combined range `origin/main` 4f369f3 to `sgs-139-marker-legend-hover-focus-labels` 1538718. That is 5 commits: 2 for SGS-137 and 3 for SGS-139.
- SGS-137 (`origin/main...sgs-137`): 9 files, +425/-222. Hand-written logic is +71/-26: `chart-view-toggle.tsx`, `result-series.ts` and `results.tsx`. Docs, Vitest and the acceptance specs were read too.
- SGS-139 (`sgs-137...sgs-139`): 6 files, +373/-45. Hand-written logic is +92/-37: `line-chart.tsx`, `chart-legend.tsx` and `results.module.css`. Docs, `line-chart.test.ts` and `aoe4-marker-labels.spec.ts` were read too.
- Stack check: each branch's diff against its base contains only its own task. The stack is linear.
- Invariants: the A, S, W and H invariants do not apply, because only the UI, docs and tests under `components/apps/aoe4-build-order/` and `acceptance/` changed. No `criticalPaths` symbol was touched. No open questions in PROJECT.md. No security, concurrency, schema or API surface was touched.
- Correctness spot-checks:
  - `placedByMarker` uses object identity to look up markers. `placeMarkers` returns the input marker objects, so the lookup works.
  - The reset during render (setting state while rendering) is guarded by an inequality check and settles after one pass.
  - Pinned series go through the same per-view function, so they always read the pinned run's own data.

## Non-blocking notes
- Commit 6de222d's message starts with "SGS-137 rework:". That puts a ticket id and process history in a shipped commit message. A squash merge with the PR title as the subject keeps it out of main's subject line, but it stays in the squashed body unless the body is edited at merge time. I added no commits, per the gate rules.
- Units produced's y label changes from `Units` to `Count` in the default view. The ticket asks for this and the docs say so.

## Manager actions
- Record in TASK-GRAPH:
  - SGS-137: PR 150, tip 6de222d.
  - SGS-139: PR 151, tip 1538718.
- `git push -u` was not used. Both branches were pushed with explicit refspecs, so no upstream is configured locally.
