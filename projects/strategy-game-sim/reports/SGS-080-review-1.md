# SGS-080 review 1

- Branch `sgs-080-aoe4-one-villager-per-farm`, tip `61590e2` (local branch only, not on origin; reviewed by SHA), base `origin/main` `1bdf1d6`. Full review.
- Verdict: **REQUEST CHANGES**

## Blocking findings

1. `docs/aoe4-build-order.md:403` - contract (text) - The Idle villagers paragraph the diff edits still opens with "Nothing moves them on its own; `move` and `build` take them from their node like gatherers." `fillSlots` (`simulate.ts:211-219`, called from `completeConstruction` at `:434`) now moves idle farmers onto a newly built farm with no step, and the sentences the diff appends to the same paragraph say so. The paragraph contradicts itself, and the repo checklist (AoE4: "a doc sentence the diff leaves contradicted by the code is blocking") applies. Direction: replace that sentence with exactly:
   "Nothing moves them on its own, except that a farm that completes takes villagers waiting idle at `farm` (below); `move` and `build` take them from their node like gatherers."

2. `acceptance/aoe4-simulate-api-depletion-engine.spec.ts:211-219` - test - "infinite nodes > farm and wood never run out over an hour" builds its own order with `villagers: { farm: 3, wood: 3 }` and no farm. It now fails: `warnings` holds a `farm-idle` warning (at 0, 3 villagers), and food is 0. Scope 5 covers this case ("Any other test that builds its own order and has villagers at `farm` with fewer built farms than villagers ... keeps its expected value and builds the farms in its setup"). The implementer did not run Playwright, so this was missed. Direction: keep the assertions and build the farms. For example, use start `{ villagers: { wood: 6 }, rally: 'wood' }` with steps `[PAUSE, b, b, b]`, where `b = { action: 'build', building: 'farm', from: 'wood', then: 'farm' }`. I checked this in-process with the unit `run` helper at 3600 s: `warnings` is `[]`, depletions has no `farm` or `wood`, final food rate is 110.1 and wood rate is 93.0. List the edit in the report as a Scope 5 edit.

3. `acceptance/aoe4-simulate-api-contract.spec.ts:133` and `:485-497` - contract (acceptance criterion) - The ticket requires this spec to pass. It fails twice:
   - "every SimWarning variant is closed ... tagged by a code const": the pinned code list does not include `farm-idle`.
   - "SimWarning variant keys match the schema variants": the `simWarningVariants` tuple is matched to `oneOf` by index, and `farm-idle` is now at index 2.

   `tsc` does not catch this because the tuple does not have to cover every member. Direction:
   - Add `'farm-idle'` after `'idle-arrival'` in the list at line 133.
   - Add `WarningKeys<'farm-idle'>` with `{ code: true, severity: true, message: true, at: true, idleVillagers: true }` as the third entry of `simWarningVariants`, both in the type and in the value.

   Routing: these are acceptance-harness pins, like the two `2.1.0` version pins. The manager may send this fix to the acceptance-test gate together with those pins instead of the implementer. Either way, the criterion stays unchecked until it passes.

## Spec gaps

None.

## Acceptance criteria

Not ticked, because the verdict is not APPROVE.

- No off switch: **pass**. `git diff --exit-code origin/main -- lib/aoe4-build-order/schema.ts` exits 0, and the jq diff of the input schemas prints nothing.
- Zero farms (rate 0, one warning, exact message for 3 and 1): **pass**. Covered by `simulate-farms.test.ts` "leaves %i villagers idle ...", with exact message equality.
- One farm, three villagers, promotion at second completion: **pass**. The probe shows [0,3] -> [1,2] -> [2,1], and food goes 0 -> 1x -> 2x from each completion instant.
- `idleVillagers` adds up arrivals: **pass**. 1+2 arrivals give `{ at: 5, idleVillagers: 3 }`.
- Move order idle-first at farm: **pass**.
- Builders 1 / 3: **pass**. `fillSlots` runs right after `addBuildingInstance` and before `arrive`.
- Start state (civ data and `rules.startingState` override, 2 vs 4 farms, population unchanged): **pass**. `capStartGatherers` runs after the starting buildings are added (`simulate.ts:882`). At that point `state.buildings` is exactly the `createdBy` entries of the override-resolved `start.buildings.value`, so this is equivalent to the ticket's count. The method differs from the ticket's wording, but the result is the same.
- Auto-house builders at a farm: **pass**. Counts go [3,1] -> [2,0] -> [3,1] with `idleVillagers` 2, and no house starts from idle farmers alone.
- Farm is the only slotted node: **pass**. One caveat on "a depleted ref still gives builders gatherers first": at a depleted ref, gatherers are always 0 (`collectRunOuts` runs first in every instant, and arrivals there go idle). So gatherers-first and idle-first cannot be told apart there, and I confirmed that making `sendWalking` idle-first everywhere fails no unit test. The code keeps gatherers-first as the ticket asks.
- Population and triggers: **pass**.
- No `'farm'` literal in `simulate.ts` (`git grep -c` exits 1 with no matches) and no `capacity` name: **pass**.
- `sortWarnings` order case: **pass**.
- OpenAPI `farm-idle` variant, closed, `2.2.0`: the variant is present and correct. The "contract spec passes" part **fails** (finding 3).
- Docs describe the rule as a simulation rule, the auto-house sentence is replaced, and the examples match the format: **fail** (finding 1). Everything else in this item passes.
- Scope 5 edits listed, 1800 s digests re-pinned and nothing else changed: **fail** (finding 2, a missed Scope 5 test). I ran the re-pinned `aoe4-simulate-api-house-lead-time.spec.ts`, and it passes.
- tsc, lint:dup and `npm test` (except listed shipped-build failures): **pass**. `tsc` is clean, jscpd found 0 clones, and the only `npm test` failures are the 2 listed shipped-build ones.
- No invariant regressions: **pass** (see below).

## Invariants touched

- A1 holds. Slots come from `gatherNodes[kind].createdBy` (`createdByOf`), there is no `'farm'` literal in `simulate.ts`, and no number was added.
- A2 holds. No payment or affordability path changed.
- A3 holds. The change is deterministic, and the zero-farm case compares two runs.
- S3 holds. There is no new input. The new loops are bounded by `NODE_REFS`.
- S1 and S2 are not touched.

## Lint

`npx tsc --noEmit` exits 0, and `npm run lint:dup` reports "Found 0 clones." (exit 0).

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so there are no bot findings.

## Other results (run on Node 24.22.2)

- `npx next build` passes.
- `npm test`: 2 failed, 1335 passed, 10 skipped. The 2 failures are the shipped-build ones listed by the implementer.
- `npm run acceptance` (full suite): 11 failed, 691 passed.
  - Findings 2 and 3 account for 3 failures.
  - The known `2.1.0` version pins account for 2: `aoe4-gathered-resources.spec.ts:68` and `aoe4-simulate-api-issue-shape.spec.ts:13`.
  - The other 6 are shipped-build assertions that fail only because the shipped builds still have idle farmers. The implementer's list did not include them; fold them into SGS-081:
    - `aoe4-build-order-knight-longbow-page.spec.ts:12` "shows its six reactions and runs 1800 s with no idle-villager warning ..." (a `farm-idle` warning now appears)
    - `aoe4-simulate-api-spear-longbow-build.spec.ts:34` at 1200 s and at 3600 s (the men-at-arms step timing)
    - `aoe4-simulate-api-spear-longbow-build.spec.ts:43` "at 1200 s only the first gold deposit has run out and its info node-depleted warning is the only warning"
    - `aoe4-simulate-api-veterancy-conversion.spec.ts:38` "longbowman-3 holds none at 845 s, 13 at 850 s and 66 at 1800 s" (75 now)
    - `aoe4-simulate-api-veterancy-conversion.spec.ts:44` "per-baseId counts sum ... never decreases" (asserts the 66 at line 53)

## Non-blocking notes

- `simulate.ts:205`: the non-farm branch of `sendWalking` (gatherers first) behaves exactly like idle-first, because idle and gatherers are never both non-zero at a ref without `createdBy`. It is kept because the ticket asks for it. A plain `Math.min(count, state.idle[ref])` would work for every ref, if a later ticket wants to simplify.
- `simulate.ts:449` (existing code) still spells out `state.data.base.gatherNodes[nodeKindOf(job.then)].createdBy`. It could now call `createdByOf(state, job.then)`.
- `simulate-farms.test.ts:23` `probed` reads `gatherers` and `idle` like `snapshots()` in `simulate-depletion.test.ts:37`, but on a schedule instead of at `move` offers. That difference justifies a separate helper. jscpd finds no clone.
- `simulate-farms.test.ts:87-90` repeats `{ start: { villagers: { wood: 3 }, rally: 'wood' }, inputs: noHouses }` twice within one test. This is minor.
- The `farm-idle` message says "arrived" for starting farmers too (at 0:00). That is the wording the ticket specifies.

## Coverage

- Reviewed the full diff of 11 files:
  - `simulate.ts`, `depletion.ts`, `model.ts`, `test-helpers.ts`
  - `simulate-farms.test.ts`, `depletion.test.ts`, `simulate-depletion.test.ts`, `simulate-house-warnings.test.ts`
  - `aoe4-simulate-api-house-lead-time.spec.ts`, `docs/aoe4-build-order.md`, `docs/api/openapi.json`
- Read every `gatherers` and `idle` mutation site in `simulate.ts`, the `createEngine` start sequence, `startConstruction`, `completeConstruction`, `houseBuilderSource` and the income paths.
- Grepped `docs/` and the data README for the stale-wording terms.
- Checklist "Every diff": I ran `next build`. Pages were exercised only through the Playwright suite, which includes the AoE4 page specs. There is no UI change, so I took no manual screenshots.
- `REVIEW.md` does not exist, and project `LESSONS.md` is empty.
