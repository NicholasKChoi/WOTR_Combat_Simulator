## Summary
The pinned run's age-up markers are now drawn on all three charts as dashed vertical lines (`6 4`) in the age-up colour, with no text label and a hover title `<age> (pinned) <m:ss>`. The marker legend gains a last item, "Age-up (pinned)", shown even when the current run has no markers. Other pinned marker kinds are not drawn, and the series legend toggle does not hide the pinned markers. Non-goals: no API, data or simulation change; current-run markers are unchanged.

## Merge risk
**low** - UI-only change in the AoE4 chart components plus one docs paragraph; a revert fully undoes it, no public surface or critical path is touched, and unit and acceptance tests pin the behavior.

## Review focus
No hotspots: additive rendering that only appears when a pinned run has age-up markers, covered by unit and acceptance assertions.

## Reviewer guide
Reviewable change: +36/-5 LoC (excludes unit and acceptance tests)
- [`components/apps/aoe4-build-order/line-chart.tsx`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/68/files#diff-17b99f04400281566be4134563c956ce7effa88f0fa5028946f698b678c2c167) - adds `pinnedAgeUpMarkers` filter and renders dashed pinned reference lines; verify they carry no text label and use the age-up colour.
- [`components/apps/aoe4-build-order/chart-legend.tsx`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/68/files#diff-ce3b1cfdc2e4edaa30b414bc06ed1ec480e0d3fd126b093ffbd1832baeab48fe) - `MarkerLegend` takes `pinnedAgeUps` and appends the "Age-up (pinned)" item last, even with no current markers.
- [`components/apps/aoe4-build-order/results.tsx`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/68/files#diff-52bb6320b9e8071b4d8a22dfe3afab52c78cd000cb29ebf1f3b422243765b64f) - passes `pinned?.markers` to the three charts.
- `docs/aoe4-build-order.md` - documents the pinned markers and legend item.

Existing test edited: `acceptance/aoe4-build-order.spec.ts`, the pinned-dash test, extended with pinned-marker assertions; none of its existing assertions changed.

## Invariants and scope
Invariants touched: none. Simulation, data files and API routes are unchanged.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01TtL2k5ibgJmbvwcSBpZN7e

