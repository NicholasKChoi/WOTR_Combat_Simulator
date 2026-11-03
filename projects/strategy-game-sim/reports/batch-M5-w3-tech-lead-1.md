# batch-M5-w3 tech-lead 1

## Decision
PASS. No blockers and no untested hotspots. Opened 1 draft PR.

- SGS-077: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/87 (base `main`, head `sgs-077-aoe4-gathered-resources-chart` @ e9a428d, pushed now; no stack, no footer)

The ticket's risk tier is high. Rated against the factors, the PR's merge risk is medium: the field is additive, nothing existing changes value, and a revert undoes it. None of the high factors applies (no existing consumer contract changes, no migration, no concurrency, no security surface).

## Merge risk
**medium** - adds a required field to the public simulate response and OpenAPI spec, and changes `simulateBuildOrder` / `creditIncome` in the simulation engine; existing clients keep working and a revert undoes it.

## Review focus
- [`lib/aoe4-build-order/simulate.ts:706-718`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/87/files#diff-310305ffeb6ab9fa1ee43274c0609a8023b9c6106a9fbd1c97b9847949ad34f6R706-R718) - if the new running total misses one of the two income paths, or if a later change credits `engine.resources` somewhere else, the gathered chart quietly under-reports, most visibly for sheep and other limited-stock food early on - check that both `+=` on `engine.resources` have a matching `engine.gathered` line - pinned by [`lib/aoe4-build-order/simulate-series.test.ts`: gathered, balances floating and spent on the prebuilt build %s](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/87/files#diff-025a9bdbecb157675c10f2869627300043b3f78c9625fd0a2369fe6064415cfbR202-R220) (gathered summed over the four kinds = floating - start + spent, within 1e-6) and [grows at the sampled gather rate from 0 while rates hold and nothing is paid](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/87/files#diff-025a9bdbecb157675c10f2869627300043b3f78c9625fd0a2369fe6064415cfbR185-R200)

## Reviewed
- Range: origin/main ae2d45f...e9a428d (f663f88, 33a02ac, e9a428d), all authored by choinickolas@gmail.com.
- 17 files, +332/-20 in total. Hand-written business logic is +21/-1: `lib/aoe4-build-order/simulate.ts`, `model.ts` and `components/apps/aoe4-build-order/results.tsx`. The remainder is OpenAPI (+109/-1), docs (+8/-4) and tests.
- Invariants. A2: `engine.gathered` is written only in `creditIncome`, and nothing reads it except the sampler. The `+=` lines on `engine.resources` in lib/aoe4-build-order are the two in `creditIncome` (checked with git grep), and both have a matching `gathered` line. A3: the change is deterministic. S3: no new input and no new loop. S1 and S2 are not touched.
- Public contract: the response gains a required field. Existing clients are unaffected. Pins are re-simulated from stored text (`pin-storage.ts` stores only version, name, text and duration), so a stored pin has no stale result shape.
- Hotspot check: the `creditIncome` entry is covered by the two `simulate-series.test.ts` cases. I read their assertions: a per-interval delta that matches the rate (catches a missing unstocked credit or a sampling offset), and a four-kind sum identity on every prebuilt build (catches a missing drawDown credit). Both fail if either credit line is removed.
- Stack check: a single branch on origin/main with only its own commits.

## Non-blocking notes
- None.
