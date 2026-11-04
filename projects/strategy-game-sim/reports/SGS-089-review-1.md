# SGS-089 review 1

- Branch `sgs-089-aoe4-engine-guard-crashes-hangs`, tip `294a9f686bb85f72935ea45d2bc44571fddfb392`, base `b9481e3`
- Reviewed in a detached worktree `worktrees/review-sgs-089` (now removed). Full branch review.
- **Verdict: APPROVE**

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria

1. Zero-time villager rows (time 0; time/food/gold/popcap 0; each with autoHouses true and false): PASS. Four rows in `simulate.test.ts` `invalid engine input`, each asserting the exact message. Guard at `simulate.ts:592` covers both callers.
2. `productionModifier` 0 / -5 / NaN and `productionSpeed` multiply 0 (`got Infinity`): PASS. Template literal renders `0`, `-5`, `NaN`, `Infinity`, which matches the expected strings.
3. houseDemand pair: PASS. I re-ran the mutation myself: replacing the `productionSeconds` call in `houseDemand` with an unguarded division makes "checks the production time of an ordered villager that is never paid while auto houses plan supply" fail. The implementer reports the guard-into-startHead mutation fails it too.
4. Zero-time research still completes: PASS. `research.test.ts` is unedited and passes. The guard is limited to `entry.type === 'unit'`. The implementer's mutation 2 confirms the test catches a missing condition.
5. Rally rows (`capital-town-center` 1; `mill` 1 via the `villagerProducer` hook): PASS. `spawnUnit` throws `building "<baseId>" instance <n> spawned a villager but has no rally` before it schedules anything.
6. Supply-wait test pins the property: PASS. I re-ran the mutation (`reserve: costOf(entry, targets.length)` added to the `waitingOn: 'population'` return at `simulate.ts:378`), and the test fails. The `status === 'waiting'` assertion is kept.
7. Shipped builds unchanged: PASS. I ran this independently with a throwaway vitest dump of `JSON.stringify(simulateBuildOrder(b, g, inputsFor(g)))` for every `listBuilds()` entry, once on the branch and once with `simulate.ts` from `b9481e3`, then compared the files with `cmp`. `ENG 1TC` (56732 bytes), `ENG Knight/Longbow (King's Palace)` (65702) and `ENG Spear/Longbow into MAA/Crossbow` (62331) are byte-identical. Nothing from the script was kept.
8. No `rally!` in `simulate.ts`: PASS (grep finds no match).
9. Docs: PASS. The Rally rules bullet keeps the validation sentence and adds the throw. The new CivRules seams paragraph matches the code: `costs.time / speed`, then the hook, the unit-only check, and both call sites. I grepped `docs/aoe4-build-order.md`, `docs/api/openapi.json` and `civ-rules.ts`, and no remaining sentence says the engine never errors on these paths.
10. `npx tsc --noEmit` exits 0. `npm run lint:dup` finds 0 clones. `npm test`: 45 files, 1361 passed, 10 skipped. The implementer report lists the tests. PASS.
11. No invariant regressions: PASS (see below).

All 11 criteria are ticked in the ticket.

## Invariants

- A1: holds. No numeric literal was added. The guard rejects bad values and does not clamp them.
- A2: holds. No payment path changed. `payOrder` can run before `startHead` throws, but the run aborts, so no result is reported.
- A3: holds. Both guards only throw, and on the valid path the values are unchanged (`base` is the old `seconds`). The three shipped builds are byte-identical, and no `Math.random` or `Date.now` was added.
- S3: improved. The zero-cost, zero-time villager now ends with an error instead of looping.

## spec-checklist

- Contracts: no API or schema change, and `pages/api/aoe4-build-order/simulate.ts` is untouched, as the ticket says.
- Scope: nothing from CONTEXT.md Out of scope is touched. No `golang/` changes. No change to `data-schema.ts` or to the research-time guard, as the ticket requires.
- Naming: fine.

## Lint

`npx tsc --noEmit` is clean and `npm run lint:dup` finds 0 clones. No ESLint is configured (REPO.md).

## Review bot

`reviewBot.cli` and `rulesFile` are empty, so there was nothing to run.

## Conventions

- Error style matches the existing engine throw at `simulate.ts:816` (`throw new Error(...)` with a quoted baseId).
- Tests: two `it.each` tables plus one pair test, matching the table style in the file. `withHandler` capture follows the pattern at `simulate.test.ts:124-145` (the `rally` capture). The villager edit cast copies the sibling at `simulate.test.ts:660`. `withStart` is reused from the file's own helper.
- No comments added. No ids or factory pointers appear in the code, tests or docs.

## REPO.md review checklist

- Every diff: `npx next build` passes. No page or component changed (engine and doc only), so there is no page flow to load. Tests cover the behavior.
- AoE4 build order: no helper or constant was copied from another module. The doc sentences match the code, as checked above. No UI change, so no screenshots are needed.

## Non-blocking notes

- `docs/aoe4-build-order.md:275-278`: "...so the engine reports no rally error. If a villager spawns ... anyway ..., the engine throws an `Error`" reads a little self-contradictory. "Reports" means Issues, but a reader could stumble on it. The ticket asked to keep the sentence, so this is left as is.
- The `as unknown as` cast in `withVillagerCosts` (`simulate.test.ts`) copies line 660. `simulate-series.test.ts:96` shows the snapshot units are already typed and the cast is unnecessary. This is pre-existing style and not worth a rework.
- Out of scope (already known): `pages/api/aoe4-build-order/simulate.ts` has no try/catch, so either throw would surface as Next's default 500. Validated requests cannot reach either guard.

## Coverage

Reviewed the full diff: `lib/aoe4-build-order/simulate.ts`, `lib/aoe4-build-order/simulate.test.ts`, `docs/aoe4-build-order.md`. Also read `houseDemand`, `startHead`, `startAutoHouses`, `addBuildingInstance` (rally inheritance), the `produce` handler and `test-helpers.ts` `withHandler`. Ran: tsc, lint:dup, the full unit suite, next build, two mutation checks and the A3 byte comparison. Not re-run by me: the implementer's guard-into-startHead, unit-condition-drop, guard-removed (hang) and non-null-rally mutations. Those are recorded in the implementer report.
