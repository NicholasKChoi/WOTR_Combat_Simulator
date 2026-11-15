# Tech-lead, batch SGS-156-SGS-156

## Decision
PASS. Draft PR opened. No blockers and no untested hotspots.

## Opened PRs (bottom to top)
- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/168
  - Base: `main`. Head: `sgs-156-auto-houses-plan-ahead` at c8685a7c0fb35fde870bb5f09378369d36a67624.
  - Pushed with a plain push, which created the branch on origin. No new commits.
  - Draft. The body was set with `gh api -X PATCH`.

### Merge risk (verbatim)
**medium** - changes the `criticalPaths` engine symbols `runInstant`, `nextWake` and the step and order payment checks in `simulate.ts`, plus a new shared affordability helper in `engine-common.ts`. The API response shape is unchanged and a revert restores the old timings.

### Review focus (verbatim)
- [`lib/aoe4-build-order/simulate.ts:660-686`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/168/files#diff-310305ffeb6ab9fa1ee43274c0609a8023b9c6106a9fbd1c97b9847949ad34f6R660-R686) - if the hold is not cleared on the right condition (house started, no longer due, or too few working villagers), every wood-costing step and military order is held back by one house's cost for the rest of the run. If it is cleared too early, the Town Center is housed again. Check the replan after starts (`stillDue`) and the `working >= houseBuilders` count, which includes walking builders. Pinned by [`simulate-house-hold.test.ts`: house builders and the hold](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/168/files#diff-b2617bac550f048d5fb6a4acf763d9fe88a006f11773bae81243c9308b2a07a5R141-R168) and [`simulate-house-hold.test.ts`: releases the hold at the instant the house stops being due](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/168/files#diff-b2617bac550f048d5fb6a4acf763d9fe88a006f11773bae81243c9308b2a07a5R131-R138)
- [`lib/aoe4-build-order/simulate.ts:813-816`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/168/files#diff-310305ffeb6ab9fa1ee43274c0609a8023b9c6106a9fbd1c97b9847949ad34f6R813-R816) - a held step whose wake ignores the hold wakes when its bare cost is affordable, gets refused, and then starts only at the next sample, so reported step times drift late. Check that the step index used for the explicit-house exemption is the cursor step or the reaction's own index. Pinned by [`simulate-house-hold.test.ts`: starts the %s step the instant the bank covers its cost plus one house](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/168/files#diff-b2617bac550f048d5fb6a4acf763d9fe88a006f11773bae81243c9308b2a07a5R55-R69)
- [`lib/aoe4-build-order/houses.ts:20-52`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/168/files#diff-47538e8438ee180a1c60c3d9544f464bfcadb553ff38c244e9ff9860d58af8b7R20-R52) - a wrong gather window either plans the house too late (the Town Center sits housed) or holds wood too early (steps stall). Check that the shortfall uses the real bank, that zero income on a short resource returns no house, and that pending buildings count toward headroom over the widened window. Pinned by [`houses.test.ts`: planAutoHouse with the house cost not yet banked](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/168/files#diff-e663d8f42a6094b9a9d7bb761dc7142abe3b7dd3736cb1c6a7eecc72e8887b59R115-R147)

### What the body covers
- The PR Summary states that every saved build's simulated result shifts, and that the 1200 s floating cap rose from 2000 to 2600 (ticket Scope 9).
- No Preview checks section: the ticket says `Unverified assumptions: none`.
- The stack footer uses marker `cf-stack` and lists the single PR.

## What I reviewed
- Commit range: `e50e074..c8685a7`, 6 commits. The merge-base with origin/main is e50e074. origin/main is now at c5bd608; per the review-2 report, #166 and #167 touch none of the branch's files.
- Diff: 15 files, +520/-79.
- Hand-written business logic: +97/-36.
  - `simulate.ts` +41/-28
  - `houses.ts` +32/-5
  - `engine-common.ts` +21/-0
  - `research.ts` +2/-2
  - `production-floors.ts` +1/-1
- I read the full production diff and the doc and README diffs.
- I read every assertion in `simulate-house-hold.test.ts`, plus the `houses.test.ts` changes.
- I checked every remaining `canAfford` and `payCost` call site:
  - Every paying step handler (`produce`, `build`, `researchHandler`; `stepHandlers` has no other paying handler) goes through `canAffordHeld`.
  - Explicit `build house` steps and auto-house starts use plain `canAfford`, as specified.
  - `payOrder` uses `heldNeed` for non-villager orders.
- `nextWake` maps the reserve to `engine.cursor`, which is the step that set `engine.reserve` in `offerSteps`. Reaction needs carry their own step index.

## Checks against the flag list
- **Invariants.**
  - A2 holds: the hold only makes checks stricter, and `payCost` is unchanged.
  - A3 holds: the passes run in a fixed order with no randomness, and the repeat-equality tests cover it.
  - A1 holds: the house cost comes from data.
  - S3 holds: there are no new inputs, and the number of loop iterations does not grow. Each instant now calls `planAutoHouse` up to 6 times, a constant-factor cost.
- **Irreversibility:** none. Nothing is migrated. Saved builds are stored as orders and their results are recomputed on each run, so a revert restores the old timings.
- **Contract:** the API response shape is unchanged. Values shift, which the PR body states.
- **Concurrency:** none. The engine is a pure synchronous simulation.
- **Security:** nothing touched.
- **Open questions:** PROJECT.md has none. The ticket's owner decisions (Q92, Q98, the respec-1 builder hold) are followed as written.

## Untested hotspots
None. Each Review focus entry is pinned by assertions that fail on a break. The review-2 and acceptance-test reports record these mutation results:
- Setting the hold to the due count times the house cost fails test :75.
- The full base engine fails the fixture test.

## Non-blocking notes
- **Builder-hold stall (owner-decided behavior).** Suppose:
  - at least `houseBuilders` villagers are working, but no single node ever holds that many gatherers;
  - nothing gathers wood.

  Then the hold stays for the rest of the run, and wood-costing steps wait on cost plus one house. The test row "enough villagers, all busy, keep it" pins this (`startedAt` null). It is the respec-1 decision, not a defect, but users may read it as a stuck step.
- **Stale main in the branch.** The branch predates #166, so `acceptance/aoe4-results-split.spec.ts` fails on the branch tip only. A squash merge onto main takes main's version, because the branch does not touch that file.
- **Process-narration comment** at `simulate.ts:708-709` (the comment above the second `runHousePass`). It is acceptable as it stands.

## Cleanup
The scratch `tech-lead-SGS-156-SGS-156` is removed after this report; the result of the remove is in the handback.
