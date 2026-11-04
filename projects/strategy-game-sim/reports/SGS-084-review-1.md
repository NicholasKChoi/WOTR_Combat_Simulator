# SGS-084 review 1

- Branch `sgs-084-aoe4-gather-rate-per-villager` at b90ad269213d2290ad3d2b338162953d5d210eff, base b9481e3 (full first review, not delta). Reviewed in a detached worktree, which has since been removed.
- **Verdict: REQUEST CHANGES.** There are two blocking findings, both in one test file. Each takes a few lines to fix, and I checked both fixes in my worktree. The engine, result, OpenAPI, docs and UI are correct.

## Blocking findings

1. `lib/aoe4-build-order/simulate-series.test.ts:263` (test "drops at the same sample as the gather rate when a stocked node runs out"). Category: test.
   - What: the title claims `gatherers` drops at the same sample as `gatherRates`. The assertions only read `gatherers.food` and `gatherers.wood` and never read `gatherRates`.
   - Why it matters: the title claims a check the test does not make (always blocking per the review bar). A count that drops one sample early or late relative to the rate would still pass this test.
   - Direction: add these two lines after the `gatherers.wood` assertion:
     - `expect(result.gatherRates.food[after - 1]).toBeGreaterThan(0)`
     - `expect(result.gatherRates.food.slice(after).every((r) => r === 0)).toBe(true)`

     I added both in my worktree and the file passes (25/25). Renaming the test instead is the weaker fix.
2. `lib/aoe4-build-order/simulate-series.test.ts:225-229` (`rateOf` in `describe('gatherers')`). Category: convention, checklist(AoE4 build order: copied helper).
   - What: this hand-built `EffectState` literal plus the `effectiveGatherRate` call is a near-verbatim copy of `perSecond` in `lib/aoe4-build-order/build-move.acceptance.test.ts:60-64`. The shared builder `effectStateOf` already exists in `lib/aoe4-build-order/test-helpers.ts:95` and is used by `effects-gather.acceptance.test.ts:66-87`.
   - Why it matters: REPO.md's AoE4 checklist says a helper copied from another `lib/aoe4-build-order/` module is blocking (past copies drifted). common.md also says to use the package's existing test helpers.
   - Direction:
     - Body: `return effectiveGatherRate(node, effectStateOf({ buildings: new Map([['capital-town-center', 1]]), coverage: defaults.influenceCoverage }), defaults)`
     - Import: add `effectStateOf` to the `./test-helpers` import.

     I checked this in my worktree: tsc is clean and the tests pass. Leave `build-move.acceptance.test.ts` alone, since the ticket does not touch it.

## Rulings on the implementer's two points

1. **OpenAPI version pins 2.2.0 to 2.3.0** (`acceptance/aoe4-gathered-resources.spec.ts:68,70`, `acceptance/aoe4-simulate-api-issue-shape.spec.ts:13,16`): **accepted.**
   - Scope 3 requires the minor bump, and these pins fail only because of it. That is the case Scope 7 covers ("any other test that fails only because the result has a new key is fixed the same way").
   - Commit cc9bb04 moved the same pins, titles included, on the previous bump.
   - Both specs pass on the branch.
2. **`textAnchor: 'middle'` on the YAxis label** (`components/apps/aoe4-build-order/line-chart.tsx:114`): **in scope; keep it.**
   - I measured it with the change reverted. With the ticket's required label "Per villager per minute", the label's top sits 55 px above the SVG top and is clipped. The screenshot shows "Per villager per r" at 1280 px. The ticket requires this label (Scope 6), and REPO.md's chart checklist requires readable axis labels. So this is the minimal fix the ticket needs, not a side change.
   - With the change, at 360, 390, 700, 768 and 1280 px, all four labels sit inside the SVG and are centered on the plot. The gaps from the label to the SVG top and bottom are 112/142 px for "Per minute" and 55/85 px for the long label. There is no horizontal overflow.
   - The other three charts' labels move from "starting at the axis midpoint" to "centered". Their text is unchanged, and no doc sentence or test pins their position.
   - SGS-087 overlap: SGS-087 (4c065b2, based on fcfbaf1) edits `line-chart.tsx:115`, the `<Tooltip>` line, which is directly below the YAxis line edited here. Whichever branch lands second will get a textual conflict on two adjacent lines. Keep both edits. Their behaviour does not interact.

## Cross-ticket and rebase notes for the manager

- **SGS-087 tooltip rounding vs this ticket's page criteria.** SGS-087 rounds tooltip values to one decimal (`formatChartValue`). The SGS-084 page and pinned criteria compare tooltip text "with a small tolerance, since tooltip text is the raw float". If SGS-087 lands first, the acceptance tolerance must be at least 0.05 (half of one decimal). Tell the acceptance-test agent.
- **The pinned criterion's premise is wrong.** It says to "pin a run whose food villager count differs from the current run's, so the two values differ". A per-villager rate does not depend on the villager count when the node is the same. I pinned `start 4 sheep 2 wood -> sheep`, ran `start 2 sheep 4 wood -> sheep` and checked the box. At 1:00, `Food` and `Food (pinned)` were both 37.0523, and `Wood` and `Wood (pinned)` were both 31.0024. To get different values, the acceptance case must pin a different *node mix*: for example `start 3 sheep 3 berry -> sheep` against `start 6 sheep -> sheep` (the mean of sheep and berry rates vs the sheep rate). This does not block the code. The acceptance-test agent needs it, and a respec can correct the wording.
- **The criterion names a spec file that no longer exists.** The page criterion names `acceptance/aoe4-build-order.spec.ts`. Main deleted that file in b7b6e8f, after this base. The acceptance case should go in a new spec.
- **Rebase onto fcfbaf1.** Main rewrote `simulate-house-warnings.test.ts` (fcfbaf1). Its digests now hash a named field list (`digestTimeline`), so the `gatherers` exclusion edit here becomes unnecessary and will conflict. Take main's version: `gatherers` is not in its named list, so the pins hold. `acceptance/aoe4-gathered-resources.spec.ts` also changed on main (`CHART_IDS`). That change is on lines away from the version pin and should merge cleanly.

## Acceptance criteria

The verdict is not APPROVE, so no box in the ticket is ticked. The status of each criterion:

- [pass] Every response has `gatherers` with food/wood/gold/stone, each of length `times.length`, holding non-negative integers. Evidence: the prebuilt it.each in `simulate-series.test.ts`, the OpenAPI Ajv check and the contract spec, all of which I ran.
- [pass] (respec 1) `4 sheep 2 wood` gives 4/2/0 at t=0, and food rate / 4 equals the sheep rate x 60. The "0 exactly when the rate is 0" check passes on every prebuilt.
- [pass] (respec 1) `3 sheep 3 berry` gives food 6, and the ratio is the villager-weighted mean.
- [pass] (respec 1, 2) Builders: wood goes 4 to 2 at the first sample at or after `startedAt`. The rate drops by 2 x r x 60. The count is still 2 just after `completedAt` and back to 4 at the first sample at or after `completedAt + walkSeconds`.
- [pass, test weak] Depletion: the counts drop at the run-out sample. The rate drop at the same sample is not asserted (finding 1). I verified it holds by adding the assertions.
- [pass] Pre-existing fields are unchanged. The three digests in `simulate-house-warnings.test.ts` keep their values (only the destructure changed). The OpenAPI example matched the handler apart from the new key (the contract spec's `toEqual` passes).
- [pass] OpenAPI: `gatherers` is in `required` right after `gatherRates`. Its property has the specified shape and description. `info.version` is 2.3.0, one minor above 2.2.0. The Ajv check and the contract "documented 200 body" spec pass.
- [pass] `perVillagerSeries` table: [120,60,0]/[4,2,0] gives [30,30,0]; a zero count gives 0, never Infinity or NaN; keys and names equal `resourceSeries`'s.
- [verified manually, acceptance case not yet written] Page toggle:
  - The checkbox is unchecked by default, and the label reads "Per minute" then "Per villager per minute".
  - At 10:00, Wood read 62.0048 unchecked and 31.0024 checked (2 villagers).
  - The other three labels did not change.
  - The acceptance-test gate owns the spec.
- [verified manually, criterion wording needs a fix] Pinned:
  - Pinned lines switch to per-villager. I saw `Food (pinned)` 37.0523, which equals the pinned response's rate / gatherers.
  - A Gold legend item hidden before the toggle stayed hidden after it.
  - See the premise note above.
- [pass] Docs: `git grep "Per villager"` matches lines 898-899, `git grep "number of villagers gathering"` matches line 723, and the "Gather rates (per minute)" table row is still there.
- [pass] No invariant regressions (see below).

## Invariants

- A1 holds: no new literal in the simulation. `gathererCounts` reads only `engine.gatherers` and the data's node-to-resource map.
- A2 holds: `gathererCounts` returns a fresh object computed once per wake, beside `income`. It feeds only the pushed `gatherers` series and never reaches `nextWake`, `creditIncome`, `affordableAt` or any spend. I traced every use of `counts` in `simulateBuildOrder`.
- A3 holds: it iterates the fixed `NODE_REFS` array, with no clock and no randomness.
- S1 holds: there are no cross-app imports.
- S3 holds: no new input, and the series is bounded by `times.length`.

## Doc claims checked

- `docs/aoe4-build-order.md:723` says walking, building and idle villagers are not counted. Correct:
  - `sendWalking` (`simulate.ts:204`) moves builders out of `gatherers` into `walking`.
  - `completeConstruction` (`simulate.ts:445-452`) puts them back only on arrival after `villagerWalkSeconds`.
  - `idle` and `farmIdle` are separate fields.
- `docs/aoe4-build-order.md:898-900`, the toggle sentence. Correct:
  - `useState(false)`.
  - `gatherRateSeries` is applied to both `result` and `pinned`.
  - `count > 0 ? rate / count : 0`.
  - The label is conditional.
- `model.ts:123` "the divisor of gatherRates" and the OpenAPI descriptions ("mean rate per villager"). Correct: `incomePerSecond` sums `gatherers[ref] * rateOf(ref)` over the same refs and grouping that `gathererCounts` sums.
- Commit message: no ids or process history. The author is `choinickolas@gmail.com`.

## Lint

- `npx tsc --noEmit`: clean.
- `npm run lint:dup`: 0 clones.
- No ESLint config exists.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so there is nothing to reconcile.

## Conventions compared

- The checkbox markup matches `step-table.tsx:163-169` (`form-check-input`, `data-testid`, `checked`/`onChange`).
- The `headerControls` wrapper uses only Bootstrap utilities on its own element, with no module CSS mixed in. Other charts render the bare `<h3>` as before.
- The `perVillagerSeries` table and the no-mutation test follow the `resourceSeries` tests in the same file (`result-series.test.ts:60-79`).
- The new engine tests use the `run`/`at`/`inputsFor` helpers like their siblings, except for finding 2.

## Non-blocking notes

- `simulate.ts:748-756`: `gathererCounts` repeats `incomePerSecond`'s loop. It could be written as `incomePerSecond(engine, () => 1)`, which guarantees the same grouping by construction. The ticket asked for "a function beside incomePerSecond", so the current form is acceptable.
- `result-series.ts:26`: `s.key as ResourceKind` is a cast. Mapping over `RESOURCE_KINDS` directly would avoid it, but it is harmless as written.
- `simulate-series.test.ts:250`: the walk-back check uses `defaults.walkSeconds`, while the engine uses `villagerWalkSeconds(state, ...)`, which can apply modifiers. The two are equal in age 1 with no techs, so the test is correct for this input but would need updating if speed modifiers apply there later.
- Pre-existing and not in this diff: after hiding the current `Gold` legend item, `Gold (pinned)` still appeared in the tooltip and as a `pinned:gold` line. I did not dig into whether the doc's "a pinned series' item follows its current series' item" means it should hide too. A possible follow-up.

## Coverage

- Reviewed all 14 changed files in full.
- Read for context:
  - `simulate.ts`: `incomePerSecond`, `gatherRatesOf`, `sendWalking`, `completeConstruction`, the sample loop.
  - `line-chart.tsx`
  - `pages/apps/aoe4-build-order.tsx`: stored pins are re-run, not stored as results, so a pin always has `gatherers`.
  - `test-helpers.ts`
  - The SGS-087 diff of `line-chart.tsx`, and main's fcfbaf1 changes to the two overlapping test files.
- Ran:
  - `npm ci`
  - `npx tsc --noEmit`
  - `npm run lint:dup`
  - `npm test`: 1362 passed, 10 skipped.
  - `npx next build`: exit 0.
  - Playwright on the four touched acceptance specs plus `aoe4-build-order-pin-compare.spec.ts`: 136 passed.
  - A scratch Playwright probe (deleted): screenshots and label rects at 360, 390, 700, 768 and 1280 px, toggle values, pinned values and legend persistence.
- REPO.md checklist: I did "Every diff" (build, and loading the page) and the "AoE4 build order" section (design-doc check, chart widths, no overflow, no copied helper; the copied helper is finding 2). The Bootstrap/module-CSS mixing check found nothing. The other sections do not apply.
- I did not run the full acceptance suite. The implementer reports 739/739 passing.
- No process I started is still running.
