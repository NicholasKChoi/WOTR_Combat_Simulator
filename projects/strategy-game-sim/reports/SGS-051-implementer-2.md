# SGS-051 implementer report 2 (rework 1)

- Branch `sgs-051-aoe4-build-knight-longbow`, worktree `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-051-aoe4-build-knight-longbow`
- Base 835aceb (origin/main). Previous tip e25e534. New tip **3d46184**: one commit on top, "Retune the knight/longbow build so both archery ranges produce".
- Status: **needs_review**

## Files touched in this pass

- `data/aoe4-build-order/builds/english-knight-longbow.json`: retuned. It now has 62 steps, the five reactions sit at indexes 57-61 at the end, and the file ends with a newline like `english-1tc.json`.
- `lib/aoe4-build-order/builds.ts`: the `BUILDS` array is now one entry per line. Same order (ENG 1TC first).
- `data/aoe4-build-order/README.md`: entry rewritten to match the retuned build, with the measured causes and run-out times.
- `lib/aoe4-build-order/builds.test.ts`: unchanged in this pass. Its two King's Palace cases from pass 1 still apply.

## Required fixes (all ticked in the ticket)

1. **Both ranges produce; retuned.** Changes to the build:
   - The second `produce longbowman from archery-range` step now comes after the second range is built (steps[24], started 512.0 s). The second range finished at 487.0 s, so the step orders both ranges.
   - The step `move 12 farm to gold` is removed. Instead, `@5:30 rally capital-town-center -> gold` is followed by `rally capital-town-center -> farm` once the palace step starts, then `@12:00 rally capital-town-center -> wood`.
   - Three `build house` steps now sit before the second produce step.
   - A fourth farm block at `@10:00` is added.
   - The castle blacksmith techs are added.
   - The 5:15 farms are now built from sheep, not wood.
2. **Reactions last.** The five `whenever <ref> runs out move all ...` steps are steps[57..61], after the 18:00 farms.
3. **The 14:00 farms start at 14:00.** Castle now completes at 777.8 s, before 840 s, so the farm blocks after `produce knight` start at their trigger times:
   - @14:00 at 840.0 s
   - @16:00 at 960.0 s
   - @18:00 at 1080.0 s

   The new @10:00 block (before `produce knight`) starts at 601.5 s. The README says "farms at 10:00, 14:00, 16:00 and 18:00, four each, and each block starts at its time".
4. **Causes corrected** (below and in the README).
5. **`builds.ts` is one entry per line.** Mutation checks were re-run against the retuned file (below).

## Measured result, for the PR body

All figures at default inputs, depletion on.

| | Measured | Reference | Cause of the gap |
|---|---|---|---|
| Castle (`ages` age 3 `reachedAt`) | 777.8 s (12:57) | ~804 s (13:24) | About 26 s early. The palace pays at 552.8 s because new villagers have gone to gold since 5:30: gold income reaches 407-444/min by about 540 s. In pass 1 it was 74/min until 670 s. |
| Knights at 1200 s | 31 | ~23 | More knights: the castle comes earlier, and food stays positive because new villagers go to farms from 9:12 to 12:00. |
| Longbowmen at 1200 s | 54 | ~54 | Matches. Both ranges produce from 512 s. |
| Upgrade gold | 1,750 (4x125 Feudal blacksmith + 250 `veteran-longbowmen` + 4x250 Castle blacksmith: `balanced-projectiles`, `wedge-rivets`, `decarbonization`, `insulated-helm`), last one done 1034.7 s (17:14) | ~1,750, done ~18:07 | Matches. It finishes about 53 s earlier because the castle comes earlier. |

Other figures for the PR body:

- **Feudal landmark:** `abbey-of-kings`. It is the same landmark as ENG 1TC, so the first five minutes are the already-tuned 1TC opening.
- **Gold deposits:** N = 5.
- **Run-out times and reactions:**

  | Deposit | Runs out at | Reaction |
  |---|---|---|
  | `gold` | 931.9 s (15:31) | steps[57] `whenever gold runs out move all gold to gold#2` starts at 931.9 s |
  | `gold#2` | 1477.3 s (24:37) | steps[58] |
  | `gold#3` | 2022.7 s (33:42) | steps[59] |
  | `gold#4` | 2568.2 s (42:48) | steps[60] |
  | `gold#5` | 3113.6 s (51:53) | steps[61], `-> wood` |

  Every gold warning is `info`. The only `warning` is `node-depleted` on sheep at 997.9 s, which the bar allows.
- **Source:** `hand-authored for this simulator`. I did not search for a public guide in this pass and have no web access here. The PR body should say that no matching public "knight and longbow into a King's Palace Castle" guide was used, so the build is hand-authored.

## Causes of the pass-1 gaps (measured, as the review asked)

- **Castle 905 s in pass 1:** gold income was 74/min until `move 12 farm to gold` at 670 s, so the palace's 600 gold was affordable only at about 680 s. Before that, the stable, range and stable each waited 48-69 s on wood.
- **17 longbowmen in pass 1:** two causes.
  - One range never produced: the only produce step started before the second range existed.
  - Wood was short.

  Food was never the limit: it floated 3,000-5,000 from about 540 s. The pass-1 report's "starved of wood and food" was wrong.
- **New finding while retuning: population stalls during the King's Palace build.**
  - Auto-houses count supply under construction as headroom (`simulate.ts` `houseDemand`, where `pendingSupply` sums `constructing`; used by `houses.ts` `planAutoHouse`). The King's Palace gives 10 supply (`rules/english.json` `supply.kings-palace`) and takes 220 s to build.
  - While it is under construction, the planner sees 10 more headroom than exists, so it starts no house. Population sits at the cap (40) and all production stops until the palace completes. In a probe without the fix, nothing was spent from 660 s to 764 s.
  - The three explicit houses before the palace keep supply ahead.
  - They must be early in the list. `houseGateOpen` keeps auto-houses off until the order's last `build house` step has started, so a house step placed late in the list deadlocks the build at the pop cap. I measured this: step 21 stuck on `population` at 452 s.

## Tests

- `npm test`: 37 files, 998 passed, 4 skipped.
- `builds.test.ts`: 21 passed, 4 skipped. The shared suites cover the new build: validates, round-trips, bar parts 1-3 at 1200/3600 s, parts 4-5 at 1200/3600 s. The two King's Palace cases also pass.
- What the tests encode:
  - A1: no `amount` key, checked by jq (prints `false`).
  - A2: no step waiting, and every non-reaction step started, at both horizons.
  - A3: the build is data only.
  - The bar's gold rule: each run-out is left at its instant, and there is no gold `warning`.
- Pre-existing tests edited: none.

## Mutation checks (each undone with `git checkout`; tree clean after)

1. Deleted the first gold reaction (steps[57]). Three tests failed:
   - "moves every gatherer off a gold deposit ... by 1200 s"
   - the same test at 3600 s
   - "runs several gold deposits dry by 3600 s"

   Part 4 is non-vacuous at 1200 s too, because `gold` now runs out at 931.9 s.
2. Moved the four Feudal blacksmith research steps before `build kings-palace`. "researches its blacksmith techs after the King's Palace starts" failed.
3. Dropped the `gold#2`..`gold#5` reactions. "moves every gatherer ... by 3600 s" failed.
4. Raised the dry-deposit threshold in the test from `> 1` to `> 5`. "runs several gold deposits dry by 3600 s" failed. Restored.

## Other stages

- jq order check: the minimum Feudal blacksmith research index is 29, which is greater than the palace index 27.
- Codegen: not set.
- Lint: `npx tsc --noEmit` exit 0; `npm run lint:dup` found 0 clones.
- Build: `npx next build` OK.
- `npm run acceptance`: 522 passed.
- Diff scope: `git diff --stat 835aceb` shows only the four allowed files (README, JSON, `builds.test.ts`, `builds.ts`).
- No processes left running.
- Runtime: Node 24.22.2 via nvm. The shell default is 22.17.0.

## Invariant check

- **A1 holds.** No amount key and no restated cost, rate or duration. Only time triggers, villager counts and builder counts are used.
- **A2 holds.** No step is waiting at 1200 or 3600 s, and every non-reaction step has started.
- **A3 holds.** The build is data only, with no engine change.

## Out-of-scope findings

- `lib/aoe4-build-order/houses.ts` `planAutoHouse` (with `simulate.ts` `houseDemand`) treats the supply of buildings under construction as headroom available now. Supply from a 220 s landmark under construction therefore suppresses auto-houses, and production stalls at the pop cap until the landmark completes.
  - Evidence: this build without its three explicit houses spends nothing from 660 s to 764 s at population 40.
  - Any build whose landmark or town center gives supply has the same problem. It is worth a BACKLOG entry: count pending supply only from items that finish within the house lead time.
