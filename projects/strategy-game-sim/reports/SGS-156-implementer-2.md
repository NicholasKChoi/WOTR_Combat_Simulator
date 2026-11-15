# SGS-156 implementer 2

Status: **needs_spec**. Everything in the ticket is implemented and committed. Two pre-existing tests now fail, and the ticket's rule for existing tests does not cover them (see "Blocking: production-floor floating cap").

- Ticket: SGS-156 (auto-houses plan ahead for wood). Type Bug, risk high.
- Branch: `sgs-156-auto-houses-plan-ahead`, base origin/main e50e0749ac1b59657daf9d5283a5e67935d90e25
- Tip: ff47225e9b94dc103fbce83fc7df88eaf53133e1 (2 commits: 8528302, ff47225)
- Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-156-auto-houses-plan-ahead
- Node v24.22.2, which matches `engines`.

## Blocking: production-floor floating cap

`lib/aoe4-build-order/builds.test.ts` > "prebuilt build ENG 1TC" and "prebuilt build ENG 1TC Council Hall" > "meets its production floors and keeps its floating resources under the cap at 1200 s" now fail on `floating wood <= MAX_FLOATING_AT_1200` (2000):
- ENG 1TC: 2511.69. At the base, the 1200 s sample was 1852.
- ENG 1TC Council Hall: 2219.55.

Cause: the change works. Both builds reach popcap 200 at about 1110 s, both before and after. Now that the TC stays unhoused, more villagers reach wood (ENG 1TC wood rate at 1200 s is 1124/min, against 1056 at the base), and nothing in either build spends wood after popcap. The production floors (atLeast) still pass. Only the floating cap fails.

The ticket's rule (Scope 8): "a test of the changed behavior gets the new expected value; any other test keeps its expected value and pins the old setting in its setup". This is not a house-behavior test, and no old setting can be pinned (`autoHouses: false` would break the floors). So I changed no assertion. The Playwright spec `acceptance/aoe4-simulate-api-prebuilt-farms.spec.ts` ("<build> meets its production floors and floating cap at 1200 s") uses the same `productionChecks` and will fail the same way for those two builds.

Options for the spec: (a) raise `MAX_FLOATING_AT_1200` in `lib/aoe4-build-order/production-floors.ts` (it is shared by the unit and acceptance checks); (b) add a late wood sink to the two prebuilt builds in `data/aoe4-build-order/builds/`; (c) judge the floating cap only up to popcap, or per build.

## Files touched

- `lib/aoe4-build-order/houses.ts`: `HouseDemand` gains `bank` and `income`. `planAutoHouse` uses the window lead + gather time (G) for the pending filter and the projection. A short resource with zero income means no house is due.
- `lib/aoe4-build-order/engine-common.ts`: new `heldNeed(cost, holds)`, which adds holds only on the resources the cost spends, and `canAffordHeld(state, cost)`, the shared step-affordability helper.
- `lib/aoe4-build-order/simulate.ts`:
  - New `EngineState.houseHold`.
  - `startAutoHouses` becomes `runHousePass`: it plans, starts, then sets the hold. It runs three times in `runInstant`.
  - `houseDemand` passes the bank and `incomePerSecond(gatherRatesOf)`.
  - `produce` and `build` use `canAffordHeld`; an explicit house build uses `canAfford` (`isHouseBuild`).
  - `payOrder` uses `heldNeed(cost, [reserve, houseHold])`, which replaces `orderNeed`.
  - `reactionNeeds` now carries the step index.
  - `nextWake` adds the hold to step needs, except for explicit house builds.
- `lib/aoe4-build-order/research.ts`: `researchHandler` uses `canAffordHeld`.
- `docs/aoe4-build-order.md`: rewrote "Houses and supply" (the window, gather time, no-income rule, the three passes, the hold and who it binds, the villager-count release, builder-shortage hold, headroom "within the window"); one sentence added to Priority; the `resources` wait-reason row amended.
- `lib/aoe4-build-order/simulate-house-hold.test.ts`: new engine tests (below).
- `lib/aoe4-build-order/houses.test.ts`: existing calls now pass `banked` (house cost banked, zero income, so G = 0); new gather-time tests.
- `lib/aoe4-build-order/engine-common.test.ts`: new `heldNeed`/`canAffordHeld` tests.
- `lib/aoe4-build-order/builds.test.ts`, `simulate-house-gate.test.ts`: pinned values updated (below).

Business logic is about 120 lines net. Tests are about 300 lines.

## Design choices within the spec

- **Hold after starts.** If the pass started no house, the hold is set when the planner count is > 0. If it started any, the planner is re-run with the new bank and pending list, and the hold is set when that re-plan returns > 0 (Scope 2: "when the planner still reports a house due after the starts"). The re-plan only sets the hold; it starts nothing more.
- **Villagers counted for the release.** The count is gatherers on every node ref plus `walking`. Builders are in `walking` from `sendWalking` until they arrive, and idle villagers are excluded.
- **House-cost wake.** The pass pushes the house cost to `engine.needs` when the house is short. Pushes from passes 1 and 2 are cleared by `startProduction`. Pass 3's push stays, as `startAutoHouses` did before.

## Tests

Final `npm test`: 2581 passed, 2 failed (the floor caps above), 15 skipped. `simulate-house-hold.test.ts`: 20/20. `houses.test.ts`: 23/23. `engine-common.test.ts`: all pass.

New tests and what they encode:
- houses.test "planAutoHouse with the house cost not yet banked":
  - due-ness depends on gather time (40 s gather: due; 10 s: slack, not due);
  - the bank is read (cost banked with the same income: not due; half banked: due);
  - a short resource with zero income plans nothing, even when the population far outgrows supply;
  - a pending building finishing after the lead but within the window, or exactly at the window, counts toward headroom; one after the window does not; with the cost banked, the lead-only window applies.
- houses.test existing tests run with the cost banked, so the G = 0 result equals the old planner (criterion 3).
- engine-common.test "heldNeed and canAffordHeld": holds apply only on spent resources; the bank must cover cost + hold; with no hold it pays.
- simulate-house-hold:
  - `build`, `produce`, `research` and reaction steps each start at exactly `10 / woodRate`, the instant the bank covers cost + one house. Each case asserts that time is off the sample grid and before the first spawn. This covers the wake and A2.
  - With several houses due and none startable, a step that leaves exactly one house's cost pays at 0. The precondition is that the same setup with builders starts at least two houses at 0.
  - A food/gold research pays at 0 under a wood hold.
  - A non-villager order's second unit is paid at the first sample at or after `max(15, 10 / rate)`, not at 15.
  - A villager order pays through a food hold.
  - An explicit `build house` is not held, and its wake ignores the hold.
  - A held run gives the same result twice, and no bank goes below zero.
  - A due affordable house starts at t = 0 before the barracks step (it completes at 305) and the barracks does not start at 0.
  - A house made due by a villager arriving on stone (with a stone-costing house) holds the barracks in the second offer at 5 s (wood 199: never starts; wood 200: starts at 5).
  - The hold is released at the instant a reaction `pause` stops the house being due (barracks starts at the berry `depletedAt`).
  - With builders short, the hold stays (barracks starts at `40 / rate`, not 30) and the house starts the instant a move gives gold 4 gatherers (completes at 35 + 5 + 300).
  - Fewer villagers than `houseBuilders` releases the hold (spearman pays at 0); with 4 builders and 6 busy villagers the hold stays (spearman never starts).
  - With no wood income and wood under the house cost, a spearman step and its order pay at their own cost (military spend reaches 160 by 15 s).
  - Ticket fixture: from 9:30 to 15:00 food stays above a villager's cost and villagers stay below `villagerTarget`. The villager count never stays flat longer than villager `costs.time` (20) + one sample (5). The run is identical twice and no bank goes below zero.

## Bug regression (Bug ticket)

- Test: `simulate-house-hold.test.ts` > "the Town Center with thin wood and a council hall" > "keeps producing villagers from 9:30 to 15:00".
- Base: e50e0749ac1b59657daf9d5283a5e67935d90e25, scratch checkout `regress-SGS-156` (now removed).
- Command: `npx vitest run lib/aoe4-build-order/simulate-house-hold.test.ts` (through run.sh).
- Failed at base on `expect(longest).toBeLessThanOrEqual(villager.costs.time + SAMPLE_SECONDS)`: "expected 40 to be less than or equal to 25". Its preconditions (food and villager target) passed at base.

## Pre-existing tests edited

- `houses.test.ts`, every existing `planAutoHouse` call: added `...banked` (bank holds one house's wood, zero income) to the demand object. Expected values are unchanged. Rule: Scope 8, "pins the old setting in its setup" (banked wood).
- `builds.test.ts` "ENG Spear/Longbow into MAA/Crossbow > runs its first two gold deposits dry at pinned times...": gold 1180.1832495964047 -> 1181.189167905695, gold#2 1590.516582929738 -> 1591.5225012390283. Rule: Scope 8, a test pinning engine output that the change shifts gets the new value.
- `simulate-house-gate.test.ts` "prebuilt builds without a house hold > leaves %s unchanged": digest ENG 1TC 32a982d42fa1e689 -> 01831aa5a1b79212, Spear/Longbow 60e54bd7196e39e7 -> eda1702ca717e524. Same rule. The test name still says "unchanged". It now pins the new timeline.

These tests named by the ticket pass unchanged, so I did not edit them:
- `simulate-construction.test.ts`: "wake when the house becomes affordable" (the house still starts at 50 / rw + 20); "project the demand at the modified production speed"; "ignore a waiting step reserve".
- `simulate-house-gate.test.ts` "auto-houses at 120, 220 and 320 s" (the starting wood is banked).
- The `research.test.ts` auto-houses pacing test.
- `build-move.acceptance.test.ts` "pays the research while an auto-house is building".

## Pinned outputs

- `builds.test.ts` gold depletion times and `simulate-house-gate.test.ts` digests, values above. Inputs: the shipped builds with `inputsFor(ENGLISH, { durationSeconds: 1800 })`.

## Acceptance specs (Scope 8 search, not run: only acceptance-test runs Playwright)

I reproduced the at-risk assertions with `simulateBuildOrder` in a throwaway vitest file at both base and tip:
- `aoe4-simulate-api-house-rule.spec.ts` "explicit house started in the second the first auto-house would start": sampled start 40, final building spend 100, explicit houses at 36-40 start as ordered with spend 100. Same at base and tip. Not dependent.
- `aoe4-simulate-api-spend-population.spec.ts` "counts a payment made at exactly a sample time" (house step at 25, spend 0 at 20 and 50 at 25) and "counts an auto-house under buildings" (spend 200, a multiple of 50): unchanged. Not dependent.
- `aoe4-simulate-api-waits.spec.ts` "population: the same order with auto-houses on does not wait": step 1 completed, started 180, no wait. Unchanged.
- `aoe4-simulate-api-house-gate.spec.ts`: compares on against off only, and the unit twin in `simulate-house-gate.test.ts` passes. Not dependent.
- `aoe4-simulate-api-triggers.spec.ts` (`autoHouses: true` run): the reaction is a free `move all`, so it is not affected by the hold.
- **Dependent:** `aoe4-simulate-api-prebuilt-farms.spec.ts` "meets its production floors and floating cap at 1200 s", for ENG 1TC and ENG 1TC Council Hall (see Blocking).

## Mutation checks (each undone with `git checkout -- <file>`; tree clean after each)

- `houses.ts:48` `+ gather` -> `+ 0 * gather`: houses.test "is due when gathering the cost takes 40 s" fails, `expected +0 to be 1`. So do the half-banked and window-headroom rows.
- `houses.ts:23` short = `cost[kind]` (bank ignored): "is not due with the cost banked, whatever the income" fails, `expected 1 to be +0`.
- `houses.ts:49` pending window `horizon - gather`: "counts a building finishing after the lead but inside the window" and "exactly at the window" fail, `expected 1 to be +0`.
- `houses.ts:28` `return null` -> `return 0`: "plans nothing for a short resource with no income" fails (`expected 19 to be +0`). The engine test "holds nothing while a short resource of the house has no income" also fails (`expected null to be +0`).
- `engine-common.ts` `heldNeed` without `cost[kind] > 0`: the heldNeed unit tests fail (deep equal; `expected false to be true`). "pays a step that spends none of the house resources" fails, `expected null to be +0`.
- `research.ts:54` hold dropped: the research row fails, `expected +0 to be close to 19.35`.
- `simulate.ts` `produce` -> `canAfford`: the produce row fails, `expected +0 to be close to 19.35`.
- `simulate.ts` `build` -> `canAfford`: the build and reaction rows fail, as do the arrival (199) and builder rows.
- Hold = remaining count x cost: "holds one house cost when several houses are due and none can start" fails, `expected null to be +0`.
- Explicit house held: "does not hold an explicit build house step" fails, `expected null to be close to 19.35`.
- Order ignores hold: "holds one house cost back from a non-villager order" fails, `expected 15 to be 20`.
- Villager order held: "lets a villager order pay through a hold of food" fails, `expected +0 to be 50`.
- `nextWake` ignores the hold: the four step rows fail, `expected 20 to be close to 19.35`.
- `nextWake` holds the explicit house: the explicit-house test fails, `expected 20 to be close to 19.35`.
- Pass 1 removed: "starts a due affordable house before the steps of the same instant" fails, `expected undefined to be 305`, along with others.
- Pass 2 removed: "applies a house made due by an arrival ... (wood 199)" fails (`expected 5 to be null`), as does "releases the hold at the instant the house stops being due" (`expected 5 to be 1.82`).
- Pass 3 removed: existing `simulate-construction.test.ts` auto-house tests fail (for example `expected 19 to be 20`).
- Villager-count release removed: "fewer villagers than houseBuilders release it" fails, `expected null to be +0`. It first passed under this break because the row's house was not due. I changed the row to a 1200 s house build so a house is due, and committed that in ff47225.
- Hold released for lack of builders: "keeps the hold while builders are busy ..." fails, along with the step rows.
- Fixture test: no single break above fails it. Planning ahead, the hold, and pass 1's ordering each keep the TC producing on their own. It does fail at the base, where all three are absent (see Bug regression).

## Codegen, build, lint

- codegen: not set.
- build (`link-node-modules && npx next build`): passed.
- lint (`npx tsc --noEmit && npm run lint:dup`): 0 type errors, 0 clones in both jscpd configs.
- unit (`npm test`): 2 failures, both the floor caps above.

## Doc claims (`docs/aoe4-build-order.md`)

- "The window is the lead ... plus the gather time of one house's cost: for each resource of the cost, what the bank lacks divided by that resource's current income from the current gatherers, the largest of them." Source: `houses.ts:gatherSeconds`; `simulate.ts:houseDemand` (`incomePerSecond(engine, gatherRatesOf(engine))`).
- "The bank is the real bank, with no step reserve taken off it, so the gather time is 0 while the cost is banked." Source: `houseDemand` `bank: { ...engine.resources }`; `gatherSeconds` skips a non-short resource.
- "While a resource of the cost is short and nobody gathers it, no house is due." Source: `gatherSeconds` returns null, and `planAutoHouse` returns 0.
- "... finish within the window (one finishing exactly at the window counts)". Source: `planAutoHouse`, `completesAt <= state.time + horizon`.
- "A house can be due before its cost is banked, and as the bank grows and steps spend it a house can stop being due and become due again." Source: `planAutoHouse` reads `demand.bank` on every call.
- "The planner runs three times in an instant: after run-outs and before the first step offer, after the instant's events and before the second step offer, and after production starts." Source: `simulate.ts:runInstant`.
- "Each run starts every due house it can pay for and find builders for, then sets the hold: one house's cost while the planner still reports a house due, however many, and nothing otherwise." Source: `runHousePass` (`stillDue`, `engine.houseHold = cost`).
- "The hold stays as set until the next run, so a payment between two runs does not change it." Source: `houseHold` is written only in `runHousePass` and `createEngine`.
- "A step payment (`build`, `produce`, `research`, reactions included) must leave the hold in the bank on each resource it spends; a resource the step does not spend is not held". Source: `produce`, `build`, `researchHandler` call `canAffordHeld`; `heldNeed` checks `cost[kind] > 0`; reactions go through the same handlers.
- "A non-villager order payment must leave both the waiting step's reserve and the hold of each resource the unit costs. Villager payments and explicit `build house` steps ignore the hold." Source: `payOrder`; `build` with `isHouseBuild`.
- "A held step waits on `resources` and starts at the instant the bank covers its cost plus the hold." Source: handlers return `waitingOn: 'resources'`; `nextWake` uses `heldNeed(cost, [houseHold])`.
- "The simulation adds no stop of its own for the instant a house stops being due; the hold is released at the next instant it already stops at." Source: `nextWake` adds no due-flip candidate.
- "Nothing is held with `autoHouses: false`, or while fewer villagers are gathering, walking or building than `houseBuilders` (idle villagers do not count)". Source: `runHousePass` returns early when autoHouses is off; `working` = gatherers + walking.
- "supply may block production meanwhile, and its hold may block steps and orders. While no node has enough gatherers but at least `houseBuilders` villagers are gathering, walking or building, the hold stays and the house starts at the instant a node has enough." Source: `runHousePass` (the hold is independent of `houseBuilderSource`; pass 2 runs after the arrival events).
- "a house under construction that finishes within the window counts toward the planner's headroom". Source: `planAutoHouse`.
- Priority: "A due auto-house also holds its cost back from steps and non-villager orders (Houses and supply)." Source: as above.
- Wait-reason row: "the bank is short of its cost, plus a due auto-house's hold on the resources it spends, except for an explicit `build house` step". Source: `canAffordHeld` and `isHouseBuild`.
- I checked the "Extension points" `productionModifier` sentence and it still holds: `houseDemand` calls `productionSeconds`.
- Code comments I added: `HouseDemand.bank` "The real bank, step reserves not subtracted"; `gatherSeconds` "null when a short resource has no income"; `heldNeed` "binds only the resources the payment spends"; `canAffordHeld` "Every paying step handler checks through here"; `EngineState.houseHold` "set only by the house passes of an instant" (plus its init in `createEngine`); `isHouseBuild` "the auto-house hold does not apply"; `runHousePass` header; the working-villager comment; the `runInstant` comment; the `payOrder` comment. Each matches the code above.

## Invariant check

- **A2** (resources never negative): `payCost` still pays the real cost and clamps at 0. A held step's `reserve` is still its own cost. Every hold run asserts non-negative floating. Upheld.
- **A3** (same build and data give the same timings): no randomness or clock. The order of work inside an instant and the wake times changed as the ticket specifies. Repeat-equality tests cover the held run and the fixture. Upheld.
- **A1**: no game numbers in the engine. The source-shape test on `houses.ts` (no numeric literals beyond 0, 1, 60) passes.
- **S3**: no new inputs.

## Unverified assumptions added

None. The tests fake no external behavior.

## Changelog

No changelog file exists on main. The PR description must say that every saved build's simulated result shifts (Scope 9).

## Out-of-scope findings

- The fixture's fix has three independent mechanisms, and each one alone keeps the TC producing (see Mutation checks). That is fine for the ticket, but it means the fixture alone does not guard any single one of them.

## Processes and cleanup

No servers were started. The scratch checkout `regress-SGS-156` was removed. Throwaway diagnostic test files were deleted before the first commit.
