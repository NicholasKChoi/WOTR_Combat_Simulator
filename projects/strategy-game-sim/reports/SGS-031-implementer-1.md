# SGS-031 implementer pass 1

- Ticket: SGS-031 (build/move handlers, landmark ages, auto-houses)
- Branch: sgs-031-aoe4-build-move-ages (base origin/main a714a23)
- Tip: 1d514eedac3ac5b6a259febb519c5f83403d5fea (author choinickolas@gmail.com)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-031-aoe4-build-move-ages
- Status: needs_spec

## Files
- lib/aoe4-build-order/simulate.ts: build and move handlers, Construction start/complete, landmark age advance with the ages array, villagerWalk, productionSeconds and supplyOf extracted, auto-houses phase (demand, gate, builder source, affordability wake-up) last in runInstant. No new exports.
- lib/aoe4-build-order/houses.ts (new): planAutoHouse and HouseDemand.
- lib/aoe4-build-order/simulate-construction.test.ts (new, 33 tests).
- lib/aoe4-build-order/houses.test.ts (new, 7 tests).
- lib/aoe4-build-order/simulate.test.ts: Seam only. withHandler restores a previous handler, the no-handler test covers only research, and a build-registered assertion was added.
- docs/aoe4-build-order.md: Ages and landmarks, Construction (build, move), Houses and supply, step-life wording, CivRules sentence.

## Results
- tsc --noEmit: OK. No codegen. next build: OK (exit 0).
- vitest: 587 passed, 8 failed (595). All 8 failures come from the auto-houses default (`autoHouses: true` in validate.ts). With the default flipped to false temporarily, they all passed; the flip was reverted.
  - simulate.test.ts: default English start (villagers 0/20/40 until supply 10), same instant routes, rally scope walks, produce waits on supply, civ rules supplyProvider.
  - simulate.acceptance.test.ts (owned by the acceptance gate): wood-only timeline banks wood, wood-only stops at supply, generated invariants (villagersAndScouts + MAA <= 3).

## Why needs_spec
The ticket says the SGS-030 tests stay green and unchanged except Seam. It also makes auto-houses on by default, and its own fallback criterion expects 6 villagers at 120 s with default inputs, while the SGS-030 tests expect supply to block at 3. Both cannot hold. Proposed fix: pin `autoHouses: false` in the inputs of those 8 tests. The 5 unit tests could go in this branch; the 3 acceptance tests belong to the acceptance gate. I did not edit them.

## Mutation checks (all killed, all undone, tree clean before commit)
Each mutant below made at least one new test fail, beyond the baseline 5.
- M1 no spend at build start
- M2 construction ignores builders
- M3 walk ignores moveSpeed
- M4 builders stay on node
- M5 builders not counted alive
- M6 no instance at completion
- M7 builders return to from
- M8 no builder check
- M9 no build reserve
- M10 no age check on build
- M11 any landmark advances
- M12 hook after age
- M13 completed at return
- M15 move skips count check
- M16 move completed at start
- M17 gate always open
- M18 gate on first house step
- M19 no fallback source
- M20 tie goes to later node
- M21 house checks wood only
- M22 no house wake-up
- M23 house honors reserve
- M24 demand counts villagers only
- M25 no pending supply
- M26 no maxPopCap room (also houses.test)
- M27 zero house supply unchecked
- M28 lead without construction
- M29 house builders return to the source input
- M30 house supply ignores supplyProvider
- M31 demand ignores production speed: survived at first; the test "project the demand at the modified production speed" was added and now kills it
- M32 auto-house phase removed
- M33 withHandler always deletes (seam)
- M34 ages truncated to the start age

## Invariants
- A1 determinism, no clock: upheld. No clock or random calls. A source-shape test covers houses.ts, and the determinism tests compare repeated runs.
- A2 never negative, cost at start: upheld. Build and house costs are paid at the start through affordable/spend. Builders come off the node and return after the walk. The generated-invariants acceptance test fails only on its population bound caused by the auto-houses default, not on negativity.
- A3 ordering: upheld. Completion order is: instance, onBuildingComplete, age advance, onAgeAdvance, markCompleted, return walk. Auto-houses run last in the instant.

## Deviations
- houses.ts checks `shortfall <= 0` instead of RESOURCE_TOLERANCE. That constant is not exported from simulate.ts, and exporting it would break the no-new-export rule; a literal would break the literal rule.
- `currentUnitEntry` is a local helper. If SGS-032 merges first, swap it for `resolveUnitEntry`, as the ticket notes.

## Out-of-scope findings
None beyond the default conflict above.
