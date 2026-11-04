# SGS-084 review 2

- This is a full review after rework 1. Branch `sgs-084-aoe4-gather-rate-per-villager` at b37d34514e2a560ade597de4c5a46fed5e3b0980, base b39cba4. The branch is local only, so I reviewed it in a detached worktree created from that SHA. The worktree has since been removed.
- **Verdict: APPROVE.** There are no blocking findings.
- **The manager must act on one thing.** The branch no longer rebases cleanly onto current origin/main 9dfe36f (SGS-083). `line-chart.tsx` and `results.tsx` conflict. See "Rebase onto 9dfe36f" below.

## Blocking findings

None.

## Required fixes from review 1

1. **Run-out test now checks the rate. Done.**
   - `lib/aoe4-build-order/simulate-series.test.ts:268-269` holds both lines verbatim, directly after the `gatherers.wood` assertion.
   - The test title's claim, that the count drops at the same sample as the rate, is now asserted.
2. **`rateOf` uses the shared builder. Done.**
   - `simulate-series.test.ts:225-228` calls `effectiveGatherRate(node, effectStateOf({...}), defaults)`.
   - `effectStateOf` is imported from `./test-helpers`, line 8.
   - No hand-built `EffectState` literal is left in the file.
3. **Rebase onto b39cba4. Done, and each resolution is correct:**
   - **`docs/api/openapi.json`.** I loaded main's file at b39cba4 and the branch file into Python. I removed the branch's `gatherers` from both 200 examples, removed it from `SimulationResult.required` and `properties`, and reset `info.version`. The result is identical to main's file, key order included (compared as serialized JSON). So the ticket's edits are the only change. In detail:
     - `info.version` is 2.3.0. Main is 2.2.0 at both b39cba4 and 9dfe36f, because main's openapi.json did not change between them.
     - `"gatherers"` comes directly after `"gatherRates"` in `required`, and the property comes directly after `gatherRates` in `properties`.
     - The property has the specified shape: an object with food/wood/gold/stone required, `additionalProperties: false`, and each kind an array of integers with `minimum: 0`. The description text matches the ticket.
     - Both named examples, `buildOrder` and `goldRunOut`, have `gatherers` placed directly after `gatherRates`. Each series has `times.length` entries (13 and 37). At every sample, `gatherers[k][i] === 0` exactly when `gatherRates[k][i] === 0`.
     - The contract spec's `toEqual` against the live handler passes for both examples.
   - **`components/apps/aoe4-build-order/line-chart.tsx`.** Both edits are kept: the YAxis label has `textAnchor: 'middle'` (line 116), and main's `<Tooltip ... formatter={formatChartValue} />` is unchanged (line 117).
   - **`lib/aoe4-build-order/simulate-house-warnings.test.ts`.** It is byte-identical to main at both b39cba4 and 9dfe36f, and `git diff` is empty. The three digest pins are untouched and pass.

## Rebase onto 9dfe36f (for the manager)

`git merge 9dfe36f` from the tip conflicts in two files. I tried it in my worktree and aborted.

- **`line-chart.tsx`.**
  - Imports: main adds `ReferenceArea` to the recharts import, and the branch adds `type ReactNode` to the react import. Keep both.
  - Props: main adds a `highlight?: StepSpan | null` prop and a `highlight = null` default, and the branch adds `headerControls`. The resolution keeps both props and both destructured parameters.
- **`results.tsx`.**
  - Imports: main adds `import { useMemo, useState } from 'react'` as the first line. The branch adds `import { useState } from 'react'` after `cn`. The resolution is a single `import { useMemo, useState } from 'react'`. Two `useState` imports would not compile.
  - State: keep both blocks, main's `rows`/`active`/`highlight` and the branch's `perVillager`/`gatherRateSeries`.
  - The Gather rates `SeriesChart` already merges cleanly with both `highlight={highlight}` and the branch's props.
- `docs/aoe4-build-order.md` auto-merged.
- After the resolution, re-run tsc, `npm test` and the step-band and chart specs. A delta review of the conflict resolution is enough.

## Spec gaps

None.

## Acceptance criteria

- [pass, ticked] Shape. Evidence:
  - The prebuilt `it.each` (`simulate-series.test.ts:272-283`) checks the length, integer and non-negative values.
  - The Ajv check in `aoe4-gathered-resources.spec.ts` passes.
  - The contract spec's key table and documented 200 bodies pass.
- [pass, ticked] `4 sheep 2 wood` at t=0 gives 4/2/0/0, and food rate / 4 equals the sheep rate x 60. The test is the first row at `simulate-series.test.ts:230`. The "0 exactly when the rate is 0" check passes on every prebuilt build.
- [pass, ticked] `3 sheep 3 berry` gives food 6, and the ratio is the villager-weighted mean (row at `:231`).
- [pass, ticked] Builders are not counted (`:240-256`):
  - Wood goes from 4 to 2 at the first sample at or after `startedAt`, and the rate drops by `2*r*60`.
  - Wood is still 2 just after `completedAt`, and 4 again at or after `completedAt + walkSeconds`.
- [pass, ticked] Run-out: the count and the rate both drop to 0 at the same first sample after the run-out, and both are positive before it (`:259-270`).
- [pass, ticked] Pre-existing fields are unchanged.
  - The OpenAPI examples equal main's apart from the new key, and the contract `toEqual` against the live handler passes.
  - The `simulate-house-warnings.test.ts` digests are unchanged and pass.
  - `gathererCounts` writes nothing to the engine.
- [pass, ticked] OpenAPI: valid, `gatherers` is in `required`, and the version is 2.3.0, one minor above main's 2.2.0. The two version pins moved 2.2.0 to 2.3.0, which review 1 accepted.
- [pass, ticked] The `perVillagerSeries` table covers [120,60,0]/[4,2,0] giving [30,30,0], a zero count giving 0 (not Infinity or NaN), and the same keys and names as `resourceSeries`. The test file is `components/apps/aoe4-build-order/result-series.test.ts:82-108`.
- [not ticked; owned by the acceptance-test gate] Page toggle. I verified it by hand with a scratch probe, since deleted, on Knight/Longbow at 360, 390, 700 and 1280 px:
  - The box is unchecked by default and the label reads `Per minute`. Checking it changes the label to `Per villager per minute`, and unchecking restores it.
  - The other three y labels are unchanged.
  - At 10:00, the tooltip `Food` reads 396.3 unchecked, against `gatherRates.food[120]` = 396.29. Checked, it reads 44, against 396.29 / 9 = 44.03. Unchecking restores 396.3.
- [not ticked; owned by the acceptance-test gate] Pinned. I did not exercise a pin this run. In the probe, a `Gold` legend item hidden before the toggle stayed hidden after it (`aria-pressed=true`, and no `path[data-series="gold"]`). The pinned lines go through the same `gatherRateSeries` (`results.tsx:25,58`).
- [pass, ticked] Docs:
  - `git grep "Per villager"` matches `docs/aoe4-build-order.md:898-899`.
  - `git grep "number of villagers gathering"` matches `:723`.
  - The `Gather rates (per minute)` row is still at `:894`.
- [pass, ticked] There are no invariant regressions (see the next section).

## Invariants touched

- **A1 holds.** `gathererCounts` (`simulate.ts:748-756`) adds no literal. It reads `engine.gatherers` and the data file's node-to-resource map.
- **A2 holds.**
  - I traced `counts` (`simulate.ts:1019`): it is read only by `gatherers[kind].push(counts[kind])` at `:1023`.
  - It never reaches `creditIncome`, `nextWake`, `affordableAt` or any spend.
  - `incomePerSecond` is untouched.
- **A3 holds.** The function iterates the fixed `NODE_REFS` array, with no clock and no randomness. The OpenAPI examples reproduce the live handler output exactly.
- **S1 holds.** There are no cross-app imports.
- **S3 holds.** There is no new input or loop, and each series is bounded by `times.length`.

## Doc claims checked

- `docs/aoe4-build-order.md:723-724` says walking, building and idle villagers are not counted. Correct: the count reads only `engine.gatherers`, as review 1 established through `sendWalking` and `completeConstruction`. The builders test pins this.
- `docs/aoe4-build-order.md:898-900`, the toggle sentence. Correct:
  - The state starts as `useState(false)`.
  - The division is `count > 0 ? rate / count : 0`.
  - The label is conditional.
  - The pinned run uses the same function.
- `model.ts:131` "the divisor of gatherRates" and the OpenAPI descriptions. Correct: the count uses the same `NODE_REFS`, the same `> 0` filter and the same resource grouping as `incomePerSecond`.
- Commit messages: the author is `choinickolas@gmail.com`, there are no ids, PR numbers or process history, and each ends with the Co-Authored-By line. Shipped code and docs contain no factory references.

## Lint

- `npx tsc --noEmit`: clean.
- `npm run lint:dup`: 0 clones.
- No ESLint config exists.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so there is nothing to reconcile.

## Conventions compared

- `results.tsx` import order (`cn`, then `react`) matches `step-table.tsx:1-2`. The checkbox markup matches the step-table checkbox, as review 1 found.
- The `rateOf` helper now uses `effectStateOf`, as `effects-gather.acceptance.test.ts:66-67` does.
- `perVillagerSeries` tests follow the `resourceSeries` table and no-mutation tests in the same file.
- The `headerControls` wrapper uses only Bootstrap utilities, with no module CSS on the same element.

## Non-blocking notes

- **The run-out test does not catch a one-wake lag in the count.** I mutated `simulateBuildOrder` so the count lags one wake behind the engine. The builders test and the prebuilt "0 exactly where the rate is 0" table caught it (4 failures). The run-out test alone did not, because the run-out wake and the next wake fall before the same sample. Its assertions do match its title, so this is not a finding.
- **Carried over from review 1, still acceptable:**
  - `gathererCounts` could be `incomePerSecond(engine, () => 1)`.
  - `s.key as ResourceKind` in `result-series.ts:24` is a cast.
  - The walk-back check uses `defaults.walkSeconds`.
- **Tooltip overflow at 360 px.** While the Gather rates tooltip is open, the document is 1 px wider than the viewport. With no hover, after a run and after toggling, overflow is 0. The overflow comes from the recharts tooltip, not this diff, and 360 px is outside the layout-width set (390/700/1280).
- **`rateOf` style.** It is an arrow function with a block body and a single `return`. An expression body would be shorter. This is cosmetic.

## Coverage

- Reviewed: the full diff b39cba4...b37d345 (13 files) and the two-commit history.
- Read for context:
  - `simulate.ts`: `gatherRatesOf`, `incomePerSecond`, `recordRunOuts` and the sample loop.
  - `line-chart.tsx` lines 110-145.
  - `test-helpers.ts`: `effectStateOf`.
  - `chart-legend.tsx` and `chart-rows.ts`: `formatChartValue`.
  - The 9dfe36f changes to `line-chart.tsx` and `results.tsx`.
- Ran:
  - `npm ci`
  - `npx tsc --noEmit` and `npm run lint:dup`
  - `npm test`: 46 files, 1444 passed, 10 skipped.
  - `npx next build`: exit 0.
  - Playwright on `aoe4-gathered-resources`, `aoe4-simulate-api-contract`, `aoe4-simulate-api-edges`, `aoe4-simulate-api-issue-shape`, `aoe4-chart-readability` and `aoe4-build-order-pin-compare`: 141 passed.
  - A scratch page probe at 360, 390, 700 and 1280 px, since deleted: toggle values, labels, legend persistence, y label inside the SVG, overflow, and screenshots.
  - One engine mutation, reverted.
  - A trial merge of 9dfe36f, aborted.
- REPO.md checklist:
  - Every diff: I built and loaded the page.
  - AoE4 build order: design-doc sentences, no copied helper (fixed), chart widths, no overflow and no overlapping labels in the screenshots. I found no Bootstrap/module-CSS mixing.
  - Other sections: not applicable.
- Not run: the full `npm run acceptance`.
- No process I started is still running. Playwright's webServer stopped itself.
