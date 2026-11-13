# SGS-154 implementer report 1

- Ticket: SGS-154. Branch: `sgs-154-unpinned-aoe4-acceptance`. Tip: `9fa4c168202efa1f95d31e431cd73b77f558a550` (one commit on f55e0aa).
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-154-unpinned-aoe4-acceptance`
- Status: needs_review

## Files touched (all under acceptance/)
- `aoe4-simulate-api-edges.spec.ts`: item 1 test; imports `schemas` from `./openapi-schemas` (key list from `SimulationResult.properties`).
- `aoe4-simulate-api-markers.spec.ts`: item 2 test; local `Body.steps` type gains `startedAt`.
- `aoe4-simulate-api-veterancy-conversion.spec.ts`: restored (item 3), two tests, local per-baseId sum helper `finalCountOf`.
- `aoe4-simulate-api-spear-longbow-build.spec.ts`: item 4 (2 tests, 1200 and 3600); `Result` regains `steps`.
- `aoe4-simulate-api-triggers.spec.ts`: item 5 test.
- `aoe4-simulate-api-depletion-engine.spec.ts`: item 6 a/b/c; `Result` gains `gathered`, `spent`, `unitsProduced`.
- `aoe4-simulate-api-spend-population.spec.ts`: item 7 test; import adds `INFINITE_NODES`.

## Pre-existing tests edited
None. Only local type/import lines were extended (above); no assertion or expected value changed or deleted.

## Tests
- 7 specs I touched: 132 passed, 0 failed (incl. 10 new tests).
- Full `npm run acceptance`: 1115 passed, 2 failed, both pre-existing and unrelated: `aoe4-results-split.spec.ts:41` (chart ids) and `aoe4-build-order-step-band.spec.ts:143`. Both fail identically at f55e0aa in a detached probe worktree (probe removed). results-split also fails at newer origin/main 5371c25; step-band passed there.
- `npm test`: 2512 passed, 15 skipped. `npx tsc --noEmit` clean; `npm run lint:dup` 0 clones; `npx next build` ok. Codegen: not set.
- Invariants encoded: A3 (all assertions are relations over the response/build JSON or run-to-run); A2/A3 adjacent upheld; no product, doc, or data file touched.

## Doc/comment claims added
- `edges`: "A larger count could hit the population cap before the horizon." (precondition at `toEqual([... count: 3])`; ticket-stated; autoHouses default).
- `edges`: "The default villager order keeps producing after the step, so the end may exceed the step count." (asserted as `>= 3`).
- `depletion-engine`: "The default villager order pays food, so the bank alone rises by less than the stock." (asserted by floating+spent equals stock); "The producer's rally persists, so villagers the default order makes later also walk to the dry node." (asserted by the `<= villagers` bound); "The two runs differ by float rounding, so deep equality on depletedAt would flake." (ticket-stated, asserted by 1e-6 tolerance).
- `spend-population`: "Continuous producers pay ahead of spawning, so the spend is not exactly the produced count times the cost." (asserted `>=`).

## Pinned outputs
None. Literals are inputs only: produce count 3, 40, 2; stocks 601, 100, 300; horizons 1200, 3600, 1800; `walkSeconds: 5`.

## Mutation checks (all undone; `git status lib` clean afterwards)
- item 1: dropped `productionBuildings` from the result (`simulate.ts` ~1023): `toEqual` on keys at edges spec line 53 failed.
- item 2: removed `state.markers.push(researchMarker(...))` (`research.ts:27`): `toContain(tech)` after-horizon failed. The before-horizon "no marker while in-progress" branch was not mutated (no cheap engine break reaches it).
- item 3: removed `convertUnits(state, entry)` (`research.ts:25`): `upper.counts[after] > 0` and the final-sum equality failed.
- item 4: `armedAt = engine.time + 1` (`simulate.ts:516`): `armedAt` toBe(681) got 682.
- item 5: runOutWarning severity forced to `'warning'` (`depletion.ts:123`): severity assertion failed for gold.
- item 6a: gathered credit times 0.5 (`simulate.ts:774`): gathered rise 300.5 vs 601.
- item 6b: `idleVillagers: count` instead of accumulating (`depletion.ts:112`): `>= COUNT` got 1.
- item 6c: deposit 2 `amount` forced to 1 only when gold is infinite (`depletion.ts:166`): `second.amount` got 1 vs 300. (A first mutation affecting both runs equally passed, as expected; replaced by this one.)
- item 7: `spent += 1 + cost` (`engine-common.ts:33`): `spent.villagers % cost` got 43.

## Invariant check
A3 upheld (no wall-clock or run-to-run dependence). No other adjacent invariant touched.

## Unverified assumptions added
None.

## Out-of-scope findings
- Pre-existing acceptance failures at f55e0aa: `acceptance/aoe4-results-split.spec.ts:41` (chart id list mismatch) and `acceptance/aoe4-build-order-step-band.spec.ts:143` (reproducible at f55e0aa, passed once on 5371c25, possibly flaky).
- Shared scratchpad collision: another agent overwrote `scratchpad/mutate.py` (it mutates the sgs-151 worktree's `blob-fake-test-helpers.ts`). My loop invoked it three times before I noticed, so it ran those mutations and restored the original content in the sgs-151 worktree. Its `git status` there looked intact, but the other agent should confirm its helper file was not clobbered mid-edit. I switched to a uniquely named script.
- Ticket note: item 4 asserts `armedAt` against the trigger seconds and `startedAt - trigger.seconds` for the breakdown, equivalent to the ticket's `armedAt` form since armedAt is asserted equal first.
