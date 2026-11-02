# SGS-035 review 1

Verdict: **REQUEST CHANGES**

Branch `sgs-035-aoe4-engine-common-dup-check`, tip `6dec3b1` (one commit on `origin/main` `f078c11`; the branch is not pushed). Full review, first pass.

## Blocking findings

1. `ARCHITECTURE.md:42-44` - contract (doc) - The new Rules line says "The AoE4 build order has no copied code" and that `npm run lint:dup` "fails on any duplicated block". `.jscpd.json` only reports clones of at least 8 lines and 70 tokens (`minLines: 8`, `minTokens: 70`). Shorter copies pass: a copied tolerance constant, a 3-line helper, or a regex. That is exactly the drift REPO.md's AoE4 review checklist warns about. Any added doc sentence that the code contradicts is blocking. Direction: state the bounds. For example: "`npm run lint:dup` (config `.jscpd.json`) fails on any duplicated block of 8+ lines / 70+ tokens in its lib, components or API route; smaller copies are caught in review". Also drop or soften "has no copied code".

## Spec gaps

None.

## Acceptance criteria

- PASS: `lint:dup` exits 0 with 0 clones. I checked out main's `lib`, `components` and `pages` with the new `.jscpd.json` and got 6 clones, exit 1. All 6 are in the Scope-7 test files: simulate.acceptance/simulate `withHandler`, simulate-construction/simulate x2, research/simulate, effects-gather.acceptance/gather x2. Restored cleanly afterwards.
- PASS: `lint:dup` can fail. I copied exactly 10 lines of `simulate.ts` (houseDemand, 428-437) into `lib/aoe4-build-order/zz-dup.ts` and got 1 clone, exit 1, then removed the file. The implementer report says the same check was run and reverted. The PR body is not written yet, so the manager must carry that statement into it.
- PASS: `package.json` pins `jscpd` at `"4.3.0"` in devDependencies and has script `"lint:dup": "jscpd"`. `npx tsc --noEmit` exits 0. The lockfile diff only adds entries; the one `fsevents` hunk is a reorder, not a removal.
- PASS: `^const (RESOURCES|...)` grep: 9 lines on main, 0 after.
- PASS: `new RegExp|currentUnitEntry|function (spend|affordable|villagerWalk)` grep: 6 on main, 0 after.
- PASS: `Math.max(0, .*resources` grep finds 1 line, at `engine-common.ts:30`.
- PASS: no non-test file imports `test-helpers`. None of the migrated test files defines a local `inputsFor`, `gameData`, `run`, `series`, `countAt`, `withHandler` or `at`.
- PASS: `engine-common.test.ts` covers the canAfford bounds, payCost clamp and `spent`, villagerWalkSeconds with and without a move-speed tech, and markCompleted. Mutation `RESOURCE_TOLERANCE = 1e-8` fails the canAfford test, the research tolerance test and the literal-shape test.
- PASS: spend totals test (`simulate.test.ts`). It reads the villager cost from game data. Mutating startConstruction to `'research'` fails it.
- PASS: research tolerance. Wheelbarrow costs 0f/50w/150g, the start is gold - 5e-9 and there is no gold income, so the research stays waiting. Restoring the inline `Math.sqrt(Number.EPSILON)` check fails the test.
- PASS: house tolerance. Mutating to `shortfall <= 0` fails the test.
- PASS: tier auto-house test (research.test.ts, age 3, spearman-3 time 5). It pins 65 at t=400; the `byBaseId...[0]` mutation gives 57 and fails it, and also fails 3 existing research tests.
- PASS: behavior unchanged. `npm test` passes 29 files, 704 tests. `acceptance/aoe4-build-order.spec.ts` passes 12. `aoe4-simulate-api*.spec.ts` passes 117. `npx next build` exits 0.
- PASS: `formatMinSec` is defined only in `lib/aoe4-build-order/format-time.ts`, with 0 mentions in `chart-rows.ts`. `line-chart.tsx` and `parse-text.ts` import it. The test rows are kept. For `parse-text.ts formatTrigger`, `triggerSeconds` is validated as an integer, so output is unchanged.
- PASS (text present): `ARCHITECTURE.md` mentions `npm run lint:dup`, `.jscpd.json` and `test-helpers.ts`. The wording is wrong, though; see blocking finding 1.
- PASS: no INVARIANTS.md regressions (see below).

Ticket boxes are not ticked because the verdict is REQUEST CHANGES.

## Invariants touched

- A1 (no game numbers in code): holds. Costs, move speed, house and villager data come from game data. The ids `villager` and `house` were already literal ids. The literal-shape test allows only `1e-9` in engine-common.
- A2 (resources never negative, waits reported): holds. `payCost` clamps at 0. Research and houses use the shared tolerance. Waits still report `reserve`.
- A3 (determinism): holds. engine-common has no clock or random, and the no-clock test now includes it.
- S1 (app independence): holds. No combat-simulator or shared-app files are touched.

## Bot reconciliation

No reviewBot.cli or rulesFile is configured in REPO.md, so there are no bot findings.

## Non-blocking notes

- `type Resources = Record<ResourceKind, number>` is declared in both `engine-common.ts:14` and `simulate.ts:92`. It could be exported once.
- The comment on `RESOURCE_TOLERANCE` (`engine-common.ts:8`) explains only the bank-affordability case, but the constant now also governs the auto-house shortfall (`simulate.ts:523`, `houses.ts`). One clause would cover it.
- The implementer report's lint:dup failure demo used a 41-line block. The criterion says 10 lines; I verified that a 10-line block also fails.
- Edited pre-existing tests are all justified:
  - the data.acceptance export list (new runtime exports);
  - simulate.test literal-shape (stricter `toEqual([])`, strips anchored regex literals);
  - sampling tests now call `simulateBuildOrder` directly because the shared `run` validates and `durationSeconds` min is 60;
  - `cycleAt`/`speedFor` renames;
  - research.test `tierCountAt` keyed by unit id.

## Out-of-scope follow-ups (for the manager)

- `lib/aoe4-build-order/gather.ts:6` uses the literal `'villager'`; it could use `VILLAGER_ID`.
- `components/apps/aoe4-build-order/result-series.ts:4` `RESOURCE_ORDER` duplicates `RESOURCE_KINDS`.
- `modified-value.test.ts` `stateOf` duplicates the test-helpers `effectStateOf`.
- `validate.ts` `VILLAGER` and `parse-text.ts` `GATHER_NODE_ORDER` were excluded by the ticket (SGS-040 covers the latter).

## Coverage

Reviewed every file in `git diff f078c11...HEAD`: engine-common.ts and its test, simulate.ts, research.ts, houses.ts, model.ts, format-time.ts and its test, parse-text.ts, chart-rows.ts, line-chart.tsx, test-helpers.ts, the seven migrated test files, simulate.test.ts, data.acceptance.test.ts, .jscpd.json, package.json, package-lock.json and ARCHITECTURE.md.

Ran tsc, lint:dup (branch, main and mutation), npm test, next build, the AoE4 Playwright specs, and five targeted mutations.

Not done:
- I did not load the page manually in a browser. The Playwright page spec loads it and renders the charts.
- The 1280px chart check does not apply: the chart change is an import only.
- The combat-simulator Playwright specs were not run because the diff does not touch them.

REPO.md and LESSONS.md have no missing review-checklist sections.
