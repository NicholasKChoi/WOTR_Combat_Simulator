# SGS-044 rebase 1: linearize onto SGS-038

Command (in `worktrees/sgs-044-aoe4-chart-marker-data`):
`git rebase --onto sgs-038-aoe4-depletion-engine 77fa279 sgs-044-aoe4-chart-marker-data`

Nothing pushed; main and sgs-038 (04ff671) untouched.

## Result

- Old sgs-044 tip: 5231156f4f639fb56ccd4eeed49664ee72591377
- New sgs-044 tip: **a6347d897a97e14ea05fc82674a0c620c0bdd41f**
- Author and committer on both rebased commits: choinickolas@gmail.com

```
$ git log --oneline origin/main..sgs-044-aoe4-chart-marker-data
a6347d8 Add API acceptance tests for simulate markers
6e32092 Add chart marker data to the simulation result
04ff671 Add API acceptance tests for finite node stock and the deposit request contract
4749c13 Update existing tests for finite node stock and the farm build walk
12f0c53 Run finite gather nodes dry and report run-outs
```

## Conflicts (all in commit 47802d6 -> 6e32092; the second commit applied cleanly)

### lib/aoe4-build-order/simulate.ts (3 hunks, merged both sides)
1. Imports: kept 038's `FINITE_NODE_REFS, NODE_REFS, RESOURCE_KINDS, nodeKindOf` value import and its type list (`FiniteNodeRef`, `NodeRef`), added 044's `import { ageMarker, compareMarkers } from './markers'` and `ChartMarker` type. Dropped 044's `GATHER_NODES` import, which 038 had already replaced with `NODE_REFS`/`FINITE_NODE_REFS`.
2. `createEngine` initializer: kept 038's `runOuts: []` and `houseSources: ...`, then 044's `markers: []`.
3. Return: kept 038's computed `depletions, warnings` (from `depletionResults(engine.stock)`) instead of 044's placeholder `depletions: [], warnings: sortWarnings([])`, plus 044's `markers: [...engine.markers].sort(compareMarkers)`. `sortWarnings` no longer exists on 038 (sorting lives in `depletionResults`).
Auto-merged without conflict: 044's `markers` field on `EngineState` and the `state.markers.push(ageMarker(...))` beside the single `ages.push`.

### docs/api/openapi.json (2 hunks, merged both sides)
1. 200 example: kept 038's six null depletion rows (sheep, berry, deer, boar, gold, stone) and `"warnings": []`, then appended 044's `"markers": []`.
2. `SimulationResult.properties.warnings.description`: kept 038's wording ("...come from run-outs (see nodeAmounts); nothing emits step-stuck yet.") over 044's stale "Empty today: no node runs out.", then added 044's `markers` property.
Verified: file parses and equals its own `json.dumps(indent=2)` output (canonical 2-space form); `SimulationResult.required` contains `depletions`, `warnings` and `markers`; schemas contain NodeRef/FiniteNodeRef/NodeDepletion and ChartMarker/ChartMarkerKind.

### Clean auto-merges checked
- `docs/aoe4-build-order.md`: 044's research-marker sentence and `markers` bullet on top of 038's text.
- `lib/aoe4-build-order/data.acceptance.test.ts`: model.ts-exports test now lists 29 types (038's set + ChartMarker, ChartMarkerKind) and runtime names (038's FINITE_NODE_REFS/nodeKindOf/SEVERITIES... + CHART_MARKER_KINDS, AGE_NAMES); passes against merged model.ts.
- `acceptance/aoe4-simulate-api-edges.spec.ts`: result key list is the union (038's `depletions`/`warnings` + 044's `markers`).
- `acceptance/aoe4-simulate-api-contract.spec.ts`: RESPONSE/SHARED schema lists and type-key literals carry both NodeDepletion/SimWarning and ChartMarker/ChartMarkerKind.
- `components/apps/aoe4-build-order/result-series.test.ts`, `lib/aoe4-build-order/research.ts`, `model.ts`: clean.

No semantic decision beyond merging both sides was needed.

## Checks (Node v24.22.2, new tip a6347d8)

| Check | Result |
|---|---|
| `npx tsc --noEmit` | pass |
| `npm run lint:dup` | pass (0 clones) |
| `npm test` | pass, 34 files / 840 tests |
| `npx next build` | pass |
| `npm run acceptance` | pass, 416/416 |
