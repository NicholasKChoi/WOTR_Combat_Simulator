# Tech-lead gate: batch SGS-192-SGS-192

## Decision

APPROVE - draft PR opened. No blockers, no untested hotspots.

## PRs (bottom to top)

- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/205 - base `main` - new - head `d30e22c409d1cdfccec78bad4a51dce075843065` (branch `sgs-192-wait-details`, draft)

### Merge risk
**medium** - adds required fields to the public simulate API response (`StepTiming`, OpenAPI), backward compatible, and a revert undoes it; no `criticalPaths` symbol changes.

### Review focus
- [`lib/aoe4-build-order/simulate.ts:516-519`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/205/files#diff-310305ffeb6ab9fa1ee43274c0609a8023b9c6106a9fbd1c97b9847949ad34f6R516-R519) - the `build` handler's affordability check was rewritten from `canAfford`/`canAffordHeld` into one `canAfford` over a computed need; a slip (holding the house cost back from an explicit `build house`, or not holding it from other builds) would shift build timings in every run - check `need` matches the old two branches exactly - pinned by [`lib/aoe4-build-order/simulate-house-hold.test.ts`: does not hold an explicit build house step; starts the build step the instant the bank covers its cost plus one house](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/blob/d30e22c409d1cdfccec78bad4a51dce075843065/lib/aoe4-build-order/simulate-house-hold.test.ts#L55-L100)
- [`lib/aoe4-build-order/simulate.ts:950-980`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/205/files#diff-310305ffeb6ab9fa1ee43274c0609a8023b9c6106a9fbd1c97b9847949ad34f6R950-R980) - `accrueDetail` merges intervals by `waitTargetKey`; merging by kind instead, or overwriting an entry's first numbers, would show wrong per-target seconds that no longer add up to `waitBreakdown` - check the key lookup, the first-interval rule and the age-landmark upgrade - pinned by [`lib/aoe4-build-order/simulate-wait-details.test.ts`: accrueWait keys details by target; the wait details add up to the breakdown](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/205/files#diff-4b8eff7a4a191ce12c71073bcd6d864da1fdef6c9a1c9aa31c38bd719eef2f72R277-R332)

## What I reviewed

- Range `22c47e0..d30e22c` (origin/main merge-base to tip), 3 commits, 22 files, +1353/-73. Business logic +244/-31: `simulate.ts`, `research.ts`, `model.ts`, new `wait-detail.ts`. Also read the edits to existing tests (only shape, fixture and pinned-name edits; no timing assertion changed; the house-gate digest drops the two new fields so its pins stay timing-only).
- Equivalence checks: `canAffordHeld(state, cost)` is `canAfford(state.resources, heldNeed(cost, [state.houseHold]))` (engine-common.ts:53-55), so the build rewrite keeps the old two branches. The `produce` split keeps every pre-population failure as `prerequisite` with no reserve. `researchEntry` is undefined only when every tech/upgrade tier is above the age, so `lowestResearchAge` gives an age of at least 2 and the `age as 2|3|4` cast holds. `not-reached` steps have `armedAt === null` and were never offered, so their `waitingFor` stays null.
- Invariants A1, A2, A3: no violation. Details only read state; no randomness or clock; names come from the snapshot.
- `StepTiming` has no consumer outside the engine, `step-annotations.ts` (unchanged) and tests; results are not persisted, so adding required fields breaks no stored data.
- PROJECT.md Open questions: none. M11 has no Safety and contracts section in MILESTONES.md.
- No Preview checks section: ticket `Unverified assumptions: none`. No issue line: ticket Source names no GitHub issue. Stack footer lists #205 alone (SGS-190 integrated, SGS-193 has no PR).

## Non-blocking notes

- The tests linked for the build-handler focus entry are in a file this PR does not touch, so that link is a blob permalink at the pushed head rather than a files-view anchor.
- `waitingFor` and the `waitDetails` entry it creates share one object reference in the result. Harmless today (nothing mutates details after creation, JSON serialization copies them), but a future in-place edit of a detail would change both.
