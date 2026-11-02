# SGS-035 implementer report 1

- Ticket: SGS-035 aoe4-engine-common-dup-check (risk high)
- Branch: `sgs-035-aoe4-engine-common-dup-check`
- Tip SHA: `6dec3b1c18129270c9724de952a20977c9bc24fc` (one commit on origin/main f078c11)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-035-aoe4-engine-common-dup-check
- Not pushed, no PR.

## Files touched

- `.jscpd.json`: new. Covers lib/aoe4-build-order, components/apps/aoe4-build-order, pages/api/aoe4-build-order; formats typescript and tsx; minTokens 70, minLines 8, threshold 0, gitignore.
- `package.json`: `jscpd` exact `4.3.0` devDependency, `"lint:dup": "jscpd"` script.
- `package-lock.json`: jscpd and its dependencies only. The root `name` is unchanged. The fsevents entry only moved because the sort order shifted.
- `ARCHITECTURE.md`: one Rules bullet naming `npm run lint:dup`, `.jscpd.json` and `lib/aoe4-build-order/test-helpers.ts`.
- `lib/aoe4-build-order/model.ts`: adds `SpendCategory` type and `GATHER_NODES` and `RESOURCE_KINDS` lists.
- `lib/aoe4-build-order/engine-common.ts`: new. `RESOURCE_TOLERANCE` (1e-9), `VILLAGER_ID`, `HOUSE_ID`, `costOf`, `canAfford`, `payCost` (clamp at 0 plus the spend category), `villagerWalkSeconds`, `markCompleted`.
- `lib/aoe4-build-order/simulate.ts`: uses engine-common. Local constants, `spend`, `affordable`, `villagerWalk`, `currentUnitEntry` and `new RegExp` are removed; the landmark class is now a regex literal.
- `lib/aoe4-build-order/research.ts`: uses engine-common for its constants, tolerance, cost, afford and pay. The `Math.sqrt(Number.EPSILON)` check is replaced by the shared tolerance.
- `lib/aoe4-build-order/houses.ts`: uses engine-common ids and tolerance for the projected shortfall.
- `lib/aoe4-build-order/format-time.ts` and `format-time.test.ts`: new home for `formatMinSec`, with its tests.
- `components/apps/aoe4-build-order/chart-rows.ts`: drops `formatMinSec`.
- `components/apps/aoe4-build-order/line-chart.tsx`: imports `formatMinSec` from format-time.
- `components/apps/aoe4-build-order/chart-rows.test.ts`: the formatMinSec block moved out.
- `lib/aoe4-build-order/parse-text.ts`: uses `formatMinSec` for `@m:ss` triggers.
- `lib/aoe4-build-order/test-helpers.ts`: new shared test helpers. `ENGLISH`, `Parts`, `at`, `editGameData`, `inputsFor`, `buildOrder`, `run`, `sampleIndex`, `series`, `countAt`, `withHandler`, `effectStateOf`, `tripInputsOf`. No production file imports it.
- Test migrations to test-helpers: `simulate.test.ts`, `simulate.acceptance.test.ts`, `simulate-construction.test.ts`, `research.test.ts`, `houses.test.ts`, `gather.test.ts`, `effects-gather.acceptance.test.ts`.
- `lib/aoe4-build-order/engine-common.test.ts`: new.

## Results

- `npm run lint:dup`: 0 clones, exit 0 (on main with the same config: 6 clones, exit 1).
- Failure demo: I copied lines 100-140 of simulate.ts into `lib/aoe4-build-order/dup-demo.ts`. `npm run lint:dup` reported 1 clone and exited 1. I deleted the file and the check went back to exit 0.
- `npx tsc --noEmit` (lint): exit 0.
- `npm test`: 29 files, 704 passed, 0 failed (baseline on main: 694).
- `npm ci && npx next build`: exit 0.
- `npm run acceptance`: 340 passed. The config gives each worktree its own port and sets `reuseExistingServer: false`. No processes of mine are left running; the playwright processes still running belong to the sgs-036 worktree session.
- Codegen: none configured.

### Acceptance greps

- `^const (RESOURCES|RESOURCE_TOLERANCE|VILLAGER|HOUSE|GATHER_NODE_ORDER)\b` in simulate/research/houses: 0.
- `new RegExp|currentUnitEntry|function (spend|affordable|villagerWalk)\b` in simulate.ts: 0.
- `Math.max(0, .*resources` outside tests: 1 match, in engine-common.ts:30.
- `git grep -l "test-helpers" -- lib components pages ':!*.test.ts'`: no file.
- No local `inputsFor`, `gameData`, `run`, `series`, `countAt`, `withHandler` or `at` in the six Scope-7 files.
  - effects-gather.acceptance.test.ts had two older block-local `at` lambdas with a different meaning. I renamed them `cycleAt` and `speedFor` so the name check is literally clean.
- `formatMinSec` is defined only in format-time.ts. line-chart.tsx and parse-text.ts import it.

### Changed expected values

None. No acceptance or unit expected value moved, including research affordability timings.

## New tests and what they encode

- engine-common.test.ts:
  - canAfford: a shortfall of 5e-10 is accepted and 2e-9 is refused (tolerance 1e-9).
  - costOf: scales every resource by the count.
  - payCost: clamps at 0 and adds the four-resource sum to its category (buildings 3 -> 78).
  - villagerWalkSeconds: divides by the move-speed multiplier (wheelbarrow 23/1.15).
  - markCompleted: stamps status and time on that step only.
- simulate.test.ts "adds every payment to the spend total of its category":
  - villagers, military, buildings (auto-houses counted, houses > 1) and research each equal their entries' cost totals.
- research.test.ts "waits with a reserve when the bank is short by more than the resource tolerance": when gold is short by 5e-9, the research does not start, reserves the cost and the step is 'waiting'.
- research.test.ts "paces auto-houses by the build time of the upgraded tier": pins spearman-3 at t=400 = 65.
  - The prototype's numbers (108/73) came from a different setup. These are pinned from this setup.
  - Mutating houseDemand to use the base-tier entry gives 57, so the test fails.
- houses.test.ts "treats a projected shortfall within the resource tolerance as none": a shortfall of 1e-10 per lead builds 0 houses; 1e-8 builds 1.

## Mutation checks

Each break was made, the test failed, and the break was undone (engine-common.ts checked identical to backup via `cmp`).

- engine-common.test.ts failed under each of these breaks:
  - tolerance changed to 1e-8
  - clamp removed
  - spent addition removed
  - walk divide removed
  - status not set
  - completedAt not set
  - cost scaling removed
- Spend totals test failed when:
  - startConstruction was charged to 'research'
  - every unit was charged to 'villagers'
  - research was charged to 'military'
- Research tolerance test: putting back the `Math.sqrt(Number.EPSILON)` check failed it.
- House tolerance test: changing the check to `shortfall <= 0` failed it.
- Tier auto-house test: using the base-tier entry in houseDemand gave 57 and failed it.
- simulate.test.ts literal-shape test: appending `export const EXTRA = 3;` to engine-common.ts failed it (1 failed, 56 passed). The file was restored and the `cmp` check confirmed it.

## Pre-existing tests edited

All are under Scope 7 (test migration) or follow from the moves in Scope 1-6. No assertion value changed.

- `data.acceptance.test.ts`, model-exports test:
  - Renamed to "model.ts exports exactly the 19 documented types and the two shared lists".
  - Adds `SpendCategory`.
  - The runtime-export assertion now expects `['GATHER_NODES','RESOURCE_KINDS']`, because the ticket moves those lists into model.ts.
- `simulate.test.ts`, numeric-literal source-shape test:
  - Renamed "...and the one shared tolerance".
  - simulate.ts and civ-rules.ts may now have no odd literal. The tolerance moved out, and anchored regex literals are stripped before scanning.
  - engine-common.ts must have exactly `['1e-9']` beyond 0 and 1.
- `simulate.test.ts`, "reads no clock or random source": engine-common.ts added to the file list.
- `chart-rows.test.ts`: the formatMinSec describe moved to format-time.test.ts unchanged.
- `simulate.acceptance.test.ts`, sampling and horizon tests:
  - They now call `simulateBuildOrder` directly through a local `until(steps, durationSeconds)`, because durations under 60 fail input validation in the shared `inputsFor`.
  - The other tests use `editGameData` and `run`.
- Across the migrated files:
  - Inputs passed as `inputsFor(x, {...})` are now raw override objects given to `run`.
  - Local helpers were replaced by imports, and `withResearchHandler` became `withHandler('research', ...)`.
  - Expected values are unchanged.

## Invariant check

- Resources are never negative: one clamp site in `payCost`, and every payment goes through it. Upheld.
- One affordability margin: simulate, research and houses all use `RESOURCE_TOLERANCE`, which is guarded by the literal-shape test. Upheld. This moves research's margin from sqrt(EPSILON) (about 1.5e-8) to 1e-9, as the ticket allows; no current expected value moved.
- No clock or random source in the engine; engine-common is now included in that test. Upheld.
- No hard-coded game numbers in the engine: ids and tolerance are single named constants and the literal scan covers engine-common. Upheld.
- Apps stay independent: nothing outside aoe4-build-order is imported. Upheld.

## Out-of-scope findings

- `parse-text.ts` still has its own `GATHER_NODE_ORDER`, and `validate.ts` its own `VILLAGER` (excluded by the ticket). Both could use `GATHER_NODES`/`VILLAGER_ID` in a follow-up.
- `parse-text.ts` now formats `@m:ss` triggers with the shared `formatMinSec`.
  - For a non-integer trigger second, rounding may differ from the old inline formatter.
  - No test covers fractional trigger seconds.
- `modified-value.test.ts` still defines its own `stateOf`, which duplicates `effectStateOf`. It is below the jscpd thresholds, so it was not required.

## Status

`needs_review`
