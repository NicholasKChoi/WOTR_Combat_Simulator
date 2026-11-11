# build-259-default report

PR: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/122 (ready, not merged)
Branch: build-259-default, commit 36ceb1a, author Nick Choi <choinickolas@gmail.com>
Source: https://www.aoeivbuilds.com/build_orders/259 ("eng 1 tc", English, aoeivbuilds.com, no author listed)

## Changes
- New: data/aoe4-build-order/builds/english-1tc-council-hall.json, named "ENG 1TC Council Hall", with 61 steps.
- lib/aoe4-build-order/builds.ts: registered as the last entry in BUILDS.
- lib/aoe4-build-order/production-floors.ts: floors row with villager 50, spearman 60, longbowman 60 and food 900/min.
- docs/aoe4-build-order.md:
  - "four prebuilt builds" list.
  - The 1TC gold-reaction sentence is generalized to every build named with 1TC.
- data/aoe4-build-order/README.md: an entry covering what was omitted, the transcription choices and what was added after the guide.
- Acceptance specs that enumerate builds: prebuilt-farms, prebuilt-plans and house-rule now include the new build.

## Corrections to the draft (smoke-drop-delete-reread worktree, left untouched)
- Removed the draft's invented 360/400 s rallies and its redundant 210 s rally.
- Dropped "(aoeivbuilds 259)" from the name.
- Council Hall is inferred as the landmark; the guide gives only units. Its builders come from sheep and return to sheep.
- Horticulture added. Fertilization kept and reached through an added White Tower.
- An explicit house step deadlocked, so it was dropped; auto-houses cover supply.
- Gold reaction gold->gold#2 placed first among the reactions, as the 1TC test requires.
- Everything after 7:30 was added to meet the repo's bars:
  - Range, second barracks, farms and blacksmith.
  - A gold#3 group of 8 wood villagers.
  - White Tower and the Castle techs.
  - Reactions gold#3->#4->#5->wood and sheep->farm.
  - Five farms at 900 s for the sheep villagers.
- military-academy is rejected by checkBuildOrder ("not supported: property buildTime"), so it was not used.

## Timing comparison
| Milestone | Guide | Simulated |
|---|---|---|
| Council Hall | 2:30 | 150 s |
| Feudal and first longbowmen | 4:29 | 269 s |
| Gatherers at 2:30 (food/wood/gold) | 4/3/3 | 4/3/3 |
| Continuous longbowmen and spearmen | 6:30 | 390 s |
| Farms | 7:00 and 7:30 | 450 s |
| Castle (added) | not in guide | about 906 s |

- At 1200 s:
  - 53 villagers, 68 longbowmen and 72 spearmen.
  - Food income of 1174/min.
  - Floating: food 1798, wood 1821, gold 1626, stone 0. The cap is 2000.
- The first gold deposit runs out at about 1974 s, and gold#2 does not run out within 3600 s.
- No step is waiting and there is no farm-idle warning at 1200, 1800 or 3600 s.

## Tests
| Check | Result |
|---|---|
| tsc | clean |
| lint:dup | 0 clones |
| npm test | 1972 passed, 13 skipped |
| next build | ok |
| npm run acceptance | 900 passed |

## Not expressible in the schema
- The guide's "push" and "attack" notes (no combat or movement).
- Exact villager splits per time. They are approximated by rallies.
- Explicit houses. Auto-houses are used instead.
- Pause does not stop default villager production, so the villager count cannot be capped. Population therefore reaches 200 before 1200 s, and the floats had to be absorbed by tech sinks and an added Castle age.
