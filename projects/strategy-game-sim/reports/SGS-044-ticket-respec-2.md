# SGS-044 ticket re-spec (gate 3 findings)

Tickets changed: SGS-044, SGS-043. No change to Risk, dependsOn or status.

## SGS-044 (`tickets/SGS-044-aoe4-chart-marker-data.md`)

- Scope item 8: new bullet for `acceptance/aoe4-simulate-api-edges.spec.ts` "result shape" > "a villager-only order returns every result field..." (`Object.keys(body).sort()`, ~47-49 on main): pinned key list gains `markers`, no other change, relative to the base.
- Scope item 8: the contract-spec bullet now names both the `chartMarker` key literal and the `ChartMarker: chartMarker` `typeKeys` map entry.
- Scope item 5: every new OpenAPI property (`ChartMarker.kind/.label/.at`, `SimulationResult.markers`) gets a non-empty `description`.
- Stale line refs replaced with symbol plus current approximate line (model.ts ~102, simulate.ts ~298 in `completeConstruction`, research.ts ~22).
- Criteria: the allowed-edit criterion admits the edges key list (base plus `markers`) and runs `npm run acceptance -- aoe4-simulate-api-edges`; the OpenAPI criterion checks descriptions and the `typeKeys` entry. Out of scope lists all three item-8 test files.
- Appended `## Re-spec 2026-11-01 (4)`.

## Other tickets checked

- SGS-043: adds top-level `spent`, `spawnedPopulation`, `populationCapReachedAt` and did not list the edges spec. Added it to Scope 5 (relative wording) and to the "only edits to existing test files" criterion; appended `## Re-spec 2026-11-01 (3)`.
- SGS-042: adds `StepTiming` fields only (step-level); the edges spec checks steps with `objectContaining`, so no change.
- SGS-045: no shape change. SGS-048, SGS-049: UI only, no response change. Unchanged.
- SGS-037 already covers the edges spec for `depletions` and `warnings`.

## Verified

- `git show origin/main:acceptance/aoe4-simulate-api-edges.spec.ts` line 47 holds the only `Object.keys(body)` key pin across `acceptance/` for the simulate response.
- `SimulationResult.properties.ages` on main already has a `description`, consistent with the description rule.
