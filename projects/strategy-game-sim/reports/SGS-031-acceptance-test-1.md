# SGS-031 acceptance-test 1

Result: PASS. Branch sgs-031-aoe4-build-move-ages, new tip cc00670 (on 301b322). Not pushed.

File: lib/aoe4-build-order/build-move.acceptance.test.ts (29 tests, all pass). Full unit suite 681/681 (25 files) and `npx tsc --noEmit` clean. Harness ran (vitest). No HTTP check (route is SGS-033).

## Tests written (hand-computed)
- Builder scaling: 30 s barracks with 1/2/4 builders completes at 5 + 90/(n+2) = 35 / 27.5 / 20, cost paid at start.
- A produce step on the newly built barracks starts at 27.5 and spawns man-at-arms at 42.15 and 56.8.
- Income dip and return: 4 gold, 2 builders from gold then sheep at @20: gold rate 4 -> 2 at the start sample, stays 2 after the return (builders went to sheep); sheep rate 4 at t=50 and 6 at t=55; step completes at 47.5 before the return at 52.5.
- Landmark age-up unblocks research: abbey-of-kings (3 builders) completes at 119, ages [1@0, 2@119]; `research horticulture` (age 2) starts at 119, wait 119, completes 164; gold/wood floats 800/500 then 700/450; food rate unchanged until 164 and higher after; without a landmark the research stays waiting.
- Age 2 building (stable): starts and pays at 119 after the abbey; at age 1 alone it never starts or pays.
- Auto-houses on a plain default order: villager counts equal floor(t/20) at every sample to 600 (pinned `autoHouses: false` counterpart stalls at 3); wood spent is a multiple of 50; floats non-negative.
- Build short of a resource: barracks with wood 100 and 6 wood gatherers starts at 50/(6 rw) with no partial payment; town-center with no stone waits to the horizon, wood untouched, next step not-reached.
- Move: chained moves (2 sheep -> wood, then 2 wood -> gold) start at 5 and complete at 10 with rates at 5 and 10; `from === to` with walkSeconds 7 dips then returns; an unfillable move waits.
- Builders and movers count as villagers for `at 7 vils` (armed at 20 in both).
- Research while a house builds: house done at 20 and wheelbarrow at 90, both start at 0, villager counts continue past supply 10 (10 at t=200); exact-fit wood/gold go to 0, never negative; research at @35 plus the auto-house at 40: wood 100, gold 50 at t=45, 6 villagers at t=120.
- Determinism: two runs deep-equal, order and inputs unmutated, no state carried across runs; resources non-negative.

## Mutation checks (each reverted with `git checkout`; `git diff --exit-code` on non-test files clean)
All failed as expected: construction builders+1 (10 failures); return builders to `from` instead of `then`; remove age advance; planAutoHouse returns 0; build never spends; skip the walk to the site; builders not counted walking; movers not counted walking; move does not deliver to `to`; move ignores the count wait; build ignores affordability; build ignores age; step completed at builders' return.
Two mutants initially survived (builders/movers not walking, build ignoring age); tests for `at N vils` and the age 2 stable were added and now kill them.

## Failures
None. No impl-defect or spec-gap found. One of my own initial hand numbers was wrong (supply 10 stalled the barracks scenario with auto-houses off, and the second man-at-arms spawns at 56.8); the test was fixed, not the code.

## Not expressible
HTTP route (SGS-033, unmerged). Hook-order and `moveSpeed` civ effect cases are left to the implementer's unit tests.
