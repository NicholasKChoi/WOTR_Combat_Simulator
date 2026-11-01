# SGS-027 implementer 1

- Ticket: SGS-027 (AoE4 effect interpreter, gather trip model, builder scaling), risk high
- Branch: sgs-027-aoe4-effects-gather-construction, tip ea51a21 (one commit on origin/main 68e004a), not pushed
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-027-aoe4-effects-gather-construction
- Status: **needs_review**

## Files touched
- lib/aoe4-build-order/effects.ts: added `EffectState`, `ModifierTarget`, `modifiedValue`, plus private helpers (`hasBuilding`, `isGranted`, `activeEffects`, `selects`, `conditionWeight`). The existing exports are unchanged.
- lib/aoe4-build-order/gather.ts (new): `effectiveGatherRate(node, state, inputs)`, per villager, resource per second.
- lib/aoe4-build-order/construction.ts (new): `constructionSeconds(baseSeconds, builders, data)`, throws a RangeError naming the value.
- lib/aoe4-build-order/modified-value.test.ts (new): tests for `modifiedValue`. I put them in a new file so that effects.test.ts stays unchanged, as the ticket requires.
- lib/aoe4-build-order/gather.test.ts (new): tests for the trip model, the technologies, the calculator cross-check and determinism.
- lib/aoe4-build-order/construction.test.ts (new): tests for builder scaling.
- docs/aoe4-build-order.md: under Overlay effects, one sentence saying change is applied before multiply and that a missing `influenceCoverage` entry counts as 0.

About 120 lines of business logic. rules/base.json is unchanged: the cross-check passes with the seeds as they are.

## Contract notes
- `EffectState` = `{ data, age, buildings, researched, coverage }`, all fields readonly. `coverage` is read with `Object.hasOwn`. `buildings` and `researched` are a Map and a Set.
- `effectiveGatherRate` reads walk and drop-off from `inputs.trips[node]` and reads rate, capacity, property lists and dropOffs from `state.data.base.gatherNodes[node]`.
- `villager` missing from `byBaseId` throws a clear Error (spec-gate note 4). A tech that has both snapshot effects and overlay rows applies both.
- Effects that are not passive, or whose effect is not change or multiply, are skipped.

## Tests
- `npm test`: 12 files, 161 passed, 0 failed. Of these, 72 are new in the 3 new files; the existing effects.test.ts, data.test.ts and data.acceptance.test.ts are unchanged and green.
- Invariants the tests encode:
  - A1: the numerator and offset, the rate value, overlay values and trip inputs all come from data or inputs. Changing them in a test GameData changes the output.
  - A3: repeated calls give identical results, and the state is not mutated. The state object is frozen, the GameData is frozen by the loader, and the Map and Set contents are checked after the call.
- Ticket acceptance criteria covered:
  - construction gives 100/75/50/30, the 4/(n+3) case works, and builders of 0, 1.5, -1 and NaN throw.
  - trip model on a GameData copy where the camp walk is 2 and the town-center walk is 10, with drop-off 1. A lumber-camp count of 0 still walks to the town center.
  - Wheelbarrow on sheep and wood.
  - Double Broadax on wood, and Shaft Mining on gold and stone but not wood.
  - farm bonus at age 2 with coverage 1 and 0.5, at age 3, with no mill, and with coverage missing (`toBeCloseTo`).
  - King's Palace producer cases.
  - select: extended-lines, class sets, id and class together, empty select.
  - change before multiply.
  - non-passive effects and other effect kinds are skipped.
  - a change is scaled by coverage, and `__proto__` coverage finds nothing.
  - every rate property of a node is chained.
  - calculator cross-check for 7 nodes within 0.05/min. The trips come from `base.gatherNodes[node].trip.*.value`, and the expected numbers are only in the test.
- The required grep for Math.random, Date.now and new Date in the three files finds nothing. Only 0 and 1 appear as numeric literals in the three files.

## Mutation checks (each applied alone, tests run, then reverted; all killed)
construction.ts:
- `builders < 1` changed to `< 0`
- the isInteger guard dropped
- the offset hard-coded to 2
- the numerator hard-coded to 3

effects.ts:
- `isGranted` with the building clause dropped, with the civ clause dropped, and with the researched clause dropped
- technology effects dropped
- the tech type filter changed
- `hasBuilding` `>= 1` changed to `>= 0`
- an empty select matching everything
- class sets combined with `every` instead of `some`, and classes within a set with `some` instead of `every`
- id OR class instead of id AND class
- the age check removed
- the producer check removed
- the undefined-producer guard removed. This one first survived; I added the test "ignores the target producer when the condition names none", and it now kills it.
- the hasOwn check dropped
- the building-exists check for nearBuilding dropped
- coverage forced to 1
- the passive check dropped
- the property check dropped
- the result computed as base*mult + change
- the coverage weighting removed from multiply, and removed from change
- any non-change effect treated as multiply

gather.ts:
- the camp and town-center walks swapped
- the moveSpeed division dropped
- dropOffSeconds dropped
- the capacity properties skipped
- only the first rate property applied
- the walk read from the rules instead of the inputs
- the dropOffs count `>= 0`

No break was committed. The working tree was clean before the commit.

## Stages
- codegen: not set in REPO.md.
- build: `npx next build` succeeded, after `npm ci` in the worktree.
- lint (`npx tsc --noEmit`): clean.
- unit: see above.
- `git diff --stat 68e004a` shows only the 7 files above, with no tool side effects.
- Node v24.22.2 matches `engines` 24.x.

## Invariant check
- A1 holds: no game numbers in the code; every value is read from the rules or the snapshot, and inputs.
- A3 holds: pure functions, no randomness or clock, no module-level mutable state.
- A2 is not touched.
- S1 holds: no imports from another app.

## Out-of-scope findings
- None blocking.
- Spec-gate note 1 is still open for the designer: `EffectState` and `ModifierTarget` are not yet listed in the design/M2.md Modules row for effects.ts.
