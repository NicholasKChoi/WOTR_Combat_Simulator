# SGS-191 spec gate 1

**Verdict: READY**

Checked at origin/main (87f0cd7). No dependencies.

## Checks
- Grounded: `unitSeries` (simulate.ts:975), `researchMarker` (markers.ts), `researchItem` (research.ts:27, the only caller), `state.data.upgradeTargets`, `byBaseId` (sorted by age), the contract spec's `Record<keyof UnitSeries, true>` (line 507), openapi `UnitSeries` and `ChartMarker`, and the format doc `unitsProduced` and `markers` sentences all exist as described. `unit-lines.ts` is marked new.
- English data matches the C4 rule and samples: spearman gives `Spearman`, man-at-arms (`Vanguard`, `Early`, plain, `Elite`) gives `Man-at-Arms`, and longbowman, knight and villager are as stated. Every baseId in the snapshot has a non-empty common word suffix, so the loop criterion can hold.
- Existing tests: `markers.test.ts` and `aoe4-simulate-api-markers.spec.ts` assert exact markers only for economy, blacksmith and other techs (horticulture, double-broadax, steeled-arrow, textiles and similar), none in `upgradeTargets`. Only `result-series.test.ts` builds a `UnitSeries` literal. The data test's exported-type list does not change, because no new exported type is added.
- Contracts match design C3, C4 and C7b. `unitSeries` and the research handler are not in `criticalPaths` symbols, so `standard` risk is fine.
- Docs: the only other doc mention of the fields is `docs/aoe4-build-order-ui.md:114`, and it is out of scope and not made untrue. Format doc and OpenAPI are in Scope.
- Open questions are none. On merge is `none`. Unverified assumptions `none` is correct: there is no external dependency.

## Notes (non-blocking)
- Criterion 4 asks for a loop over every `upgradeTargets` key that runs the research through the engine. Some keys need an age, a building and resources, so the test should use a build or a setup that reaches each one. If a key cannot be reached cheaply, call `researchMarker` or `researchItem` directly for those keys.
- `unitLineName` receives only `type: 'unit'` entries. In English data all `units` are type unit, but `byBaseId` also holds techs and buildings under other baseIds, so `unitSeries` should filter by type as Scope says.
