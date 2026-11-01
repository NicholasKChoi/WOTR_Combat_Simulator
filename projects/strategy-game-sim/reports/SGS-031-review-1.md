# SGS-031 review 1 (full)

Branch `sgs-031-aoe4-build-move-ages` @ bde78f2 (1d514ee feature, bde78f2 eight `autoHouses: false` pins), base origin/main a714a23 (the merge-base). Diff: 7 files, +933/-48. The logic is about 200 LOC, under the 400-line split bar.

## Verdict: APPROVE

## Blocking findings

None.

## Spec gaps

None blocking. One deviation the spec owner should write down (note 1).

## Gates run (review worktree, bde78f2)

- `npm ci` ok; `npx tsc --noEmit` exit 0; `npm test`: 22 files, 595 passed; `npx next build` exit 0; `npm run acceptance`: 209 passed.
- Lint: the repo's `commands.lint` gate is tsc + build, and both are clean. `prettier --check` flags test-file formatting, but that is not a gate and is pre-existing.
- Review bot: `reviewBot.cli` is empty and there is no `rulesFile`, so there was no bot run and nothing to reconcile.
- Greps: there is no `Math.random|Date.now|new Date|performance.now` in simulate.ts, civ-rules.ts or houses.ts. houses.ts exports exactly `HouseDemand` (l.7) and `planAutoHouse` (l.17). The only new simulate.ts surface is `stepHandlers.build` and `stepHandlers.move`, with no new export. `currentUnitEntry` appears on exactly 2 lines (469 definition, 479 call). The only numeric literals added to simulate.ts are 0 and 1; the landmark class pattern is exempt. The three docs greps ("back to back", "overrides auto-houses", "taken from .wood.") find nothing.

## Acceptance criteria

All 24 pass. Evidence is in lib/aoe4-build-order/simulate-construction.test.ts (cited by line), houses.test.ts and the greps above.

- Build timing and cost: pass (l.113-135).
- Builder income dip and return: pass (l.137).
- Builders count as alive: pass (armedAt 20, l.148).
- Supply and instances, maxPopCap 30 gives 23: pass (l.156).
- New producer, held rally, produce-before-build, lumber camp: pass (l.199-245).
- Hooks order: pass (l.258). Completion order in code: addBuildingInstance, then onBuildingComplete, then the age advance (only when `entry.age === state.age` and the class matches the landmark pattern), then the `ages` push, then onAgeAdvance, then markCompleted.
- Ages runs 1 and 2: pass (l.278-298).
- Age-blocked re-check and paid items: pass (l.300).
- A2 and reserve: pass (l.175).
- Builders unavailable: pass (l.167, l.333).
- Move: pass (l.320).
- Auto-houses never block (20/13/13, wood 15 vs 16 at 105): pass (l.357, l.370).
- Suppression gate (40/33; late case 23/23, completes at 320): pass (l.369 onward).
- Auto-house inputs (gold source with 2 builders, zero supply, maxPopCap 2 houses): pass (l.387-415, houses.test).
- Builder-source fallback and tie: pass (l.417, l.433).
- Four-resource house cost: pass (l.440).
- No node has enough gatherers: pass (l.457).
- Reservation ignored: pass (l.475).
- A3/A1 determinism and data sensitivity: pass (l.516-547 plus greps).
- Exports: pass (houses.test l.85-98 plus greps).
- Demand lookup (currentUnitEntry, every producer, 43.95): pass (l.493, l.504).
- Performance: pass (l.549). Probes I ran separately took about 17 ms for a 3600 s run.
- Docs: pass. The required statements are present and match design/M2.md's Auto-houses block, Follow-ons and Priority rows.
- (respec 3) Tests and tsc green, `INPUT_DEFAULTS.autoHouses` still true, SGS-030 tests unchanged except the allowed edits: pass. The Seam test is edited as Scope section 5 says. Each of the eight pins only adds `autoHouses: false`, and the generated-invariants test keeps its `<= 3` bound. One pin, civ rules > supplyProvider, sits inside an `expect(` line: `countAt(def, ...)` became `countAt(run([], { inputs: inputsFor(data, { autoHouses: false }) }), ...)`. This is equivalent to pinning `def` (`def = run([])`). Pinning `def` itself would have broken the "defaults to the english rules" `toEqual`. The criterion allows "changed lines that add autoHouses: false", and that is all this line changes; no expected number changed. Ticked.

## Invariants

- A1 (data-driven): holds. Costs, times, supply, builderScaling, moveSpeed and age all come from `GameData`. Changing them in a test changes the output (l.516-547).
- A2 (no negative floating): holds. `affordable` with RESOURCE_TOLERANCE runs before every `spend`, and `spend` clamps at 0. Auto-houses check affordability and push their cost onto `needs` for wake-up. Zero income yields an Infinity wake-up, which is filtered, so there is no busy loop.
- A3 (determinism): holds. There are no clocks or randomness. Node order comes from GATHER_NODE_ORDER. Ties on the builder source go to the earlier node because the comparison is a strict `>` (houseBuilderSource, simulate.ts:494). Phase 5 auto-houses run last in runInstant (l.524-530).

## Non-blocking notes

1. houses.ts:28 uses `if (shortfall <= 0) return 0` rather than the ticket's "the engine's one tolerance constant applies to shortfall > 0". The engine's RESOURCE_TOLERANCE is not exported, and exporting it would break the no-new-export criterion, so the spec forces this deviation. Under brute-force probes float noise does appear (pps*lead = 3.0000000000000004 with 3 villager producers). Even so, house start times were identical with a `<= 1e-9` patch, for example [160, 220, 280] in the three-TC scenario. Worst case, sub-1e-15 noise starts a house one payment early. Suggest the spec owner record the deviation in the ticket, or move the tolerance into a shared non-exported-surface module later.
2. Edited data only: with a house build time of 0 and walkSeconds 0, the lead is 0, so `shortfall > 0` can never hold before population reaches supply. Auto-houses then never start and production stalls at supply. A probe showed the stall at 3 villagers. The shipped data cannot reach this.
3. The strict `>` in the planner leaves an exact fit unplanned. When the lead equals the production period this produces a 20 s supply stall: in the three-TC probe, population hit supply 30 at 140 and the house built 140-160. That matches the spec's arithmetic and is not a bug, but it is worth knowing when tuning the lead rule.
4. simulate.ts:22 GATHER_NODE_ORDER is an exact copy of parse-text.ts:12. A shared constant in model.ts would avoid drift. It is convention, not correctness, since both derive from `satisfies Record<GatherNodeId, 0>`.
5. simulate.ts:24 builds LANDMARK_CLASS with `new RegExp('^age[1-3]_landmark\\d$')` where a regex literal would be idiomatic. This was presumably done to stay clear of the literal grep, which the respec exempts anyway.
6. simulate.ts:299 `spend` repeats payUnit's per-resource loop (l.236-238). payUnit could call `spend`.
7. houses.ts copies the HOUSE/VILLAGER id constants and the moveSpeed multiplier computation from simulate.ts (`villagerWalk`). It cannot import them without new exports. This is acceptable for now, but it is a drift point.
8. docs/aoe4-build-order.md: "Builders walk `inputs.walkSeconds` each way" leaves out `/ moveSpeedMultiplier`. The task-switch walk section covers it.

## Out-of-scope findings

None. I checked whether the SGS-030 engine terminates with 0-time or 0-popcap units: the runs are bounded (zero-time villager, 3600 s: 13 ms, 193 villagers, capped by maxPopCap; popcap-0 villager: 1 ms).

## Coverage

I reviewed all 7 changed files: simulate.ts, houses.ts, houses.test.ts, simulate-construction.test.ts, simulate.test.ts, simulate.acceptance.test.ts and docs/aoe4-build-order.md. The REPO.md `### Every diff` page-load step does not apply because no page or route is touched; the AoE4 page is out of scope. REPO.md's Review checklist has no section whose `Paths:` cover lib/aoe4-build-order. I did not rewire to SGS-032's `resolveUnitEntry`, as instructed; that waits for the post-merge rebase.
