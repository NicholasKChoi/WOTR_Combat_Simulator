# SGS-043 acceptance-test 1: PASS (tip 3209540)

Written by the manager from the agent's returned text (the agent did not write the file).

- Added `acceptance/aoe4-simulate-api-spend-population.spec.ts` (7 tests), commit 3209540 on sgs-043-aoe4-spend-population-series. Test-only.
- Base comparison against origin/main 9137cf2 (five orders): old keys identical; only `spent`, `spawnedPopulation`, `populationCapReachedAt` added.
- 150 aoe4 acceptance tests pass; tsc and lint:dup clean.
- Mutation checks: skip research in spent sum, villagers into buildings, popcap 0, round populationCapReachedAt up, +1 start popcap: each fails tests. The `populationCapReachedAt === null` guard mutation survives at API level (cannot be observed there); covered by the rework-1 unit test.
- Not expressible via the API: start-at-cap, multi-popcap unit, missing start-unit baseId, "stays set after later spawns" (unit tests cover them).
