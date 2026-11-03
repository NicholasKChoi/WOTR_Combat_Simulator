# SGS-081 implementer report 4

Ticket SGS-081, branch `sgs-081-aoe4-retune-prebuilt-farms`, tip `f0fe3d6` (on `2fc9593`), worktree
`$FACTORY_DIR/worktrees/sgs-081-aoe4-retune-prebuilt-farms`. Status: needs_review.

## Per build at 1200 s (default inputs, depletion on)

| Build | villager | spear | longbow | MAA | xbow | knight | food/min | floating food / wood / gold / stone |
|---|---|---|---|---|---|---|---|---|
| ENG Spear/Longbow into MAA/Crossbow (floors 61/8/8/21/13, 780) | 70 | 12 | 41 | 23 | 47 | - | 1484 | 1281 / 1556 / 956 / 0 |
| ENG Knight/Longbow (King's Palace) (floors 61 vil, longbow 36, knight 23, 1180) | 79 | - | 49 | - | - | 31 | 1557 | 1427 / 1460 / 98 / 0 |
| ENG 1TC (floors 50 vil, spear 39, longbow 39, 490) | 50 | 77 | 66 | - | - | - | 755 | 1691 / 1744 / 853 / 0 |

Cap 2000 on each floating resource. Unit types at 3600 s are exactly the README's for each build. 1TC villagers
sit exactly on the floor (50): more farms or buildings in the search either lowered villagers or pushed food/wood over the cap.

## Files touched
- data/aoe4-build-order/builds/english-spear-longbow-maa-crossbow.json: rebuilt, 72 steps (was 30).
- data/aoe4-build-order/builds/english-1tc.json: steps 0..23 and the gold reaction unchanged; 16 steps added (all `time` 420): 2 barracks, 2 ranges, 10 farms from wood, produce spearman, produce longbowman. Reaction now index 40.
- english-knight-longbow.json: unchanged (already meets floors).
- lib/aoe4-build-order/production-floors.ts (new): table and 2000 cap, exact values.
- lib/aoe4-build-order/builds.test.ts: one floors/cap case in the per-build block.
- acceptance/aoe4-simulate-api-prebuilt-farms.spec.ts: spear describe and MAX_SPEAR_LONGBOW_STEPS removed; one 1200 s floors/cap case per build via shared constants.
- data/aoe4-build-order/README.md, docs/aoe4-build-order.md: prose.
- Re-pinned tests: see below.

## Tests
`npm test`: 1349 passed, 10 skipped (45 files). `npx tsc --noEmit` clean. `npm run lint:dup` 0 clones. `npx next build` ok.
`npm run acceptance -- acceptance/aoe4-*.spec.ts`: 510 passed.

## Pre-existing tests edited (Scope 3 rule: pins moved by the rebuild, re-derived from engine output)
- simulate-house-warnings.test.ts "leaves every field of %s at 1800 s": 1TC digest e7f2436b024f722f -> c1b3ee597d0a715f; spear digest ff99aa3c294f415f -> 813cdb5546b36b2a. Held warnings still null.
- simulate-triggers.test.ts "keeps every ENG 1TC start time": toHaveLength(25) -> 41 (steps added).
- acceptance depletion-engine.spec "differs only by the farm builders joining": floating food 400.1852203506393 -> 3362.1519434319575; last food rate 523.6100713570142 -> 995.7918852029113; floating wood 8506.4628655923 -> 1744.3669834624384.
- acceptance house-lead-time.spec english-1tc row: cap 1755.1554493716328 -> 1123.5136143233474; population ff20f5fd6993f85f -> 2c7858c3730c4b6d; spent 631b1baf519287b2 -> 17f919a70b935f80; steps 6370e5d0b08d64b6 -> aa01e195ada588f4 (warnings digest unchanged).
- acceptance spear-longbow-build.spec: MAN_AT_ARMS_STEP 24 -> 35; CASTLE_LANDMARK_SECONDS 757 -> 681; MAN_AT_ARMS_START_SECONDS 767.6367192366768 -> 696.4094792663907.
- acceptance timelines.spec: 1TC final counts [57,51,50] -> [50,77,66]; appended step at 41: {589.4333333333333, 621.8190476190476, 81.06666666666666} -> {663.79070191445, 689.4337376804352, 0}; next {711.0333333333333, 801.0333333333333, 121.60000000000002} -> {711.0333333333334, 801.0333333333334, 47.242631418883434}; floating food 618.3789316586852 -> 2265.5487109294777; wood 3269.775976995086 -> 32.0282953026499.
- acceptance triggers.spec "keeps every step start time of the infinite-node run": `STARTED_AT.length + 1` -> `english1tc.steps.length`, and the null check moves to `steps.at(-1)` (the reaction is the last step, no longer index 24).
- acceptance spend-population.spec: the two 1TC assertions that need a run below the 200 population cap now pass `durationSeconds: 1000` (1TC now reaches the cap at 1123.5 s, so at 1200 s the "null cap" and "one unit ahead" assertions no longer apply); "one unit ahead" also multiplies by the built barracks and range count (3 each; was 1 each). Nothing loosened: same assertions on a horizon before the cap.
- Pins that did not move and were left alone: step 0..23 timings in depletion-engine and triggers specs, knight/longbow pins, veterancy, research, markers.

## Doc claims added or changed
- README opening: "Each build also meets production floors and a floating cap at 1200 s (...) set in `lib/aoe4-build-order/production-floors.ts` and checked in `lib/aoe4-build-order/builds.test.ts`": production-floors.ts exports both; builds.test.ts imports them. No floor numbers in README.
- README spear entry, farms/production paragraphs: verified against the file (4 mill farms, 3 at 210, 4 at 320, 4 at 380, groups 740/870/890/900 of 5/6/2/4; barracks at the two steps after the council hall, 3 ranges after; MAA step trigger 681 = ceil of the King's Palace completion 680.31; xbow on instance 1; 4 barracks + 3 ranges built at 700; produce steps at 790 with instances 3..6 and 4..6).
- README 1TC "Added after the guide": matches the 16 added steps, all trigger 420 (the `steeled-arrow` research trigger).
- docs "Each also meets its production floors and floating cap at 1200 s": builds.test.ts case.

## Mutation checks
- MAX_FLOATING_AT_1200 2000 -> 1000: floors case failed (3 builds); restored.
- 1TC foodPerMinute 490 -> 9000: failed; restored. Row key renamed: failed ("has a row"); restored. 1TC villager 50 -> 51: failed; restored.
- Build files reverted to `2fc9593`: case fails for spear/longbow (villager 60 < 61) and 1TC (spearman 36 < 39); restored.
- Prebuilt-farms acceptance floors case: same constants; passes with the rebuilt builds (not separately mutated).

## Notes
- Search method: scratch vitest harness (removed) swept candidate step lists; not committed.
- Spear/longbow keeps spear/longbow production on the barracks and ranges not named by the Castle `instance` steps (wood sink); the 681 trigger must be re-checked if an earlier step moves Castle.
- The file has 72 steps (limit 200). 1TC: pre-existing sheep `node-depleted` warning unchanged.

## Out-of-scope findings
None.
