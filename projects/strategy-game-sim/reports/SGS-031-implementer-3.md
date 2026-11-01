# SGS-031 implementer 3: integration rebase onto origin/main (ce342db)

Status: **needs_spec**. Rebase done and conflicts resolved, but two SGS-032 tests fail with auto-houses on by default. Per the manager's rule 3 I did not edit them, did not run `next build` or `acceptance`, and made no new commit beyond the rebase.

## Branch

- Branch `sgs-031-aoe4-build-move-ages`, worktree `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-031-aoe4-build-move-ages`.
- Before: bde78f2 (1d514ee, bde78f2 on a714a23). After the rebase: **13ec441** (37703f7 "Simulate build and move steps, landmark age-ups and auto-houses", 13ec441 "Pin auto-houses off in engine tests that assert the supply stop") on ce342db. Kept as two commits. Nothing pushed. bde78f2 is still reachable by SHA if the manager wants the branch put back.
- Conflicts came up only while applying commit 1 (1d514ee). Commit 2 applied cleanly. `simulate.acceptance.test.ts` had no conflict.

## Hand-resolved hunks (all in 37703f7)

1. `lib/aoe4-build-order/simulate.ts`, the `stepHandlers` literal: merged to `{ produce, pause, rally, research: researchHandler, build, move }`. The build/move code from SGS-031 (spend, villagerWalk, Construction, startConstruction, completeConstruction, build, move) is kept word for word above it.
2. `lib/aoe4-build-order/simulate.ts`, the result literal at the end of `simulateBuildOrder`: `ages: engine.ages` (SGS-031) plus `notes: researchNotes(order, data)` (SGS-032). Git had already auto-merged the removal of the `startAge` const.
3. `lib/aoe4-build-order/simulate.ts`, the rewire. It sits outside any conflict hunk, but I edited it in the same resolution:
   ```diff
   -// Tier choice by researched upgrades is not modeled yet: the lowest-age entry.
    function currentUnitEntry(unit: string, state: EngineState): SnapshotEntry | undefined {
   -  return state.data.byBaseId.get(unit)?.[0];
   +  return resolveUnitEntry(unit, state);
    }
   ```
   The `resolveUnitEntry` import was already present from SGS-032 (`import { researchHandler, researchNotes, resolveUnitEntry } from './research'`). research.ts imports simulate.ts for types only (`import type`), so there is no runtime cycle and no TDZ risk.
   Evidence: `git grep -n currentUnitEntry -- lib/aoe4-build-order/simulate.ts` gives exactly 2 lines (463 definition, 473 the call in `houseDemand`). `grep -c "resolveUnitEntry(" simulate.ts` gives 3 (produce handler at 256, payOrder at 417, the wrapper at 464).
4. `docs/aoe4-build-order.md`, the step-completion paragraph (around l.545): merged to "`rally` and `pause` complete the instant they start; `build` completes when the building does, `move` when its villagers arrive, and `research` when its research time ends." The other doc hunks (veterancy tier text from SGS-032, ages text from SGS-031) auto-merged.
5. `lib/aoe4-build-order/simulate.test.ts`, `withHandler`: I took main's (SGS-032) body, which saves the handler and deletes it only when `saved === undefined`. It behaves the same as SGS-031's `had`/`previous` version, and taking it keeps the diff against main smaller.
6. `lib/aoe4-build-order/simulate.test.ts`, the `handler seam` describe:
   - dropped main's `leaves build and move waiting and blocking` test;
   - dropped SGS-031's `leaves research waiting and blocking` test, because SGS-032's delete-and-restore research test replaces it;
   - kept SGS-032's `leaves an action with no registered handler waiting and blocking` unchanged;
   - kept SGS-031's restore assertions in `starts a step through a registered handler` (`registered` saved, `expect(stepHandlers.build).toBe(registered)`).

   `git diff origin/main -- simulate.test.ts simulate.acceptance.test.ts` shows only the seam edits above plus the 8 `autoHouses: false` pins.

## Checks run

- `npm ci`: ok (Node v24.22.2).
- `npx tsc --noEmit`: pass.
- `npm test`: **2 failed | 650 passed (652)**. 1 file failed, 23 passed.
- `npx next build` and `npm run acceptance`: not run, because I stopped on the needs_spec rule.

## needs_spec: SGS-032 tests that fail with auto-houses on by default

Both are in `lib/aoe4-build-order/research.test.ts` > `technology effects apply from completion`, a describe that shares `result = run([wheelbarrow], { game })` and `plain = run([], { game })` with default inputs (`autoHouses: true`):

- `leaves gather rates unchanged before completion and applies the tech after it`: `expected 10 to be close to 9`. The sheep-gatherer count derived from `plain` at t = 95/120/300 is no longer 9.
- `changes neither population nor units produced`: `result.unitsProduced` differs from `plain.unitsProduced`. Paying the wheelbarrow's 50 wood shifts when auto-houses start, so villager production differs between the two runs.

Diagnosis (temporary local edit, reverted, never committed): passing `inputs: inputsFor(game, { autoHouses: false })` to those two shared runs makes all 34 research.test.ts tests pass. So auto-houses alone cause the failures, not the merge resolution. The fix is the same kind of pin the ticket allows for the 8 SGS-030 tests, but this ticket's Scope section 5 and final criterion allow pins only on those 8 named SGS-030 tests and no SGS-032 test. A respec has to add this describe's two shared runs to the allowed pins, or else decide that the assertions change.

## Invariants

The resolutions keep both sides' logic unchanged except the one-line rewire. A1/A2/A3 behavior is the same as reviewed at bde78f2. Demand now uses the tier the engine pays at.

## Out-of-scope findings

None.
