# SGS-032 acceptance-test 1

Result: PASS. Branch sgs-032-aoe4-research-veterancy, tip 7e41e68 (local, not pushed), on 422b26f.

File: lib/aoe4-build-order/research.acceptance.test.ts (23 tests, through module exports, following simulate.acceptance.test.ts). Vitest on lib/aoe4-build-order: 16 files, 542 tests pass; `npx tsc --noEmit` clean. No production code edited.

## Tests
- Delay and tier: spearman barracks plus `@0:05 research veteran-spearmen`. The research is paid at 5 (food -100, gold -250 against the plain run), runs 15-75, and the next spearman spawns at 90 as spearman-3 (plain run: second spearman at 30). Tier series are 2 and 3. Villagers are unchanged while population room remains.
- Tier fixed at payment: two barracks, spearman time 100, veteran time 40. The unit paid at 0 spawns at 100 as spearman-2 although the upgrade finished at 40. The unit paid at 45 spawns at 145 as spearman-3. `resolveUnitEntry` gives the lowest tier with nothing researched, the tier-3 entry with the upgrade researched, and undefined for an unknown unit.
- Research target (through a wrapper on `stepHandlers.research`, restored in `finally`): capital-town-center before town-center; fall through when there is no capital; `at town-center` goes to instance 1 even with instance 2 paused.
- A2: short of gold only, so `startedAt` equals 100/(5 x goldRate), floating never below 0, and food stays at or above the 50 reserve while waiting. Cases with no target (wheelbarrow at mill), an unreached age (veteran-spearmen at age 2), and no producer or `at` (upgrade-king-3) are each `waiting` with `startedAt` null, the next step `not-reached`, and (for the no-target case) the villager series equal to the plain run, so nothing is reserved.
- Techs apply from completion: wheelbarrow at a mill costs 50 wood and 150 gold at 0, `completedAt` is at least 90, gather rates match the plain run before completion and are higher after, and villagers are unchanged. One test checks that wheelbarrow changes at least one node's rate, so the rate test can fail.
- Queue sharing: textiles at the capital-town-center from 5 runs 20-40 behind the villager paid at 0, which spawns at 20. No villager spawns until the order resumes and the next one spawns at 60.
- Notes: admiralty is `tech-effect-unmodeled` with `properties: []`; bloomery is `tech-effect-ignored` with `['meleeAttack']`. Both are in step order even though no step is reached. shaft-mining, wheelbarrow and veteran-spearmen give no note. Notes are equal across runs and equal to `researchNotes(order, data)`. A full-result `toEqual` over two runs pins determinism.

## Mutation checks
Each break was applied to research.ts, the file was rerun, and it was reverted with `git checkout -- research.ts`. `git diff --exit-code` on research.ts is clean.
- `resolveUnitEntry` returns `entries[0]`: 3 failures.
- Skip `state.researched.add`: 3 failures.
- Skip the cost subtraction: 2 failures.
- Drop the `reserve` return: 1 failure.
- Drop the age check: 1 failure.
- Reverse the candidate order: 1 failure.
- Take the last instance rather than the first: 3 failures.
- Note classification `effects-unmodeled` disabled: 1 failure.
- Ignored note `properties` emptied: 1 failure.
- Skip `completedAt`: 4 failures.

## Failures
None.

## Observations
- The ticket's Notes criterion says `research shaft-mining` yields a `tech-effect-unmodeled` note. The implementation gives none, because an overlay row grants its effect so it classifies as supported. The caller's brief and the dev test comment both expect no note, so I pinned no note. This is a spec-gap in the ticket text only: the Notes criterion should be updated to use `admiralty` as the unmodeled example.
- A waiting research step reports `startedAt: null`, not `undefined`.
- The reserve effect on order payments is only indirectly pinned: the food floor while waiting for gold, and the gold wait time. Dropping the reserve was caught by one test only.

## Not expressible
There is no HTTP boundary yet, so everything goes through `simulateBuildOrder`, `researchHandler`, `researchNotes` and `resolveUnitEntry`.
