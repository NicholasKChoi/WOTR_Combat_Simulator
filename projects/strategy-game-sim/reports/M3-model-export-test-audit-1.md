# M3 model.ts export / closed-list test audit 1 (2026-11-01)

Scope: SGS-038..051, 054, 055. Closed lists checked: `model.ts`-exports test (`lib/aoe4-build-order/data.acceptance.test.ts`, type list sorted, runtime list in source order) and the `Record<keyof X, true>` key literals plus schema-name lists in `acceptance/aoe4-simulate-api-contract.spec.ts`. No other closed export/schema list exists on origin/main (SGS-054 adds the schema-count check itself).

Only SGS-044 adds `model.ts` exports (`ChartMarker`, `ChartMarkerKind`, `CHART_MARKER_KINDS`, `AGE_NAMES`). SGS-038/039/041/042/043 change fields of existing types only.

| ticket | changed | added |
|---|---|---|
| SGS-038 | yes | Tests that must change: `simInputOverrides` key literal gains `nodeAmounts` |
| SGS-039 | no | Trigger/BuildStep have no key literal; bounds map already in Scope |
| SGS-040 | no | |
| SGS-041 | yes | Tests that must change: `buildOrderNote` key literal gains `severity` |
| SGS-042 | no | `stepTiming` literal already Scope 9 |
| SGS-043 | no | `simulationResult` literal and `SHARED_SCHEMAS` already Scope 4 |
| SGS-044 | yes | Scope 8: model.ts-exports test (+`ChartMarker`, `ChartMarkerKind` types and count; +`CHART_MARKER_KINDS`, `AGE_NAMES` runtime), `simulationResult` literal `markers`, `ChartMarker`/`ChartMarkerKind` in schema lists and `typeKeys`; criterion and Out of scope amended (respec 3) |
| SGS-045..051, 054, 055 | no | no `model.ts` export or closed-list change |
