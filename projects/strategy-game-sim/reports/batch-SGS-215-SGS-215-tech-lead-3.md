# Tech-lead gate: batch SGS-215-SGS-215

## Decision
PASS. No blockers and no untested hotspots, so I opened a stacked draft PR.

## PRs (bottom to top)
- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/224
  - Base: `main`
  - Kind: `new`
  - Pushed head: `1871d68d5d6339e7119d8bd64d1ebc7d94842ef2`
  - Branch: `sgs-215-production-past-population-cap`
  - Title: set by `pr.sh create`
  - Body: set with `pr.sh body`, which returned "body #224 rewritten"

### Merge risk (verbatim)
**medium** - the public simulate API returns different values for runs that reach the cap (`spawnedPopulation` can exceed `maxPopCap`, and there are no `population` waits after the lift), but the response shape and OpenAPI schema are unchanged and a revert undoes it

### Review focus (verbatim)
- [`lib/aoe4-build-order/simulate.ts:363-369`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/224/files#diff-310305ffeb6ab9fa1ee43274c0609a8023b9c6106a9fbd1c97b9847949ad34f6R363-R369) - if the lift is keyed on supply alone, or ignores `supply >= maxPopCap`, runs that never reach the cap change their result, or production runs past the cap while auto-houses are still owed - check that both conditions are required and that the two call sites (the `produce` handler at l.420, `payOrder` at l.624) are the only population/supply comparisons - pinned by [`lib/aoe4-build-order/simulate-population-limit.test.ts`: hasPopulationRoom table, "starts a produce step on every target together", "keeps paying a continuous order"](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/224/files#diff-5063d1eeb03a2d61340f171c957f761d062a05b86bab5dfca3fd68462c338811R34-R63)

Each assertion that pins this entry fails under the old inline check, so this is not an untested hotspot:
- The `hasPopulationRoom` table includes the supply-alone case (not reached, with supply and population at the cap, gives false) and the reached-with-supply-below-the-cap case (false).
- With the old gate, the `produce` test and the `payOrder` test would wait forever at a population of 7 against a cap of 7.

## What I reviewed
- Commit range: `7d74800` (merge-base with origin/main) to `1871d68`, three commits:
  - ae92952 feat
  - 0d06791 test
  - 1871d68 test
- Files: 14, +370/-55 in total.
  - Reviewable non-test code: `lib/aoe4-build-order/simulate.ts` (+16/-8) and the Spear/Longbow build JSON (-14).
  - Docs: `docs/aoe4-build-order.md`, `docs/aoe4-build-order-format.md`, `docs/api/openapi.json` (descriptions only) and `data/aoe4-build-order/README.md`, +49/-22.
  - The rest is tests and test helpers.
- Invariants checked:
  - A1: the rule reads `data.base.maxPopCap.value`, with no literal.
  - A2: only the supply check is skipped; resource checks are unchanged.
  - A3: no new nondeterminism.
  - S3: `durationSeconds` is still capped at 3600 and production times are positive, so the event count stays bounded. The bounded-time test measured 113-205 ms against a 2000 ms bound, ending at a population of 754.
  - S1 and S2 are not touched.
- Consumers of `spawnedPopulation` and `populationCapReachedAt` outside `lib/`:
  - `components/apps/aoe4-build-order/compare.ts` reads only `populationCapReachedAt`, whose meaning is unchanged.
  - The page has no population chart yet (SGS-216 adds it).
- OpenAPI: no schema, enum or version change.
- Open questions: PROJECT.md has none, and the ticket has none.

## Non-blocking notes
- The S3 criterion asked for the maximum `startVillagers`, but the bounded-time test uses the default start of 6. The build schema requires the start to sum to the civ's 6 villagers, so 6 is the maximum a valid request can send. The implementer also probed an invalid 800-villager start run straight through the engine, which took at most 205 ms.
- I tried an extra probe of my own: 80 barracks producing men-at-arms over 3600 s. It never got past a population of 71 because its steps stalled on prerequisites, so it tells us nothing either way. I deleted the probe file; it was never committed or pushed.
- Results move for existing users: runs that reach the cap now show more units and `spawnedPopulation` above 200. Results pinned on the page's compare panel before this merge will differ after it. This is the intended behavior change, not a defect.

## Cleanup
I will remove the scratch checkout `worktrees/tech-lead-SGS-215-SGS-215` after writing this report.
