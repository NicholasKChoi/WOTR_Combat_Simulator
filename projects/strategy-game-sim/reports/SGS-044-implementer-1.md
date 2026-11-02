# SGS-044 implementer report 1
Branch sgs-044-aoe4-chart-marker-data, tip 47802d6, worktree .claude/code-factory/worktrees/sgs-044-aoe4-chart-marker-data, base origin/main 77fa279.
Status: needs_review.

Files: model.ts (types, CHART_MARKER_KINDS, AGE_NAMES, SimulationResult.markers); markers.ts (new); simulate.ts (EngineState.markers, age push, sorted result); research.ts (research push); markers.test.ts (new, 12 tests); openapi.json; aoe4-build-order.md; edits to data.acceptance.test.ts (count 29, ChartMarker/ChartMarkerKind, CHART_MARKER_KINDS/AGE_NAMES), contract spec (key literal, chartMarker, typeKeys, schema lists), edges spec (+markers), result-series.test.ts (markers: []).
Deviation: markers is on EngineState (not private Engine) since research.ts only sees EngineState. ageMarker takes `age: number` (cast inside via AGE_NAMES key) because simulate.test.ts bans numeric literals 2/3/4 in simulate.ts.
Results: tsc clean, lint:dup 0 clones, npm test 768/768, next build ok, npm run acceptance 380/380.
Mutations (all failed then undone): swap economy/unit-tier checks (initially passed; added type upgrade+economic_upgrade case, then fails), drop ageMarker push (2 fail), drop sort (1 fail), drop researchMarker push (2 fail).
Out-of-scope: none.
