# Tech-lead gate: SGS-138

Decision: PASS. No blockers, no untested hotspots. Draft PR opened.

PR: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/149 (base main, head sgs-138-pinned-runs-no-tooltip-one-legend-entry, tip 7556a2c)

## Merge risk
**low** - UI-only change in chart and legend components; a revert fully undoes it, no public API, schema, config or critical-path symbol is touched, and unit and Playwright tests pin the new behavior.

## Review focus
No hotspots: the tooltip exclusion is one prop (`tooltipType="none"`) pinned by a Playwright hover case that asserts no `(pinned)` item name and that the pinned lines still exist, and `pinnedLegendShown` is pinned by a table test covering hidden series and age-up count.

## Reviewed
Commit 7556a2c over origin/main 94a439d: 8 files, +181/-87. Business logic: chart-legend.tsx +17/-26, line-chart.tsx +4/-2. Invariants: none apply (UI only). Removed-id grep outside tests, acceptance and .claude is empty at the tip.

## Notes
- The branch was not on origin; it was pushed (tip unchanged). The push printed a config-lock error on writing upstream tracking (`.git/config` lock); the ref is on origin, tracking is not set.
- `gh pr edit --body-file` failed (Projects classic GraphQL deprecation); the body was set through `gh api PATCH`.
- Single-PR stack footer uses stackMarker `cf-stack`.
- Non-blocking: the Vercel preview was not checked here.
