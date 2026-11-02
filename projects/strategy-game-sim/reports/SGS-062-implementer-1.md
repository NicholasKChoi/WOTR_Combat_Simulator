# SGS-062 implementer report (pass 1)

- Ticket: SGS-062 aoe4 veterancy converts units
- Branch: `sgs-062-aoe4-veterancy-convert-units` (base origin/main 54d7e90)
- Tip: 998aa7d373d943bc5691626371d54218cb4b9a34 (one commit, not pushed)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-062-aoe4-veterancy-convert-units

## Files touched
- lib/aoe4-build-order/research.ts: adds `recordUnits` (ledger write) and `convertUnits(state, upgrade)`, which is called in the research complete callback right after `researchedIds.add`. Rewrites the resolveUnitEntry comment.
- lib/aoe4-build-order/simulate.ts:
  - `EngineState.spawned` ledger replaces `Engine.spawns`. The type is inlined because simulate.test.ts pins the exported seam names.
  - `spawnUnit` records the tier resolved at spawn, floored at the paid tier. Popcap and moveSpeed still come from the paid entry.
  - `unitSeries` lists a series only if it held at least one unit after all changes of some instant. Series are ordered by that first held instant, then unitId. Counts are the sum of deltas at or before each sample.
- lib/aoe4-build-order/model.ts: UnitSeries comment now gives the by-current-tier meaning.
- lib/aoe4-build-order/test-helpers.ts: `series()` sums every tier of the baseId per sample. Callers use it as "units produced", so their assertions are unchanged.
- lib/aoe4-build-order/research.test.ts: tests edited and added (see below).
- lib/aoe4-build-order/research.acceptance.test.ts: tests edited, plus the Knight/Longbow test.
- docs/aoe4-build-order.md: rewrites the Tiers paragraph, the veterancy scope bullet and the `unitsProduced` bullet.
- docs/api/openapi.json: changes the description text of `SimulationResult.unitsProduced`, `UnitSeries` and `UnitSeries.counts`. No schema change.

`git grep -n -i "keeps the lower tier\|tier is fixed when" -- docs lib acceptance` now returns 0 lines.

## Pre-existing tests edited (the ticket's spec change requires each one)
- **research.test.ts: 'pays the next spearman when the research ends, as the upgraded tier, 60 s later'**
  - Old: spearman-3 0@85, 1@90 and spearman-2 1@90.
  - New: spearman-3 1@85, 2@90 and spearman-2 0@90.
  - Why: the spearman spawned at 15 is converted when the research completes at 75.
- **research.test.ts: describe 'the tier is fixed when a unit is paid' (3 tests)**
  - Replaced by 'a unit spawns at the highest researched tier, with the cost and time of the tier it was paid at' (4 tests):
    - a unit paid before completion that spawns after it is spearman-3 only;
    - a unit paid after completion is tier 3;
    - an untimed run reads the tier at spawn;
    - cost and popcap are those of the tier paid (spearman-3 edited to 200 food and popcap 2).
  - The TC was dropped from that game so that villager production cannot mask the popcap difference.
  - Why: the ticket reverses "tier fixed at payment".
- **research.test.ts: 'paces auto-houses by the build time of the upgraded tier'**
  - spearman-3@400 changes from 65 to 66.
  - Why: a spearman paid at tier 2 during the research now spawns at tier 3. The per-baseId total is still 66.
- **research.acceptance.test.ts: line ~79 test**
  - Renamed to 'moves the spearman already spawned to tier 3 when the research ends, and spawns the next one 60 s later than without research'.
  - Now asserts spearman-3 0@70, 1@75, 1@85 and 2@90, and spearman-2 0@75.
  - The [unitId, tier] list is unchanged, since spearman-2 stays listed at 0.
- **research.acceptance.test.ts: describe 'the tier is fixed when a unit is paid'**
  - Renamed to 'a unit spawns at the tier researched when it spawns'.
  - Now asserts spearman-3 1@100 and 2@145, and that no spearman-2 series exists.
  - The resolveUnitEntry test in that describe is unchanged.

No other pre-existing assertion was changed. `series()` in test-helpers changed meaning (sum over tiers) and was not weakened; see mutation M14.

## New tests
research.test.ts, describe 'veterancy converts units already spawned' (games have no TC):
- Moves every unit below the tier up at the completion instant: [s2,s3,s4] = [3,0,0]@45, [0,3,0]@50.
- Keeps the lower series listed at 0, and orders series by first held instant (spearman-2, man-at-arms-1, spearman-3).
- Orders series that first hold units at the same instant by unitId.
- Converts nothing when the target has no entry at the upgrade age; later spawns stay spearman-2.
- Creates no series when no unit exists yet; a later spawn is spearman-3 only.
- Floor: with no spearman-4, a unit paid at tier 3 that spawns after elite is spearman-3, not spearman-2.
- Two upgrades at one instant: the units end up at spearman-4, and no spearman-3 series is listed.
- A lower upgrade completing after a higher one converts nothing, and no spearman-3 series appears.
- The per-baseId sum equals the single series of a run where the upgrade has no target.

research.acceptance.test.ts, Knight/Longbow at 1800 s:
- Veteran longbowmen completes in (845, 850].
- longbowman-2 is 12@845 and 0 at 850 and every later sample.
- longbowman-3 is 13@850 and 66@1800.
- Compared with a run where the longbowman-3 entry is removed (no conversion, equal tier costs):
  - every field except unitsProduced is deep-equal;
  - the longbowman series sum to the unconverted series at every sample;
  - every other unit's series is equal.

## Test counts
- research.test.ts: 55 passed.
- research.acceptance.test.ts: 25 passed.
- `npm test`: 40 files, 1088 passed and 8 skipped (pre-existing skips).
- `npm run acceptance` (Playwright, own per-worktree port): 551 passed.

## Mutation checks
Each break was applied alone and reverted from a saved copy. The tree was verified clean against the intended diff afterward.

| # | Break | Result |
|---|---|---|
| M1 | Drop the `convertUnits` call | 7 tests fail: conversion, order, two-at-once, lower-after-higher, the Knight/Longbow pins, and both edited research-ends tests |
| M2 | Drop the paid-tier floor (`resolved ?? entry`) | The floor test fails |
| M3 | Record the paid entry, not the tier at spawn | 7 tests fail, including all the tier-at-spawn tests and auto-houses |
| M4 | Convert any tier other than the target (`!==` instead of `<`) | lower-after-higher fails |
| M5 | First held at the first change rather than the end of the instant | two-at-once fails |
| M6 | Drop the unitId tiebreak | same-instant order fails |
| M7 | Sort by unitId only | conversion-order test fails |
| M8 | Count `<` instead of `<=` at a sample | 23 tests fail |
| M9 | Drop `held += delta` | 7 tests fail |
| M10 | List records that never held a unit | two-at-once fails |
| M11 | Pick the next tier when the age entry is missing | missing-entry test and Knight/Longbow equality fail |
| M12 | Popcap from the spawned tier | the cost/popcap test fails |
| M13 | Conversion adds one unit | 8 tests fail, including the sum tests |
| M14 | `series()` helper reads the first series only | the sum test fails |

- M10b: removing the `moved > 0` guard in convertUnits was unobservable, because a zero-delta record is never listed. I removed the guard as dead code.
- Every test written or changed failed under at least one break.

## Stages
- `npx tsc --noEmit`: clean.
- `npm run lint:dup` (jscpd): 0 clones.
- `npx next build`: succeeded.
- No codegen stage applies.
- No processes left running by me. The playwright and next dev processes seen belong to review-sgs-070.
- The temporary base worktree sgs-062-base used for the before/after probe has been removed.
- `git diff --stat origin/main`: 8 files, all named by the ticket or required by it (test-helpers.ts and model.ts comment). No stray tool changes; AGENTS.md was untouched.

## Invariant check
- Cost, production time and popcap use the paid entry. Pay-time calls are unchanged, and spawnUnit uses the paid entry for popcap.
- The per-baseId sum of series equals cumulative produced at every sample. This is shown on all 3 shipped builds by a before/after probe, and pinned by tests for Knight/Longbow and a synthetic game.
- Every result field other than unitsProduced is identical to before for all 3 shipped builds at 1800 s (probe), and is pinned for Knight/Longbow against an unconverted run.
- Determinism: the existing determinism tests pass.
- Series ordering: by first held instant, then unitId, with a lower series kept at 0, and no series created by a conversion that moves no units.

## Spec discrepancy (flag for the acceptance gate and manager)
- The ticket and design C5 say Knight/Longbow holds **13** longbowman-2 at 845 s. The engine gives **12** at 845 s on origin/main and on this branch alike: the 13th spawn lands in (845, 850], and veteran-longbowmen completes at about 846.857.
- I pinned 12@845, 0@850, 13 longbowman-3 @850 and 66@1800.
- The ticket's Playwright API acceptance test (knight+longbow tier counts) belongs to the acceptance gate and needs the 12-at-845 correction.

## Out-of-scope findings
- acceptance/aoe4-simulate-api-timelines.spec.ts and aoe4-simulate-api-spend-population.spec.ts have `finalCount` helpers that read only the first series of a baseId. Their builds research no veterancy, so they still pass. They would undercount if a veterancy step were ever added.

## Status
needs_review (with the 845 s value flagged above).
