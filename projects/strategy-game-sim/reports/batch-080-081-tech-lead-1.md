# batch-080-081 tech-lead 1: OPENED (no blockers, no untested hotspots)

## Decision
No blockers. Two stacked draft PRs opened (footer stacking, marker `cf-stack`).

1. SGS-080 - https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/88 - base `main` - branch `sgs-080-aoe4-one-villager-per-farm` tip c8cca5f
2. SGS-081 - https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/89 - base `sgs-080-aoe4-one-villager-per-farm` - branch `sgs-081-aoe4-retune-prebuilt-farms` tip 2fc9593

Both branches pushed (they were not on origin before), no new commits. Bodies set with `gh api -X PATCH` (REPO.md: `gh pr edit` fails here).

### PR 88 Merge risk
**high** - changes what `simulateBuildOrder` computes for every request that farms (food income, step timings) and adds a warning code to the simulate response that existing consumers read.

### PR 88 Review focus
- `lib/aoe4-build-order/simulate.ts:191-209` - an off-by-one in the slot fit, or taking a gatherer before a waiting villager, silently drops food income in every farming build - check `fits` never exceeds free slots and that `sendWalking` only reorders for building-created nodes - pinned by `simulate-farms.test.ts`: moves a waiting villager off a farm before a gathering one (L82-86) and puts %i builders of a farm on it at completion (L88-98)
- `lib/aoe4-build-order/simulate.ts:211-219` and `:434` - if a completed farm does not promote a waiting villager, income stays at the old rate for the rest of the run - check `fillSlots` runs after `addBuildingInstance` and before the builders arrive - pinned by `simulate-farms.test.ts`: gathers with one villager per farm and promotes a waiting villager the instant a farm completes (L69-75)
- `lib/aoe4-build-order/simulate.ts:222-228` and `:882` - capping the starting farmers before the starting buildings are added idles every starting farmer - check the cap runs after `start.buildings` and reads the startingState override result - pinned by `simulate-farms.test.ts`: cap the starting farmers when the 2 farms come from %s (L113-123)

### PR 89 Merge risk
**low** - data, docs and test pins only; a revert undoes it, no public surface or critical-path symbol changes, and every per-build bar is pinned by tests.

### PR 89 Review focus
No hotspots: data-only change; each changed behavior (no `farm-idle`, all steps started, Castle before `man-at-arms`) is asserted per build by `builds.test.ts`: leaves no villager waiting for a farm by %i s (L76-78) and `acceptance/aoe4-simulate-api-prebuilt-farms.spec.ts`.

## What I reviewed
- Range 1bdf1d6 (origin/main) .. 2fc9593; 7 commits; stack is linear (080 tip is an ancestor of 081), each branch's diff against its base holds only its own task.
- SGS-080: 16 files, +484/-42; business logic simulate.ts +56/-11, depletion.ts +33/-5, model.ts +1 (+90/-16). Read the full engine diff, OpenAPI diff, simulate-farms.test.ts assertions.
- SGS-081: 12 files, +228/-42; build JSON +94/-6, README/docs +24/-8, rest test pins. Read the spear JSON and the pin diffs, the new prebuilt-farms spec.
- Checked: every gatherer/idle mutation in simulate.ts goes through assignGatherers/sendWalking/fillSlots/capStartGatherers or the existing run-out path (finite nodes only); the UI lists warnings generically (messages.ts reads severity/code/message only), so the new variant breaks no consumer; no schema/input change (no off switch); A1 (slots from `createdBy`), A2 (no payment change), A3 (deterministic), S3 (no new input or unbounded loop) hold.
- The 681 -> 757 `man-at-arms` trigger move is what SGS-081 Scope allows when the "reaches Castle" case fails (it did: Castle at 756.4 s); farm rallies to wood are the Q9 option A owner decision folded into Scope 1b. Not a unilateral answer.

## Non-blocking notes
- Commit subjects `e9571c3 WIP: ...` and `7eb1d10 SGS-081 rework 4: ...` carry a WIP marker and a ticket id; harmless under squash merge, but use a clean squash title.
- Spear step 14 (`@260 rally capital-town-center to wood`) is now a no-op since the 200 s rally already goes to wood (review-1 note).
- The spear spec no longer pins any gold `depletedAt` value (the 3600 s case checks not-null only); review-1 suggested an exact 1800 s pin if that coverage matters.
- PR 88 must not merge alone (shipped builds would carry `farm-idle`); the body says so.
