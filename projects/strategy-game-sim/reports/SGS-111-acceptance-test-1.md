# SGS-111 acceptance-test 1

Verdict: PASS. Commit 7d8b2d2 on sgs-111-drop-house-gate (tip was ce302bb). Not pushed.
File added: acceptance/aoe4-simulate-api-house-rule.spec.ts (8 tests, all pass). The implementer's house-gate and contract specs already covered the late-house case and the four-code list, so these tests cover the other criteria through POST /api/aoe4-build-order/simulate.

## Tests
1. No-house order: autoHouses off stops at supply with zero building spend; on buys houses and population keeps growing (criterion 3, default planning).
2. Reaction build house that never fires: auto-houses start, population passes the off run's limit, no `auto-houses*` code (criterion 4).
3. Explicit house started in each second around the first auto-house start: house count stays at the demand-driven two, no surplus (criterion 5).
4. Same order twice returns deeply equal bodies (A3).
5. OpenAPI `SimulationResult.warnings` description names the four remaining codes and no `auto-houses` (criterion 8/9).
6 to 8. english-1tc, english-knight-longbow, english-spear-longbow-maa-crossbow at 1800 s, autoHouses on: only the four remaining warning codes, no step `waiting` (criterion 10).

## Run
Harness: Playwright (acceptance:setup, own next dev). New spec 8/8 pass. With house-gate, contract, prebuilt-plans, prebuilt-farms and knight-longbow-build specs: 111/111 pass. `tsc --noEmit` clean, `lint:dup` 0 clones. No dev server left running.

## Mutation checks (all undone, `git diff --exit-code -- lib data docs` clean)
- `simulate.ts` startAutoHouses: `count = 0 * planAutoHouse(...)`. Failed test 1 (`finalBuildingSpend(on) > 0`, got 0), test 2 (`finalPopulation(on) > off`, 10 vs 10), test 3 (setup assertion), 1tc and knight-longbow (waiting step).
- `simulate.ts` houseBuilderSource replaced with undefined. Failed tests 1, 2, 3, 1tc and spear-longbow (waiting step).
- `simulate.ts` houseDemand `pending` emptied (planner ignores houses under construction). Failed test 3 (`finalBuildingSpend(none)` expected 100, got 200). An earlier version of test 3 compared against the no-house run and passed under this break (both runs mutated); rewritten to an absolute house count.
- `simulate.ts` planAutoHouse count plus `Math.random()`. Failed test 4 (equal results at line 78), plus 3, 1tc and knight-longbow.
- `docs/api/openapi.json:3631` appended ", then auto-houses-held". Failed test 5 (`not.toContain('auto-houses')`).

## Failures
None. No impl-defects or spec-gaps.

## Not expressible in this harness
- Criterion 1 and 2 (late-house case with autoHouses off proven first) are already pinned by the implementer's `aoe4-simulate-api-house-gate.spec.ts`; the "mutation restoring the gate" in criterion 2 was exercised by the first mutation above.
- Criterion "git grep returns nothing" and exact unchanged spear-longbow timings: unit-level digests in `simulate-house-gate.test.ts` cover timings. I did not run `git grep` or the unit suite.
