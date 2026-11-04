# SGS-089 implementer 1

- Ticket: SGS-089 (risk high)
- Branch: `sgs-089-aoe4-engine-guard-crashes-hangs`, base origin/main `b9481e333dc0e29731a0da063546272cae4af1bf`
- Tip: `294a9f686bb85f72935ea45d2bc44571fddfb392` (one commit, author Nick Choi <choinickolas@gmail.com>)
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-089-aoe4-engine-guard-crashes-hangs`
- Status: **needs_review**

## Files touched
- `lib/aoe4-build-order/simulate.ts`: guard in `productionSeconds` (unit entries only, positive finite); `spawnUnit` replaces `at.rally!` with a check that throws.
- `lib/aoe4-build-order/simulate.test.ts`: new `describe('invalid engine input')` (two `it.each` tables, one pair test); supply-wait test rewritten to capture the `produce` outcome; `StepStart` type import added.
- `docs/aoe4-build-order.md`: Rally rules bullet extended; CivRules seams paragraph added.

`git diff --stat origin/main`: those 3 files only, 95 insertions, 7 deletions. No tool-made stray changes (`git status` clean after build).

## Tests
- `simulate.test.ts`: 80 pass.
- `npm test`: 45 files, 1361 passed, 10 skipped, 0 failed. `research.test.ts` and `simulate.acceptance.test.ts` pass unedited.

Added or edited tests (all in `lib/aoe4-build-order/simulate.test.ts`):
- `invalid engine input > rejects a unit production time that is not a positive finite number: %s` (8 rows): villager `costs.time` 0 with autoHouses true and false; villager time/food/gold/popcap 0 with autoHouses true and false; `productionModifier` returning 0, -5, NaN; `productionSpeed` multiply 0 on `villager` (`got Infinity`). Each asserts `toThrow(new Error(<exact message>))`. Invariant: a unit's production time is positive and finite or the run fails loudly (S3 bounded time, A1 no code-made zero time).
- `invalid engine input > checks the production time of an ordered villager that is never paid while auto houses plan supply`: villager time 0, starting food 0, `start: { rally: 'sheep', villagers: {} }`; autoHouses true throws the message (only `houseDemand` reaches `productionSeconds`), autoHouses false returns with `unitsProduced` `[]`.
- `invalid engine input > rejects a villager spawn with no rally: %s` (2 rows): `run([], { start: {} })` names `capital-town-center` instance 1; starting buildings `capital-town-center` + `mill`, `start: {}`, hook `ctx.baseId === 'mill'` names `mill` instance 1.
- `produce waits > waits while the population would pass supply, without a reserve` (pre-existing, edited as the ticket's Scope directs): wraps the registered `produce` handler with `withHandler`, collects outcomes, asserts at least one `started === false && waitingOn === 'population'` outcome exists and none of them has a `reserve` property; keeps `result.steps[0].status === 'waiting'`. The `floating.food > 65` assertion was removed (and `sampleIndex` is still used elsewhere). Ticket rule: Scope bullet "The weak assertion".

## Mutation checks
All run in a throwaway detached worktree at `294a9f6` (removed afterwards), each with `git checkout -- .` between them.
1. Guard moved from `productionSeconds` into `startHead` only: `checks the production time of an ordered villager that is never paid...` fails ("expected function to throw an error, but it didn't"). Undone.
2. `entry.type === 'unit' &&` dropped from the guard: `research.test.ts` "leaves the units at the highest tier when two upgrades complete at one instant, listing no series for the tier passed through" fails (1 failed, 54 passed). Undone.
3. Guard removed entirely: rows `time 0, auto houses`, `time 0, no auto houses`, `productionModifier 0/-5/NaN`, `productionSpeed multiply 0` fail; the two `free instant villager` rows hang and were killed by `timeout 60` (exit 124), matching the ticket's "hung process, not a vitest timeout". Undone; no process left running.
4. `spawnUnit` back to `const rally = at.rally!;`: both rally rows fail with a `TypeError` instead of the expected `Error`. Undone.
5. Produce handler `return { started: false, waitingOn: 'population', reserve: costOf(entry, targets.length) }`: the new supply-wait test fails; with the base commit's `simulate.test.ts` restored on top of the same mutation, the old test passes (1 passed). Undone.

## Shipped builds (A3)
Throwaway vitest file (not committed, deleted) wrote `name + JSON.stringify(simulateBuildOrder(build, loadGameData(build.civ), inputsFor(game)))` for each `listBuilds()` entry on `b9481e3` before any edit and on the branch. `cmp`:
- `ENG 1TC`: identical
- `ENG Spear/Longbow into MAA/Crossbow`: identical
- `ENG Knight/Longbow (King's Palace)`: identical

## Codegen, build, lint
- codegen: not set.
- build: `npm ci` then `npx next build` pass.
- lint: `npx tsc --noEmit` exit 0; `npm run lint:dup` "Found 0 clones".
- `grep -n "rally!" lib/aoe4-build-order/simulate.ts`: no match.

## Doc claims
- `docs/aoe4-build-order.md` Rally rules: "If a villager spawns at a building instance with no rally anyway (an order that skipped validation, or a `villagerProducer` hook that makes a building a producer when there is no `start.rally`), the engine throws an `Error` naming the building and instance." Backed by `simulate.ts:spawnUnit` (throw with `at.baseId`, `at.instance`) and the two rally test rows. The pre-existing sentence ("The validation rules in Issues guarantee ... reports no rally error.") is kept unchanged.
- `docs/aoe4-build-order.md` CivRules seams: "`productionModifier` must return a positive finite number for a unit. When a unit's production time (`costs.time`, divided by `productionSpeed`, then passed through `productionModifier`) is not a positive finite number, the engine throws an `Error` naming the unit and the producer. The check runs when the unit's production starts and when auto houses estimate supply demand, which covers every unit an instance holds an unfinished order for, even one not yet paid. Technology and upgrade times are not checked." Backed by `simulate.ts:productionSeconds` (order of division and hook, `entry.type === 'unit'` condition), its callers `startHead` and `houseDemand` (`houseDemand` iterates every instance whose `order.remaining !== 0`), and the houseDemand pair test.
- Grep of `docs/aoe4-build-order.md`, `docs/api/openapi.json`, `civ-rules.ts` found no other sentence saying the engine never errors on these paths.
- No code comments added.

## Pinned outputs
None beyond the ticket-defined messages.

## Invariant check
- A3: three shipped builds byte-identical; full suite passes with no expected value edited (the only edited test is the one the ticket names).
- A2: no payment path touched.
- A1: no zero time is produced by code; the guard rejects instead of clamping. No numeric literal added (source-shape test passes).
- S3: the zero-cost zero-time villager now ends with an error instead of looping forever.

## Prerequisites
Node v24.22.2 matches `engines` 24.x.

## Out-of-scope findings
None new. Note for the manager: the API route has no try/catch, so either throw becomes Next's default 500; left as is per spec-gate 2.
