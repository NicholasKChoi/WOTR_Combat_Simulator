# SGS-027 acceptance-test 1

Result: PASS. 21 new tests, all green. Commit c6c2b79 on sgs-027-aoe4-effects-gather-construction (not pushed).
File: lib/aoe4-build-order/effects-gather.acceptance.test.ts (vitest; the Playwright harness does not apply to pure lib code, and the existing vitest `*.acceptance.test.ts` convention was reused). `npx vitest run lib/aoe4-build-order`: 7 files, 111 tests pass. `npx tsc --noEmit` clean.

## Tests
- constructionSeconds: 100 -> 100/75/50/30 for n=1,2,4,8; numerator 4 / offset 3 override; RangeError for 0, 1.5, -1, NaN.
- Trip model: town-center walk without a drop-off, camp walk with lumber-camp (walks differ in the test GameData).
- Wheelbarrow: wood and sheep hand-computed with capacity 15 and moveSpeed x1.15; differs from unresearched.
- double-broadax: wood rate x1.15, gold unaffected. shaft-mining: gold and stone x1.15, wood unaffected.
- Mill farm bonus: age 2 x1.25, coverage 0.5 x1.125, age 3 x1.3, no mill x1, missing coverage x1.
- Calculator cross-check (labeled): 7 nodes within 0.05/min of 37.05, 32.93, 41.7, 36.718, 31, 37, 37.
- A1: changing the wood rate in a test GameData changes the output.
- Determinism and non-mutation for effectiveGatherRate and modifiedValue.
- King's Palace productionSpeed 1.1 only with the building and producer kings-palace; 1 with capital-town-center, no producer, or no building.
- Fishing-boat tech (extended-lines) leaves villager values unchanged.
- select.class set matching (all classes of one set), empty select matches nothing.
- change applied before multiply on one property (overlay rows, (10+5)x2 = 30).
- Coverage lookup ignores prototype-chain entries.

## Mutation checks (each broken in lib, test failed, then `git checkout --`; final `git diff --exit-code` clean)
offset +1 (2 failed); walk camp/TC swapped (1); `base*mult+change` (1, after strengthening, see below); nearBuilding weight forced 1 (1); producer condition removed (1); Object.hasOwn removed (2); select.id match forced true (1); class `every`->`some` (1); moveSpeed divisor dropped (1); age condition removed (1); `civ` grant disabled (2); empty-select guard removed (1).
The change/multiply-order mutant first survived (wheelbarrow touches different properties); I replaced that test with a same-property overlay test and the mutant now fails.

## Failures
None. No impl-defects or spec-gaps found.

## Not expressed
The grep for Math.random/Date in the three files and the "no game numbers in code" scan were not made into tests (static checks; the A1 behavior is covered by the changed-rules test for wood rate only, not for every OverlayEffect value).
