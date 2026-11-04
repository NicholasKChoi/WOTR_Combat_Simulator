# SGS-089: Make the simulate engine fail loudly instead of hanging or throwing a TypeError

- **Type**: Bug
- **Component**: aoe4-build-order
- **Milestone / criteria**: none (owner-chosen backlog triage 2026-11-03: engine cleanups)
- **Priority**: low
- **Risk**: high
  <!-- Rated high on the owner's instruction: the edits sit in `lib/aoe4-build-order/simulate.ts`, the
       REPO.md criticalPaths file (event loop, A3). No listed symbol (`simulateBuildOrder`, `runInstant`,
       `offerSteps`, `applyDueEvents`, `nextWake`, `affordableAt`) changes its behavior or signature; the
       edits are in `productionSeconds`, which feeds the times the event loop schedules and the auto-house
       demand, and `spawnUnit`. -->
- **Invariants**: A3 (same inputs, same timings: the new checks must not change any result that completes today), A2 (no payment path changes), A1 (a production time of zero comes from data or a hook, not from code)
- **LOC estimate**: 25 (two guards in `lib/aoe4-build-order/simulate.ts`; doc sentences; tests excluded)
- **Depends on**: none
- **On merge**: none
- **Source**: BACKLOG.md bullets on `simulate.ts` villager-producer hook (SGS-030 review), zero-time unit loop (SGS-030 tech-lead), `spawnUnit` assuming a rally (SGS-056 implementer). Re-verified by running them on origin/main `b9481e3`.

## Context

Two engine paths fail badly on input that validation normally keeps out but a direct engine call, a
`CivRules` hook, or edited data can reach. A unit whose production time comes out as 0 can keep the run
from ever returning, and a villager spawned by a producer with no rally throws
`TypeError: Cannot read properties of undefined (reading 'walkSeconds')`. Both should fail with a clear
`Error`, the way `createEngine` already does for a bad `startingState.units` id.

Checked on origin/main `b9481e3` by running them in a throwaway worktree, not only by reading:

- Hang: a villager entry edited to take 0 s, cost nothing and use 0 population makes `simulateBuildOrder`
  run forever with `autoHouses` true or false (the process had to be killed; a vitest test timeout cannot
  interrupt the synchronous loop). A villager with only `costs.time` 0 returns (supply stops it) but with
  instant production and an `Infinity` population rate in the auto-house demand. `productionModifier`
  returning `0`, `-5` or `NaN` returns with no error. No unit in
  `data/aoe4-build-order/aoe4world/english.json` has a time of 0, a cost of 0 or a population of 0; the
  only zero-time entries are `capital-town-center-1` (a building), `upgrade-king-3` and `upgrade-king-4`
  (technologies with an empty `producedBy`). The data schema allows any `costs.time` number.
- `productionSeconds` has two callers (respec 1): `startHead`, which sets `busyUntil` for the head of an
  instance's paid queue, and `houseDemand`, which adds `costs.popcap / productionSeconds(...)` for every
  instance whose order has `remaining !== 0`, whether or not that unit has been paid or started.
  `houseDemand` runs from `startAutoHouses` only when `inputs.autoHouses` is on, an English house entry
  exists and `houseGateOpen` holds; `runInstant` calls `startProduction` before `startAutoHouses`.
- The paid queue also carries research: `researchHandler` in `research.ts` pushes a `researchItem` onto
  the target's `paid`, so `startHead` calls `productionSeconds` for technology and upgrade entries too.
  A zero-time upgrade is legitimate and already tested: `research.test.ts` "leaves the units at the
  highest tier when two upgrades complete at one instant, listing no series for the tier passed through"
  sets `elite-spearmen` `costs.time` to 0 and expects both researches to complete at 50 (respec 1).
- TypeError: `simulateBuildOrder` with `start: {}` (no rally) throws the `walkSeconds` TypeError at the
  first villager spawn, because `addBuildingInstance` leaves `rally` undefined when there is no held
  rally, rally default or `start.rally`, and `spawnUnit` reads `at.rally!`. The same happens when a
  `villagerProducer` hook makes a building a producer and no `start.rally` exists for it to inherit
  (with a `start.rally`, every producer inherits it). Through the API this cannot occur, since an
  English order needs `start.rally` (`docs/aoe4-build-order.md`, Rally rules).

Dropped from the backlog bullets as no longer holding: the "redundant condition at `simulate.ts:301`"
(`'reserve' in outcome || outcome.started !== true` no longer exists in `simulate.ts`; `offerStep` and
`offerReactions` now narrow on `started === false`). The "villager-producer hook returns false for a
producer" TypeError also does not occur: a false hook leaves the instance with no villager order, so
nothing spawns; the live case is the hook returning true (covered above).

## Scope

All in `lib/aoe4-build-order/` unless named otherwise:

- `simulate.ts` `productionSeconds` (respec 1): the guard lives here, so it covers both callers. After the
  `productionSpeed` division and the `productionModifier` hook, when the entry is a unit
  (`entry.type === 'unit'`) and the result is not finite or is not greater than 0, throw an `Error` with
  the message `production time for "<entry.baseId>" at "<producer>" must be a positive finite number, got <seconds>`.
  Covers a unit `costs.time` of 0, a hook returning 0, a negative number or `NaN`, and a `productionSpeed`
  multiplier of 0 (time `Infinity`). Because `houseDemand` calls it too, the error is thrown from
  `houseDemand` as soon as an instance holds an order for such a unit while auto houses are planned
  (`autoHouses` on and the house gate open), even if that unit is never paid or started; with
  `autoHouses` off it is thrown from `startHead` when the unit's production starts. Technology and
  upgrade entries pass through unchanged (a zero research time stays an instant research). Do not clamp
  or substitute a minimum time.
- `simulate.ts` `spawnUnit`: replace `at.rally!` with a check. When the producer instance has no rally,
  throw an `Error` with the message `building "<at.baseId>" instance <at.instance> spawned a villager but has no rally`.
- Tests in `simulate.test.ts` (follow the table style of the nearest tests there; the villager entry is
  `villager-1`, edited through `editGameData` as in "follows the villager production time"):
  - production time, one `it.each` expecting the message above (respec 1):
    - villager `costs.time` 0, with `autoHouses` true and with `autoHouses` false (two rows);
    - villager `costs.time` 0, food/gold costs 0 and `costs.popcap` 0 (the input that hangs today), with
      `autoHouses` true and false (two rows);
    - `productionModifier` returning `0`, `-5` and `NaN` for a default run (message shows `0`, `-5`,
      `NaN`);
    - a `productionSpeed` effect pushed onto `parts.civData.effects` with `effect: 'multiply'` and
      `value: 0` for `villager`, as in "follows a productionSpeed effect" (message shows `Infinity`).
  - the `houseDemand` path (respec 1): with villager `costs.time` 0, starting food 0 and
    `start: { rally: 'sheep', villagers: {} }` (no gatherers, so no villager is ever paid or started),
    `autoHouses: true` throws the message above (only `houseDemand` reaches `productionSeconds`), and
    `autoHouses: false` returns without throwing and with an empty `unitsProduced`. This pair is what
    fails if the guard is moved into `startHead` only (the first row stops throwing) or if `houseDemand`
    is made to skip it.
  - rally: `run([], { start: {} })` (cast as needed, as it bypasses validation) throws the rally message
    naming `capital-town-center` instance 1. A second row (respec 1) uses `editGameData` to set
    `startingState.buildings` to `['capital-town-center', 'mill']`, `start: {}`, and a `villagerProducer`
    hook `(_, ctx) => ctx.baseId === 'mill'`, and throws the same message naming `mill` instance 1.
  - The weak assertion: the test `waits while the population would pass supply, without a reserve`
    checks only `floating.food[...] > 65`, which passes even if a supply-blocked step held a reserve
    (applying `reserve: costOf(entry, targets.length)` to the `waitingOn: 'population'` return in the
    `produce` handler leaves it green). Replace that assertion with one that fails under that mutation:
    capture the outcome the `produce` handler returns for the supply-blocked step (the `withHandler`
    seam in `test-helpers.ts`, wrapping the registered `produce` handler, as the `supplyProvider` test
    captures `s.supply`) and assert `started === false`, `waitingOn === 'population'` and that the
    outcome has no `reserve`; also keep `result.steps[0].status` equal to `'waiting'`.
- `docs/aoe4-build-order.md`:
  - Rally rules, the sentence "The validation rules in Issues guarantee a rally is in effect whenever a
    villager spawns, so the engine reports no rally error." is kept as the reason the API never hits it,
    and gains that the engine throws an `Error` naming the building and instance if a villager spawns
    without a rally (an order that skipped validation, or a `villagerProducer` hook).
  - CivRules seams: state that `productionModifier` must return a positive finite number for a unit and
    that the engine throws an `Error` naming the unit and producer when a unit's production time (data,
    `productionSpeed` or the hook) is not a positive finite number, including while auto houses estimate
    demand for an ordered unit (respec 1).
  - Grep `docs/aoe4-build-order.md`, `docs/api/openapi.json` and comments in `civ-rules.ts` for any other
    sentence that says the engine never errors on these paths and fix it.
- No change to `pages/api/aoe4-build-order/simulate.ts`: validated requests cannot reach either guard.
  If a thrown `Error` there already becomes a 500, leave that as is.

**Out of scope:** tightening `data-schema.ts` (`costs.time` is shared with buildings and techs whose
time is legitimately 0); guarding research times (a zero research time is valid; a negative or
non-finite one is a separate backlog item); changing a `startingState` or a validation rule so that a
missing rally is rejected earlier; a spawn fallback for a producer with no rally; the other backlog
bullets on `simulate.ts` or `research.ts`; clamping hook output.

## Diagrams

Changes a core control loop only by adding two throw sites, with no new transition; the state machine
and its phases are unchanged. No diagram required.

## Acceptance criteria

- [x] (respec 1) `simulateBuildOrder` throws `Error` with message `production time for "villager" at "capital-town-center" must be a positive finite number, got 0` for a villager entry with `costs.time` 0 (via `editGameData`), and for a villager entry with `costs.time`, food cost and `costs.popcap` all 0, each with `autoHouses` true and false. On origin/main the zero-cost rows never return, so a missing guard shows as a hung test process, not a vitest timeout; with the guard every row finishes in the unit suite.
- [x] The same message, with the received value, is thrown when `productionModifier` returns `0`, `-5` or `NaN` for a default run, and (respec 1) `got Infinity` for a `productionSpeed` `multiply` 0 effect on `villager`.
- [x] (respec 1) With villager `costs.time` 0, starting food 0 and `start: { rally: 'sheep', villagers: {} }`, `autoHouses: true` throws the production-time message (from `houseDemand`, since no villager is paid) and `autoHouses: false` returns with an empty `unitsProduced`. Moving the guard into `startHead` makes the first case fail; the implementer applies that mutation in a throwaway worktree, confirms the test fails, and records it in the report.
- [x] (respec 1) Zero-time research still completes: `research.test.ts` "leaves the units at the highest tier when two upgrades complete at one instant, listing no series for the tier passed through" passes unedited. Dropping the `entry.type === 'unit'` condition from the guard makes it fail (checked by the ticket author on `b9481e3`).
- [x] (respec 1) `run([], { start: {} })` throws `Error` `building "capital-town-center" instance 1 spawned a villager but has no rally`, not a `TypeError`; with starting buildings `capital-town-center` and `mill`, `start: {}` and a `villagerProducer` hook that returns true only for `mill`, the run throws `building "mill" instance 1 spawned a villager but has no rally`.
- [x] The supply-wait test pins the property, not a floor: it fails when the `produce` handler returns a `reserve` with `waitingOn: 'population'`. The current assertion passes under that mutation; the implementer applies the mutation in a throwaway worktree, confirms the new test fails and the old one would not have, and records it in the report.
- [x] (respec 1) No result changes for shipped builds: for each build from `listBuilds()` (`ENG 1TC`, `ENG Knight/Longbow (King's Palace)`, `ENG Spear/Longbow into MAA/Crossbow`) and the default `SimInputs`, `JSON.stringify(simulateBuildOrder(...))` on the branch equals the value produced on origin/main at the commit the branch is cut from (run a throwaway script on both commits, compare the output files with `cmp`, and report the three results; do not commit the script or the outputs). The existing unit suite, including `simulate.acceptance.test.ts` and `research.test.ts`, passes with no expected value edited.
- [x] A search for `rally!` in `lib/aoe4-build-order/simulate.ts` finds no non-null assertion on a possibly undefined rally.
- [x] `docs/aoe4-build-order.md` states both new error rules as described in Scope; no sentence in `docs/` or `civ-rules.ts` still says the engine reports no error for them.
- [x] `npx tsc --noEmit`, `npm run lint:dup` and `npm test` pass; every test edited or added is listed in the report.
- [x] No INVARIANTS.md regressions

## Open questions

- `designer`: throwing from the engine is chosen over clamping or skipping because the backlog asks to
  "keep hook-supplied times positive" and the repo already throws on bad `startingState.units`. If the
  owner prefers the API to answer a bad hook with a 400 or a warning instead of a thrown error, that is a
  separate decision; current API handling of a thrown `Error` was not changed here.

## Re-spec 2026-11-04

- Underspecified: Scope claimed `startHead` was the only caller of `productionSeconds`; `houseDemand` also calls it for ordered, unstarted units, and research items reach it through `startHead`, with a zero-time upgrade already pinned as valid in `research.test.ts`.
- Changed: guard stays in `productionSeconds`, limited to unit entries, and fires from `houseDemand` too; hang rows run with `autoHouses` true and false; new `houseDemand` pair and research-still-instant criterion; second rally row names `mill`; `productionSpeed` 0 row is required; base facts re-verified on `b9481e3` (time 0 alone no longer hangs; the zero-cost villager still does).
- No branch work exists yet.
