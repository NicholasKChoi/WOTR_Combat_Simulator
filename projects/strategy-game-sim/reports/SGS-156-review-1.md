# SGS-156 review 1

- Verdict: **REQUEST CHANGES**
- Branch `sgs-156-auto-houses-plan-ahead`, tip 411dfb3c05acbc42d9ca1f5f7dffaef389dae588, diff `git diff origin/main...HEAD` (fork e50e074). Full review, not delta mode.
- Scratch: `worktrees/review-sgs-156-auto-houses-plan-ahead` (removed after this report).

The engine change is correct against the ticket and the invariants. Two small fixes block approval: one test checks its precondition on a different setup from the run it asserts, and one doc sentence the diff adds says more than the code does.

## Blocking findings

1. `lib/aoe4-build-order/simulate-house-hold.test.ts:75-79` - test - "holds one house cost when several houses are due and none can start" checks "several houses are due" on a different setup from the run it asserts. The precondition run uses `{ houseBuilders: 1 }`. One builder makes the build longer, so the window is longer and more houses are due. The asserted run uses the default `houseBuilders: 4` from `holdRun`. I measured both at the tip: with 1 builder the planner starts 6 houses at t=0 (300 wood); with 4 builders and the same population (8) and production it starts only 2 (100 wood). The 4-builder count sits right at the threshold the test needs. If data or tuning drops it to 1, the precondition still passes (6 >= 2), and the test then checks nothing (common.md Tests: a test that depends on the data asserts that condition first). This is the only test for the acceptance criterion "a test fails if the hold is the count times the cost". - Direction: assert the precondition with the same inputs, so the planner count is the same, and give the run a node that has four builders: `const withBuilders = holdRun([], { ...slow, wood: 1000 }, {}, { villagers: { sheep: 8 }, rally: 'stone' })`, keeping `expect(withBuilders.spent.buildings[0]).toBeGreaterThanOrEqual(2 * HOUSE_WOOD)`. I measured this at the tip: 100 (two houses at t=0). With wood banked the gather time is 0 in both runs, and population (8) and production are the same, so the planner returns the same count. The production change it must fail on is `simulate.ts:684` setting the hold to the planner count times the cost (2 x 50 wood). The barracks then needs 150 + 100 = 250 wood against 200, so `steps[0].startedAt` goes from 0 to null.

2. `docs/aoe4-build-order.md:332-333` - contract (text) - "Villager payments and explicit `build house` steps ignore the hold." contradicts the code. The sentence just before it lists `produce` among the step payments that must leave the hold, and a `produce villager` step goes through `canAffordHeld` (`simulate.ts:394`). Only villager *order* payments skip the hold (`payOrder`, `simulate.ts:584`). - Direction: replace it with exactly "Villager order payments and explicit `build house` steps ignore the hold." Facts kept: villager order payments ignore the hold; explicit `build house` steps ignore the hold.

## Spec gaps

None.

## Acceptance criteria

| Criterion | Verdict | Evidence |
|---|---|---|
| Fixture keeps the TC producing villagers 9:30-15:00 | pass | `simulate-house-hold.test.ts` "keeps producing villagers from 9:30 to 15:00". It asserts the food and villager-target preconditions first. The implementer recorded it failing at e50e074 on the flat-count assertion (40 > 25). |
| House due ahead of affordability (gather time, bank, pending inside lead+G) | pass | `houses.test.ts` "planAutoHouse with the house cost not yet banked". Each row first shows the banked case is 0. The pending-window table covers after-lead-inside-window, exactly-at-window and after-window. The implementer's mutation checks failed these rows. The house starting when wood covers it is pinned by the existing "wake when the house becomes affordable" test. |
| Fully banked equals the previous planner | pass | Every pre-existing `houses.test.ts` case now runs with `...banked` (G = 0) and keeps its expected value, including the pending table. |
| 2+ houses due, none startable: hold is one house | pass on code, test blocked | The code sets `houseHold = cost` (`simulate.ts:684`). The test's precondition gap is blocking finding 1. |
| Hold binds step and non-villager order payments; non-spent resource pays; villager order pays; released when the house starts or stops being due | pass | The step `it.each` rows (build, produce, research, reaction), "pays a step that spends none...", "holds one house cost back from a non-villager order", "lets a villager order pay...", "releases the hold at the instant...". The builder test (barracks at 40/rate, not the 90/rate a stale hold would give) shows the hold drops once the house starts. |
| Held step wakes at the instant bank covers cost + hold | pass | The step rows assert `startedAt` close to 10/rate, off the sample grid and before 20 s. `nextWake` applies `heldNeed` (`simulate.ts:813-815`). |
| House made due by events holds from the second offer | pass | The "applies a house made due by an arrival" rows (wood 200 starts at 5; wood 199 never starts). `runHousePass` runs after `applyDueEvents` (`simulate.ts:713`). |
| Due affordable house starts before the step in the same instant | pass | "starts a due affordable house before the steps" (house done at 305, barracks not at 0). |
| Builder shortage keeps the hold; house starts when builders free up | pass | "keeps the hold while builders are busy..." (barracks at 40/rate, house done at 35+5+300). |
| Zero wood income, short wood: no hold | pass | "holds nothing while a short resource of the house has no income" (step at 0, military 160 at 15 s). |
| Fewer villagers than `houseBuilders`: no hold; enough but all busy: hold stays | pass | The `it.each` rows (houseBuilders 7: step at 0; 4: never). Only the step is asserted, not a non-villager order (see note). |
| Step reserve does not hold back an auto-house | pass | "ignore a waiting step reserve" in `simulate-construction.test.ts` is unchanged and passes. |
| Explicit `build house` is not held | pass | "does not hold an explicit build house step" (start at 10/rate, not 60/rate). Code: `isHouseBuild` in `build` and `nextWake`. |
| Never negative; same result twice | pass | `noneNegative` and the `toEqual` repeat runs on the held run and the fixture. `payCost` is unchanged. |
| Tests pinning old timing updated and listed; doc describes the due rule, hold and passes | pass, with finding 2 | The implementer-2 report lists the edits. "Houses and supply", the builder paragraph and the headroom sentence now say window, not lead. No sentence says auto-houses ignore all reservations or plan only after production. The one inexact sentence is finding 2. |
| `MAX_FLOATING_AT_1200` is 2600; floors and bars hold; no doc states the old cap | pass | `production-floors.ts:30`. `builds.test.ts` passes for all four builds (I ran `npm test`). A grep finds no doc, comment or test that states 2000 as the cap. The README rewording matches the implementer's measured floats (ENG 1TC wood 2512, Council Hall 2220). The acceptance spec uses the same constant; I did not run it. |
| No INVARIANTS.md regressions | pass | See below. |

## Invariants touched

- **A1** (game numbers from data): holds. No new literals. The house cost comes from `costOf(house, 1)`, and the source-shape test on `houses.ts` passes.
- **A2** (never negative): holds. The hold only makes checks stricter (`canAffordHeld` is `canAfford` on cost plus hold). Explicit houses and auto-houses still check `canAfford` before `startConstruction`, and `payCost` is unchanged. Every paying handler (`produce`, `build`, `researchHandler`; `stepHandlers` has no other paying handler) goes through the check.
- **A3** (deterministic): holds. There is no randomness or clock. The three passes run in a fixed order, `houseDemand` copies the bank, and the repeat-equality tests pass.
- **S3**: no new inputs.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so this section was skipped.

## Lint and build

- `npx tsc --noEmit && npm run lint:dup`: clean, 0 clones.
- `npx next build`: passes.
- `npm test`: 2583 passed, 15 skipped, 0 failed.
- I ran one throwaway probe test in the scratch (house counts per builder setup) and deleted it. The tree was clean afterwards.

## Non-blocking notes

- `simulate-house-gate.test.ts:112`: the describe title "prebuilt builds without a house hold" comes from #117 and means builds with no explicit house step. This diff re-pins its digests because these builds now *do* run under the new auto-house hold, so the title now reads as the opposite of the truth. Consider renaming it to "prebuilt builds with no build house step".
- `simulate-house-hold.test.ts:62-72`: every row of the step table has `index` 0, so that column is dead. Drop it and read `result.steps[0]`.
- `simulate-house-hold.test.ts:53` `noneNegative` repeats the inline check in `simulate-construction.test.ts:131` and `:415`. It could move to `test-helpers.ts`. jscpd does not flag it.
- `houses.test.ts` row "not due while the bank is short and nobody gathers wood": at 1/(2 x lead) population per second the lead-only window already fits, so this row also passes if a no-income resource were treated as G = 0. It catches only a divide-by-zero version. The next test ("plans nothing for a short resource with no income...") checks the rule properly.
- The villager-release row asserts only the step, while the criterion also names a non-villager order. Both read the one `houseHold` field, so the risk is low. acceptance-test may want an order assertion.
- `runHousePass` calls `houseDemand` (including `gatherRatesOf`) up to twice per pass and three passes per instant. The suite time is unchanged (about 6 s), so this is a note only.
- The PR description must say that every saved build's simulated result shifts and that the 1200 s floating cap rose to 2600 (Scope 9; no changelog file).

## Coverage

- Reviewed in full: `lib/aoe4-build-order/{houses.ts,engine-common.ts,simulate.ts,research.ts,production-floors.ts}`, `docs/aoe4-build-order.md` (every changed sentence against the code), `data/aoe4-build-order/README.md`, and the test files `simulate-house-hold.test.ts`, `houses.test.ts`, `engine-common.test.ts`, `builds.test.ts`, `simulate-house-gate.test.ts`.
- The implementer's Doc claims list was checked against the cited code. Every claim holds except the sentence in finding 2, which the list does not include.
- Pre-existing test edits all fall under Scope 8: `houses.test.ts` setup gains `banked`; the `builds.test.ts` gold depletion times and the house-gate digests get new pinned values.
- Bug-type checks: the regression record is present and fails at the base on the named assertion. The fix lands at the causes the ticket names: `planAutoHouse` and the auto-house pass ordering and hold.
- Conventions: compared against `simulate-house-gate.test.ts` and `simulate-construction.test.ts` (4-space, no semicolons, `run`/`editGameData`/`housesDone` helpers, `it.each` tables). `orderNeed` was moved to `engine-common.heldNeed` and shared, not copied (AoE4 checklist).
- Ticket hygiene: no ticket ids or factory pointers in shipped files.
- UI inspection not run: the diff changes no UI (no components, styles or pages). The REPO checklist step to load each touched page does not apply, since no page file changed. The engine change only shifts simulated numbers.
- No acceptance or Playwright specs were run (by role).
- REPO.md has review checklist sections for "Every diff" and "AoE4 build order", and both were applied.
