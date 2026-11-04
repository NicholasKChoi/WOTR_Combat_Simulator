# SGS-084 implementer 2 (rework 1)

- Ticket: SGS-084, rework 1 (review-1 Required fixes). All three boxes are ticked in the ticket.
- Branch: `sgs-084-aoe4-gather-rate-per-villager` (local only, not pushed)
- Base: origin/main `b39cba4` (AoE4 charts: label only age-up markers, round tooltip values)
- Tip: `b37d34514e2a560ade597de4c5a46fed5e3b0980`
- Commits: `42f836e` (the original feature commit, rebased) and `b37d345` (the review test fixes)
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-084-aoe4-gather-rate-per-villager`
- Author: Nick Choi <choinickolas@gmail.com>. Both messages end with the Co-Authored-By line.

## Required fixes

1. [x] Run-out test (`lib/aoe4-build-order/simulate-series.test.ts`, "drops at the same sample as the gather rate when a stocked node runs out"): I added `expect(result.gatherRates.food[after - 1]).toBeGreaterThan(0)` and `expect(result.gatherRates.food.slice(after).every((r) => r === 0)).toBe(true)` directly after the `gatherers.wood` assertion. Both lines are verbatim from the review.
2. [x] I replaced the body of `rateOf` with `effectiveGatherRate(node, effectStateOf({ buildings: new Map([['capital-town-center', 1]]), coverage: defaults.influenceCoverage }), defaults)` and added `effectStateOf` to the `./test-helpers` import. `build-move.acceptance.test.ts` is unchanged.
3. [x] Rebased onto origin/main `b39cba4`. There were three conflicts:
   - `lib/aoe4-build-order/simulate-house-warnings.test.ts`: I took main's version. The branch no longer differs from main in this file, so the three pins are untouched.
   - `components/apps/aoe4-build-order/line-chart.tsx`: I kept this branch's YAxis `textAnchor: 'middle'` and main's `<Tooltip ... formatter={formatChartValue} />`.
   - `docs/api/openapi.json`: since b9481e3, main reworked the simulate 200 examples (6103ed7). There are now two named examples, `buildOrder` and `goldRunOut`. I took main's file and reapplied this ticket's edits to it:
     - bumped `info.version` 2.2.0 to 2.3.0. Main is still at 2.2.0, so this is exactly one minor above.
     - added `"gatherers"` to `SimulationResult.required` directly after `"gatherRates"`.
     - added the `gatherers` property schema after `gatherRates`, the same as the branch had it.
     - added `gatherers` after `gatherRates` in both 200 examples. I generated the values by running each request example through `checkBuildOrder`/`checkSimInputs`/`simulateBuildOrder`, the same calls the handler makes, in a scratch vitest file that I deleted afterwards. Before inserting, the script checked that each real response minus `gatherers` equals main's example exactly, including key order.
     - A Python round trip of main's file is byte-identical, so the only formatting change is the inserted lines.
   - The 2.3.0 pins in `acceptance/aoe4-gathered-resources.spec.ts` and `acceptance/aoe4-simulate-api-issue-shape.spec.ts` stay correct, because main has not moved off 2.2.0.

## Files touched (whole branch vs origin/main)

- `lib/aoe4-build-order/simulate.ts`: `gathererCounts`, plus the sampled and returned `gatherers` series.
- `lib/aoe4-build-order/model.ts`: `SimulationResult.gatherers`.
- `lib/aoe4-build-order/simulate-series.test.ts`: the `gatherers` describe block. This rework changed its `rateOf` and the run-out test.
- `components/apps/aoe4-build-order/result-series.ts`: `perVillagerSeries`.
- `components/apps/aoe4-build-order/result-series.test.ts`: the `perVillagerSeries` table and `gatherers` in the `result()` builder.
- `components/apps/aoe4-build-order/results.tsx`: the `perVillager` state and the checkbox.
- `components/apps/aoe4-build-order/line-chart.tsx`: the `headerControls` prop and the centered y label.
- `docs/api/openapi.json`: version, required, property and both 200 examples.
- `docs/aoe4-build-order.md`: the Outputs bullet and the toggle sentence.
- `acceptance/aoe4-simulate-api-contract.spec.ts`, `acceptance/aoe4-simulate-api-edges.spec.ts`: `gatherers` in the key lists.
- `acceptance/aoe4-gathered-resources.spec.ts`, `acceptance/aoe4-simulate-api-issue-shape.spec.ts`: version pin 2.2.0 to 2.3.0 (review-1 accepted this).

## Test files edited in this pass

- `lib/aoe4-build-order/simulate-series.test.ts` (fixes 1 and 2) is the only test file I edited.
- `lib/aoe4-build-order/simulate-house-warnings.test.ts` was reset to main's version during conflict resolution. It is no longer in the branch diff.
- The other test and spec edits came from implementer-1 and carried over through the rebase without conflicts. Their content is unchanged.

## Pre-existing tests edited

- `simulate-house-warnings.test.ts`: implementer-1's edit was dropped, and the file now equals main. Scope 7 (rework 1) says to take main's version.
- The pin and key-list edits in the four acceptance specs are unchanged from implementer-1. Scope 7 and review-1's ruling cover them.

## Tests run

- `npx tsc --noEmit`: clean.
- `npm run lint:dup`: 0 clones.
- `npm test`: 46 files, 1444 passed, 10 skipped, 0 failed.
- `simulate-series.test.ts` alone: 25/25 passed.
- Playwright, 107 passed, 0 failed, in these files:
  - `acceptance/aoe4-gathered-resources.spec.ts`: the 2.3.0 pin and the Ajv check.
  - `acceptance/aoe4-simulate-api-issue-shape.spec.ts`: the 2.3.0 pin.
  - `acceptance/aoe4-simulate-api-contract.spec.ts`: the documented 200 bodies for `buildOrder` and `goldRunOut`, and the key tables.
  - `acceptance/aoe4-simulate-api-edges.spec.ts`
- The playwright config started and stopped its own server. Nothing was listening afterwards.
- Not run: the full `npm run acceptance` and `npx next build`. The manager's instruction named tsc, lint:dup, npm test and the two pinned specs.

Invariants the edited tests encode:
- Run-out: the food gatherer count and the food gather rate both drop to 0 at the same first sample after the berry run-out, and both are positive at the sample before it.
- t=0 split: the food rate divided by the food gatherer count equals the villager-weighted mean of the node rates times 60. The expected value comes from `effectiveGatherRate` with a Town Center-only `EffectState`.

## Mutation checks (all undone; `git checkout` of simulate.ts, and `git status` showed only the intended test edit)

- New line `gatherRates.food.slice(after) all 0`: I made the engine push `max(1, rate)` for food at `simulate.ts:1022`. The run-out test failed. Undone.
- New line `gatherRates.food[after - 1] > 0`: I made the engine push 0 for the food rate. The run-out test failed at that line. Undone.
- `rateOf` via `effectStateOf`: I multiplied the pushed gather rate by 1.5. Both "villager-weighted" rows failed. Undone.

## Doc claims

None added or changed in this pass. The docs edits came from implementer-1, and review-1 checked them (`docs/aoe4-build-order.md:723`, `:898-899`, still present after the rebase).

## Pinned outputs

- The `gatherers` arrays in the two OpenAPI 200 examples are what the engine returns for the `buildOrder` and `goldRunOut` request examples at b39cba4 plus this branch:
  - `buildOrder`: food peaks at 7, wood at 1, gold and stone stay 0.
  - `goldRunOut`: food stays 0, wood peaks at 2, gold peaks at 5, stone stays 0.
- The contract spec's `toEqual` against the live handler passes.

## Invariant check

- A2: unchanged. This pass touched no engine code.
- A3: the generated examples equal the live responses, so the output is deterministic.
- S3: unchanged.

## Runtime

Node v24.22.2. The repo needs 24.x (REPO.md).

## Out-of-scope findings

None.

## Notes for the manager

- The page and pinned acceptance cases (the tooltip compare with a tolerance of at least 0.05, now that main rounds tooltip values) are still for the acceptance-test gate. I wrote no acceptance spec.

## Status

`needs_review`
