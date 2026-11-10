# SGS-111 review 1

- Branch `sgs-111-drop-house-gate`, tip 3844378 (local only; `origin/sgs-111-drop-house-gate` does not exist, so I reviewed the local ref), base origin/main 68dd089.
- Full review. Worktree `worktrees/review-sgs-111-drop-house-gate` (removed after review).

## Verdict: REQUEST CHANGES

There is one blocking finding, and it is a text-only fix. The engine, the model, the ordering, OpenAPI, the tests and the data retune are sound.

## Blocking findings

1. `docs/aoe4-build-order.md:332-334` - contract (text). The diff adds the sentence "The planner counts a house under construction in its headroom whichever kind it is, so an explicit step that starts after auto-houses already cover the demand adds a surplus house."
   - **Why the code contradicts it.** `planAutoHouse` (`lib/aoe4-build-order/houses.ts:22-23`) adds to headroom only the pending builds with `completesAt <= state.time + lead`. An explicit house that finishes after the lead is not counted when it starts. Examples are a 1-builder step when `houseBuilders` > 1, or a longer walk. In that case the planner can still start an auto-house for the same demand. The implementer's Doc claims section admits this case, but the sentence still says a house under construction is counted.
   - **Why it matters.** A reader will believe an explicit house always suppresses an auto-house.
   - **Direction.** Replace the sentence verbatim with:
     "Whichever kind it is, a house under construction that finishes within the lead counts toward the planner's headroom, so an explicit step that starts after auto-houses already cover the demand adds a surplus house."

## Spec gaps

None.

## Focus areas the manager asked about

### Knight/Longbow retune (`data/aoe4-build-order/builds/english-knight-longbow.json`)

**Scope: within the ticket.**
- I confirmed the bar breaks. With the old data on the new engine, `builds.test.ts` fails with `floating gold: expected 2912.62 to be less than or equal to 2000`.
- The ticket's parenthetical names "no step waiting / not reached, no idle villager". However, AC12 requires every prebuilt build to meet "the existing bar in its specs", and the ticket names `builds.test.ts` among the specs to rerun.
- The only other ways out were raising `MAX_FLOATING_AT_1200` (changing a bar the ticket does not mention) or failing the suite. A data-only retune is the A1-compliant route.

**Intent: preserved.** The build is still the same opening into a King's Palace Castle with knights and longbowmen. I measured main (old engine and old data) against the branch:

| at | main | branch |
|----|------|--------|
| King's Palace start / done | 539.4 / 764.4 | 551.5 / 776.5 |
| 1200 s, villagers / knights / longbows | 76 / 31 / 50 | 81 / 31 / 67 |
| 1200 s floating (food / wood / gold) | 63 / 1177 / 1878 | 383 / 1954 / 11 |
| 1800 s, villagers / knights / longbows | 88 / 41 / 64 | 85 / 36 / 72 |

- The 12 s later palace comes from the engine change, not the retune: old data on the new engine gives the same 551.5 / 776.5.
- Knights at 1200 s are unchanged.
- Knights at 1800 s drop from 41 to 36. Both runs are at the 200 population cap by 1800 s, so this is a composition shift: more longbowmen fill the cap first. Gold is not the limit (4215 gold floats at 1800 s).
- The README's old rationale "they stay on gold after the palace starts, because the knights need it" is gone. The README now describes the new behaviour accurately.
- The wood float of 1954 sits 46 under the 2000 cap, which is fragile. I agree with the implementer's note on this.
- All three edits are data-only: the step 28 rally `gold` to `wood`, step 45 `time` 722 to 740 with `then: farm`, and steps 56-59 `then: farm`. The commit message's "12:20 and 15:42" correctly match 740 s and 942 s.

### OpenAPI warning-code removal (public surface)

The ticket and design (Removed contracts M7.8) explicitly call for this, so it is in scope.
- **Schema.** `SimWarning.oneOf` now holds exactly `node-depleted`, `idle-arrival`, `farm-idle`, `step-stuck`. Each remaining variant is intact.
- **Descriptions.** The `warnings` description keeps its other sentences and drops the sort tail.
- **Leftovers.** There is no leftover `$ref`, discriminator or example. The only remaining "auto-houses" string in openapi.json is the unrelated payment-kind description at line 4126.
- **Consumers.** No UI component switches on warning codes; `step-stuck` appears only in `depletion.ts`, `model.ts` and `simulate.ts`.
- **Contract spec.** It asserts the four-code list and the reduced `WarningKeys` tuple, and it passes.

### Changed pins

- **`simulate-construction.test.ts` "plan from the start alongside explicit build-house steps"** (formerly "stay off until the last build-house step has started"). This test covers the changed behaviour, so taking engine values is correct.
  - It checks the rule directly: with only a late house, villagers at 200 s equal the no-house run (20, was 13 held).
  - Houses at 0 and 30 s are unchanged ([20, 50, 320], 40 villagers).
  - `autoHouses: false` stays at 33.
  - Late at 300 now gives [20, 220, 320], with 24 villagers at 240 s and 30 at 300 s. It was 23/23 held, and now an auto-house completes at 220 s.
  - All values are consistent with the rule.
- **`simulate-construction.test.ts` palace population(660) 44 → 47.** The subject is the long build in flight, not the gate. The value moves with the new engine and the retuned build data, so it cannot be pinned back to the old setting. The rule assertion population(760) > population(660) is kept. Acceptable.
- **`research.acceptance.test.ts` veteran longbowmen** (9 → 20 tier-2, window (835, 840] → (840, 845], tier-3 at 1800 s 64 → 72). This test reads the knight prebuilt, so the ticket's "update each pinned number to the value the engine now returns" applies. It still asserts the window first, then that every tier-2 unit converts at completion. The new completion time is 843.16, inside (840, 845]. Correct.

## Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | late house fixture: off run held before 600, on run keeps rising, auto-house before late step | pass | `simulate-house-gate.test.ts:61-73`. I ran the file against origin/main's `simulate.ts` and the on-run assertion fails (`expected 30 to be greater than 30`). |
| 2 | no `auto-houses*` code; restoring the gate fails the production assertion | pass | same run: "reports no auto-houses warning" fails with `['auto-houses-held']`, and the production assertion fails as above |
| 3 | no-house order planned as before, pinned | pass | `done` [120, 220, 320] and digest `679240f54895c11f` both pass on the origin/main engine (verified) |
| 4 | never-firing reaction house no longer stops auto-houses | pass | `simulate-house-gate.test.ts:94-104`; fails on the old engine (`expected [] to equal [120,220,320]`) |
| 5 | explicit house at the planner instant counted as under construction | pass | `simulate-house-gate.test.ts:106-111`. The implementer's `houseDemand` mutation produced an extra house. I did not re-run that mutation. |
| 6 | `autoHouses: false` blocks at supply until an explicit house | pass | off fixture `done` [20, 620]; `simulate-construction` off = 33; `aoe4-simulate-api-waits.spec.ts` population case |
| 7 | determinism (A3) | pass | `simulate-house-gate.test.ts:80-83` |
| 8 | removed-name grep clean | pass | `git grep` over the whole tree for the eight names plus `supplyBlocked`: no match |
| 9 | `SimWarning` and OpenAPI have the four codes; contract spec asserts them | pass | `model.ts:159-163`, openapi `oneOf`, `aoe4-simulate-api-contract.spec.ts:133` |
| 10 | `sortWarnings` order; farm-idle/step-stuck swap fails the table | pass | the table now includes `farmIdle(10)` between node warnings and `stuck` at at=10, so a rank swap reorders it |
| 11 | docs and README state the new rule, with no removed codes or gate | pass (with blocking finding 1 on one sentence) | doc lines 331-335, 419-420, 778-790; README 111-116 |
| 12 | every prebuilt meets its bar; spear-longbow unchanged | pass | `builds.test.ts` passes; spear (`60e54bd7196e39e7`) and 1TC (`32a982d42fa1e689`) 1800 s digests are equal to main's (verified on the old engine) |
| 13 | unit, tsc, lint:dup, contract, acceptance pass | pass | I ran each: `npm test` 62 files / 1842 passed / 10 skipped; tsc clean; jscpd 0 clones; `npx playwright test` 861 passed; `npx next build` passes |
| 14 | no invariant regressions | pass | see below |

## Invariants touched

- **A1 holds.** No literal enters the engine. The retune is in build JSON only.
- **A2 holds.** The auto-house payment path (`canAfford`, then `engine.needs` or `startConstruction`) is unchanged. Only the gate condition left the early return.
- **A3 holds.** Nothing nondeterministic was added, and the determinism test passes.
- **S3 holds.** No new input.

## Contract, scope, checklist

- **Key surfaces.** Names match: the only surface change is the removal of the two SimWarning variants, which the design names.
- **Seams.** No design seam is closed.
- **Scope.** The diff stays within the ticket and CONTEXT.md Out of scope: no `golang/`, no build-259 data, no `planAutoHouse`, `houseDemand` or `houseBuilderSource` change, no UI.
- **Invented constants.** None.
- **Removed code.** `supplyBlocked` and its three writers are removed, as the ticket conditions. `isReaction` and `formatMinSec` are still used (`simulate.ts:532, 547, 924, 1010`).
- **Comments.** The `runInstant` comment ("A step refused for supply in the first pass is offered again after this instant's houses complete") is still accurate.
- **Commit message.** No ticket ids or process history.

## Linter

`npx tsc --noEmit && npm run lint:dup`: clean, 0 clones.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty. There is no bot to run.

## Non-blocking notes

1. `lib/aoe4-build-order/simulate-house-gate.test.ts:89` - shipped-artifact hygiene (text). The test name "plans an order without build-house steps as it did with the gate" refers to removed behaviour that a reader of `main` cannot see. Suggest: `'plans an order without build-house steps exactly as before'`, or simply `'plans an order without build-house steps'`.
2. `lib/aoe4-build-order/simulate-house-gate.test.ts:63` - `expect(population(off.result, hold)).toBe(population(off.result, 595))` cannot fail: `heldSince` is defined as the first sample at which population equals its value at 595. The test still fails for real through `hold < 535` and `done`, so drop this line or replace it with a check of the waiting step or order.
3. `lib/aoe4-build-order/simulate-construction.test.ts:314-320` - `expect(done.slice(0, 2)).toEqual([20, 50])` is subsumed by the next line. Also, `twoSteps` is now used once, while `both` and `late` repeat its `run(...)` shape inline because they need `rules`. Give `twoSteps` a `rules` parameter and use it for all three.
4. `lib/aoe4-build-order/simulate-house-gate.test.ts:29-34` - `withHouses` re-implements `housesDone()` from `simulate-construction.test.ts:285`, and `twoTowns` and `woodStart` are duplicated in both files. The duplication of `twoTowns` and `woodStart` already existed. Consider moving them to `test-helpers.ts` in a later change.
5. `simulate-house-gate.test.ts:107` - `none.done[0] - 20` hard-codes the 20 s house build to derive the planner's start instant, without first asserting that the no-house run starts its first auto-house at that instant. It works today, and the mutation proves it. A data change to house build time would fail it loudly via `startedAt`, so this is acceptable.
6. Knight/Longbow tuning is fragile: wood floats 46 under the 2000 cap at 1200 s. Step 44 (the 12:00 rally to wood) is now redundant. The README acknowledges this.

## Out-of-scope findings

- `data/aoe4-build-order/README.md:122` (knight paragraph) says "the Town Center rally to farm", but the build has no TC rally to `farm`. This is pre-existing and was not introduced by this diff.

## Coverage

- **Reviewed.** Every file in the diff (15). Also `houses.ts` (`planAutoHouse`), `test-helpers.ts`, and the surrounding parts of `simulate.ts`, `simulate-construction.test.ts` and `research.acceptance.test.ts`.
- **Runs.**
  - Old-engine runs of the new house-gate tests.
  - A new-engine/old-data run of `builds.test.ts`.
  - A scratch comparison of the knight build across main, new engine with old data, and branch at 600, 900, 1200 and 1800 s. The scratch file was deleted.
  - Full unit suite, lint, full acceptance (861) and `next build`.
- **Not done.**
  - REPO.md Every diff: no page or component is in the diff, so I did not load pages by hand. The full acceptance suite exercised the touched pages through `next dev`.
  - AoE4 checklist: no UI change, so no screenshots were needed.
  - Not reviewed: nothing.
