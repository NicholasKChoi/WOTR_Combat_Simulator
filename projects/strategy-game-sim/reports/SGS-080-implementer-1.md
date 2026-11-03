# SGS-080 implementer report 1

- Ticket: SGS-080 (one villager per built farm)
- Branch: `sgs-080-aoe4-one-villager-per-farm`, base `origin/main` `1bdf1d6`
- Tip SHA: `61590e2`
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-080-aoe4-one-villager-per-farm`
- Resumed uncommitted work from an interrupted run. I reviewed it against the ticket and kept it. I added the
  OpenAPI changes, which were missing, then validated and committed.

## Files touched

- `lib/aoe4-build-order/simulate.ts`: `createdByOf`, `slotsAt` (next to `isDry`), `waitForSlot`, a capped `assignGatherers`, `sendWalking` idle-first at a node with `createdBy`, `fillSlots` called in `completeConstruction` right after `addBuildingInstance`, `capStartGatherers` in `createEngine`, `EngineState.farmIdle`, warning wiring in `simulateBuildOrder`, and the comment above `houseBuilderSource` replaced.
- `lib/aoe4-build-order/depletion.ts`: exported `IdleArrival` type, `addIdleArrival` (shared with `recordIdleArrival`), the `farmIdleWarnings` builder, the `tieRank` branch `[0, FINITE_NODE_REFS.length, 0]` before the node fallthrough, and the comment update.
- `lib/aoe4-build-order/model.ts`: new `farm-idle` `SimWarning` member.
- `lib/aoe4-build-order/test-helpers.ts`: new `withStartFarms(n)` helper (adds n `farm` entries to the civ `startingState.buildings`).
- `lib/aoe4-build-order/simulate-farms.test.ts` (new): unit cases for the acceptance criteria.
- `lib/aoe4-build-order/depletion.test.ts`: `sortWarnings` farm-idle order case.
- `lib/aoe4-build-order/simulate-depletion.test.ts`, `simulate-house-warnings.test.ts`, `acceptance/aoe4-simulate-api-house-lead-time.spec.ts`: Scope 5 edits (see below).
- `docs/aoe4-build-order.md`: auto-house paragraph, Farms and mill coverage, feature list, Idle villagers, Results table and sort order, Severity table, API `warnings` list.
- `docs/api/openapi.json`: `farm-idle` variant after `idle-arrival`, the `warnings` sort-order and contents text, `info.version` 2.1.0 -> 2.2.0.

Start-state note: `capStartGatherers` runs after `start.buildings.value.forEach(addBuildingInstance)`, not before. At that point `state.buildings` counts exactly the `createdBy` entries of the override-resolved `start.buildings.value`, so this matches the ticket's count. The override case is tested.

## Tests

- `npm test`: 45 files, 1335 passed, 2 failed, 10 skipped. The 10 skips are already in `builds.test.ts`; this branch did not add them. Both failures are shipped-build assertions that the ticket says to leave failing:
  - `lib/aoe4-build-order/builds.test.ts` > "ENG Spear/Longbow into MAA/Crossbow" > "reaches Castle, with the opening army before the Castle landmark and the transition after it". man-at-arms now starts at 691.3 s, before the Castle landmark (772.3 s). The build has a `farm-idle` warning: 110 villagers from 2:10.
  - `lib/aoe4-build-order/research.acceptance.test.ts` > "the Knight/Longbow build converts its longbowmen when veteran longbowmen completes" > "holds 12 tier-2 longbowmen just before completion and moves them all to tier 3 at it". `longbowman-3` at 1800 s is now 75 instead of 66. The build has a `farm-idle` warning: 25 villagers from 10:24.
  - Reason for both: the shipped builds still send more farmers than they build farms. ENG 1TC has no `farm-idle`, and its pins are unchanged. Neither test was loosened, skipped or re-pinned. They are for SGS-081.
- `simulate-farms.test.ts` (14 tests) covers these rules:
  - Zero farms: food rate is 0 at every sample, and there is exactly one warning with `at` 50 and the exact message for 3 and for 1 villagers. The same inputs give the same warnings (A3).
  - Farms completing one at a time: farm counts (gatherers, idle) are [0,3] -> [1,2] -> [2,1]. Food income is 0, then 1x and 2x `farmRate` from each completion instant. There is one warning: `at` the first arrival, `idleVillagers` 3 (1+2, including promoted villagers).
  - Move order: with 1 farm, 1 gatherer and 1 idle villager, `move 1 farm->wood` gives [1,0], and wood gets 1. Farm income does not change.
  - Builders: 1 builder gives [1,0] and no warning. 3 builders give [1,2] and a warning with `idleVillagers` 2 at completion.
  - Start state: 2 farms and 4 farmers give [2,2], `spawnedPopulation` equal to the uncapped run, and a warning with `at` 0 and `idleVillagers` 2. With 4 farms there is no warning. The same holds when the 2 farms come from a `rules.startingState` override.
  - Auto-house at farm: the farm counts go [3,1] -> [2,0] -> [3,1], with one warning of `idleVillagers` 2. With 0 farms and only idle farmers, no house is built in 600 s.
  - Population: a `villagers` trigger arms at the same time with farmers at farm as with farmers at wood, and the spawned population matches.
  - Nodes with no `createdBy` (wood, gold, sheep) are unchanged and have no idle villagers.
- `depletion.test.ts` new case: given `step-stuck`, `farm-idle`, `idle-arrival` stone and `node-depleted` sheep, the order is `node-depleted, idle-arrival, farm-idle, step-stuck`.

## Pre-existing tests edited (Scope 5)

- `simulate-depletion.test.ts` "taking villagers from a ref" (the `move(6, 'berry', 'farm')` case): adds `game: withStartFarms(6)` so all 6 farmers have a farm. Assertions are unchanged. Scope 5 says incidental farm tests build their farms in setup.
- `simulate-depletion.test.ts` "auto-house builders" shared runner: adds `game: withStartFarms(start.villagers?.farm ?? 0)` so starting farmers have farms. Assertions are unchanged. Same rule.
- `simulate-house-warnings.test.ts` "leaves every field of %s at 1800 s but warnings and gathered as it was": re-pinned the digests for Spear/Longbow (`a0105e4a512765a0` -> `82867e5d74ea9cfd`) and Knight/Longbow (`46f521f50e92ca03` -> `f87b516ea7dc4f08`). ENG 1TC and the `held` values are unchanged. Scope 5 says to re-pin the 1800 s digests.
- `acceptance/aoe4-simulate-api-house-lead-time.spec.ts` "shipped builds at 1800 s": re-pinned the english-knight-longbow cap (1302.87 -> 1369.86) and the four digests. english-1tc is unchanged. Scope 5 says to re-pin these digests and cap instants. I recomputed the values in-process with the spec's digest function over the JSON round-trip, and they match. The 800 s population checks in that spec give the same series as before. I did not run the Playwright spec itself (see Stages).

## Doc claims

- docs "The source is chosen by its gatherers only, so idle villagers alone never make a node the source; at a farm, the builders are taken from the villagers waiting idle there first, then from its gatherers." Backed by `simulate.ts:houseBuilderSource` (reads `gatherers` only) and `sendWalking` (idle first when `createdByOf` is defined). Tested by the house-builder mutation.
- docs "returning ... to a farm with every farm taken, leaves them idle there". Backed by `assignGatherers` -> `waitForSlot`.
- docs Farms: "The simulation lets one villager gather per built farm (one per instance of `gatherNodes.farm.createdBy`, starting farms included), with no input to turn this off. As a simulation rule, a villager that arrives, or starts, at `farm` with every farm taken waits idle there and is put on the next farm built, the instant it completes; this is how the simulator models extra farmers, not a claim about how AoE4 handles them." Backed by `slotsAt`, `capStartGatherers`, `fillSlots` in `completeConstruction`, and `schema.ts` unchanged.
- docs feature list "one villager per built farm, extra farmers idle until a farm is built". Same code.
- docs Idle villagers: "an arrival at `farm` with every built farm taken, or a starting farmer beyond the starting farms, waits idle at the farm; a farm that completes takes the waiting villagers at once, up to one per free farm. At a farm, `move`, `build` and auto-house builders take the waiting idle villagers before the gatherers, so villagers idle there only while every farm is taken." Backed by `assignGatherers`, `capStartGatherers`, `fillSlots` and `sendWalking`. `move` and `build` both call `sendWalking`.
- docs Results row `farm-idle`: "at most once per run, at the first instant ... (0 for starting farmers); `idleVillagers` adds up every such villager, including those a farm takes later", plus the message example. Backed by `addIdleArrival` (keeps the first `at` and sums counts), `farmIdleWarnings` (returns at most one warning) and `capStartGatherers` at time 0.
- docs and OpenAPI sort order "... then `farm-idle`, then `step-stuck` ...". Backed by `depletion.ts:tieRank`.
- docs Severity `farm-idle` | `warning`. Backed by `farmIdleWarnings`.
- docs API: "at most one `farm-idle` warning (severity `warning`, with `idleVillagers`) when villagers wait idle at `farm` for lack of a built farm", plus the 1-villager message example. Same code.
- OpenAPI variant descriptions: "Villagers arrived, or started, at farm with one villager per built farm already gathering, and wait idle until a farm is built; at most one per run; severity is warning."; `at` "Game time in seconds of the first villager left idle for lack of a farm."; `idleVillagers` "Total villagers that arrived, or started, at farm with no free farm by durationSeconds, including those a farm took later." Same code.
- Code comments: `EngineState.idle` and `farmIdle`, `slotsAt`, `sendWalking`, `capStartGatherers` ordering, `addIdleArrival`, `houseBuilderSource`, `tieRank`. Each states what the function body directly below it does.

## Mutation checks

Each break was applied, the tests run, and the file restored from a copy (verified with `diff -q`):

- `assignGatherers` with no cap (`fits = count`): 7 tests failed (zero farms x2, promotion, warning sum, builders x3, auto-house x2).
- `fillSlots` call removed: the promotion test failed.
- `sendWalking` taking gatherers first everywhere: the move-order and auto-house idle-first tests failed.
- `capStartGatherers` removed: the start-state tests x2, move order and auto-house failed.
- Excess villagers dropped instead of idled: 7 failed, including the population/trigger test.
- `slotsAt` returning 2 instead of Infinity for nodes with no `createdBy`: 9 failed, including the other-nodes-unchanged test.
- `houseBuilderSource` counting idle villagers: "never start from waiting farmers alone" failed.
- `tieRank` farm-idle branch removed: the sortWarnings farm-idle case failed.
- `addIdleArrival` keeping the last `at`, or only the last count: the warning-sum and auto-house tests failed, and so did the existing `recordIdleArrival` test.
- Message always "wait": the 1-villager message test failed.
- `farmIdleWarnings` not added in `simulateBuildOrder`: 7 failed.

## Stages

- codegen: not set.
- build: `npx next build` passed. `node_modules` was already installed, so I did not rerun `npm ci`.
- lint: `npx tsc --noEmit` clean, and `npm run lint:dup` found 0 clones (exit 0).
- unit: as above (2 failures, both expected for SGS-081).
- Ticket checks:
  - `git diff --exit-code origin/main -- lib/aoe4-build-order/schema.ts` exits 0.
  - The OpenAPI input-schema `jq` diff prints nothing.
  - `git grep -c "'farm'" lib/aoe4-build-order/simulate.ts` gives 0.
  - `simulate.ts` has no `capacity` name.
- Not run: Playwright acceptance (not my gate; Node is v22.17.0 and the repo declares `engines.node` 24.x; fix with `nvm install 24`).

## Invariant check

- A1: the slots come from `gatherNodes.<kind>.createdBy` in base data. No `'farm'` literal and no numbers were added.
- A2: no payment or affordability code changed.
- A3: everything is deterministic, and the zero-farm test compares two runs.
- S3: no new input or loop. The `fillSlots` and `capStartGatherers` loops are bounded by `NODE_REFS`.

## Out-of-scope findings

- `acceptance/aoe4-gathered-resources.spec.ts:68-70` and `acceptance/aoe4-simulate-api-issue-shape.spec.ts:13-16` assert `info.version` `2.1.0`. The ticket requires the bump to `2.2.0`, so both will fail until the acceptance gate updates those pins. I did not edit them because they are acceptance-harness tests not named in Scope 5.

## Status

`needs_review`
