# SGS-156 review 2 (Rework 1 re-review)

- Verdict: **APPROVE**
- Branch `sgs-156-auto-houses-plan-ahead`, tip d172c2e27acd00c40080fa28b342ef8d2567b61e. Diff `git diff origin/main...HEAD` (fork e50e074). I re-reviewed the full branch and checked the delta `411dfb3..d172c2e` against the Rework 1 Required fixes.
- Scratch: `worktrees/review-sgs-156-auto-houses-plan-ahead`, removed after this report.
- origin/main has moved to c5bd608: #166 changed an acceptance selector and #167 changed the combat die rule. Neither touches the files on this branch, and `git merge-tree origin/main HEAD` merges cleanly.

## Rework 1 Required fixes

1. **Landed.** At `simulate-house-hold.test.ts:77` the precondition now runs `holdRun([], { ...slow, wood: 1000 }, {}, { villagers: { sheep: 8 }, rally: 'stone' })`. The `>= 2 * HOUSE_WOOD` assertion at :78 is unchanged.
   - Same inputs: this run has the same population (8), the same production and the same `houseBuilders` (4) as the asserted run at :79. Gather time is 0 in both runs, so the planner returns the same count.
   - Mutation, run myself: I set `simulate.ts:684` to `engine.houseHold = costOf(house, count)`. The test then failed at :79 with "expected null to be +0" (barracks `startedAt` 0 -> null). I reverted it and the tree was clean.
   - Precondition reading: spending at least 100 wood at t=0 means the planner first reported 2 or more houses due. One started house counts toward headroom by its completion at the window edge. So a second start in a later pass of the same instant only happens if the shortfall was more than one house. The implementer's second mutation (`Math.min(1, …)` still passing) is consistent with this.
2. **Landed verbatim.** At `docs/aoe4-build-order.md:332-333` the sentence now reads exactly "Villager order payments and explicit `build house` steps ignore the hold."
   - Kept fact: villager order payments ignore the hold (`payOrder` uses the plain cost for villagers, `simulate.ts:584`).
   - Kept fact: explicit `build house` steps ignore the hold (`isHouseBuild` in `build`, and in `nextWake` at `simulate.ts:813-815`).

The delta changes only these two places.

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria

| Criterion | Verdict | Evidence |
|---|---|---|
| Fixture keeps the TC producing villagers 9:30-15:00 | pass | "keeps producing villagers from 9:30 to 15:00". It asserts the food and villager-target preconditions first. The implementer recorded it failing at the base on the flat-count assertion. |
| House due ahead of affordability (gather time, bank, pending inside lead+G) | pass | The `houses.test.ts` "house cost not yet banked" rows and the pending-window table (after lead but inside the window, exactly at the window, after the window). |
| Fully banked equals the previous planner | pass | Every earlier `houses.test.ts` case runs with `...banked` and keeps its expected value. |
| 2+ houses due, none can start: the hold is one house | pass | `simulate.ts:684`. The test at :75-80 now checks its precondition on the same inputs, and I ran the count-times-cost mutation: it fails. |
| Steps and non-villager orders are held; a step that spends none of the house's resources pays; a villager order pays; the hold is released on start or when no longer due | pass | The step `it.each` rows (build, produce, research, reaction), the non-villager order test, the food-hold villager test, and "releases the hold at the instant…". |
| A held step wakes at cost + hold | pass | The step rows assert a start off the sample grid at 10/rate. `nextWake` uses `heldNeed`. |
| A house made due by events holds from the second step offer | pass | The arrival rows (wood 200 starts at 5; wood 199 never starts). There is a second `runHousePass` after `applyDueEvents`. |
| A due, affordable house starts before the steps in the same instant | pass | "starts a due affordable house before the steps…" |
| Builder shortage keeps the hold; the house starts when builders free up | pass | "keeps the hold while builders are busy…" |
| Zero wood income with wood short: no hold | pass | "holds nothing while a short resource of the house has no income" |
| Fewer villagers than `houseBuilders`: no hold; enough villagers, all busy: the hold stays | pass | The `it.each` rows at :159-165. `working` counts gatherers plus `walking`, and builders are in `walking` (`simulate.ts:462`). |
| A step reserve does not hold back an auto-house | pass | The `simulate-construction.test.ts` "ignore a waiting step reserve" assertion is unchanged. |
| An explicit `build house` is not held | pass | "does not hold an explicit build house step" |
| Never negative; same result twice | pass | The `noneNegative` checks and the repeat-equality tests. `payCost` is unchanged. |
| Old-timing tests updated and listed; doc covers the due rule, the hold and the passes | pass | The implementer-2 report lists the edits. Every changed doc sentence matches the code, including the sentence fixed in this rework. |
| `MAX_FLOATING_AT_1200` is 2600; the bars still hold; no doc states the old cap | pass | `production-floors.ts:30`, and `builds.test.ts` passes. A grep finds no 2000 cap in the docs, the README, production-floors or the spec. The only 2000s are unrelated example amounts in `openapi.json`. |
| No INVARIANTS.md regressions | pass | See below. |

## Invariants touched

- **A1**: holds. There are no new game literals, and the house cost comes from data.
- **A2**: holds. The hold only makes affordability checks stricter, and `payCost` is unchanged.
- **A3**: holds. The three passes run in a fixed order with no randomness, and the repeat-equality tests pass.
- **S3**: no new inputs.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty in REPO.md, so this section was skipped.

## Lint, build, tests (run at d172c2e)

- `npx tsc --noEmit && npm run lint:dup`: clean, 0 clones.
- `npx next build`: passes.
- `npm test`: 2583 passed, 15 skipped, 0 failed.

## Non-blocking notes (carried from review 1, still open)

- `simulate-house-gate.test.ts:112`: the describe title "prebuilt builds without a house hold" now reads as the opposite of what it tests. Consider renaming it to "prebuilt builds with no build house step".
- `simulate-house-hold.test.ts:59-64`: the `index` column is always 0, so it can be dropped.
- `noneNegative` repeats an inline check in `simulate-construction.test.ts`. It could move to `test-helpers.ts`.
- The villager-release row asserts only a step, not a non-villager order. Both read the same `houseHold` field.
- The PR description must say that every saved build's simulated result shifts and that the 1200 s floating cap rose to 2600 (Scope 9).

## Coverage

- Re-read the full production diff: `houses.ts`, `engine-common.ts`, `simulate.ts`, `research.ts`, `production-floors.ts`. Re-read the doc and README diffs, and the whole `simulate-house-hold.test.ts`.
- The only test file changed since 411dfb3 is `simulate-house-hold.test.ts`, in the one test review 1 named. No other test changed in the delta.
- UI inspection was not run because the diff changes no UI (no components, styles or pages). For the same reason, the REPO "Every diff" step to load each touched page does not apply.
- No acceptance or Playwright specs were run (by role).
- REPO checklist sections applied: "Every diff" and "AoE4 build order". No helper was copied: `orderNeed` became the shared `heldNeed`.
