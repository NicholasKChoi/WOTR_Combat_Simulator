# SGS-043 ticket report

File: tickets/SGS-043-aoe4-spend-population-series.md (outline I, depends on SGS-035).

Summary: adds `spent`, `spawnedPopulation`, `populationCapReachedAt` to SimulationResult. Sampled in the existing
loop beside `floating`; spawn hook in `spawnUnit`; seed from start state with entry popcap. OpenAPI (schema +
200 example) and docs Outputs updated in the same diff. ~45 business LOC, component aoe4-build-order.

Risk: standard (plan said low). The public SimulationResult schema gains three required fields, which the template
excludes from low. No strongModelTrigger applies.

Checks run: `jq` SimulationResult.required length = 10 today (criterion says 10 -> 13). `spawnedPopulation` in docs
= 0 matches today. No mutation criteria.

Findings: main has no engine-common/payCost/SpendCategory yet (SGS-035 not merged); ticket states the
prerequisite and says to follow SGS-035's names if they differ. `createEngine` counts each start unit as popcap 1
for `population`; the new seed uses entry popcap (same value for the English scout). Diagrams: none (one-line
sentence). Overlap: SGS-048 consumes these fields; SGS-035 owns spend totals (owner answer 1).

Open questions: none.
