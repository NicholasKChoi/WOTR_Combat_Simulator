# SGS-064 implementer report 1

- Ticket: SGS-064 (count only supply that lands within the house lead time)
- Branch: `sgs-064-aoe4-house-lead-time` (from origin/main 3ff99c6)
- Tip SHA: 68e0ac1285f013cd19101985245587c29100b7f3 (author choinickolas@gmail.com, not pushed)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-064-aoe4-house-lead-time
- Status: **needs_spec**. The ticket's rule for existing tests can't be followed for one acceptance spec (3 tests). All other work is done and committed.

## Files touched

- `lib/aoe4-build-order/houses.ts`: `HouseDemand.pending: {supply, completesAt}[]` replaces `pendingSupply`. Headroom counts only items with `completesAt <= time + lead`. The room cap subtracts every pending item.
- `lib/aoe4-build-order/simulate.ts`: `Engine.constructing` now holds `{baseId, completesAt}` records. `startConstruction` stores `done` and passes it to `completeConstruction`, which removes the record that matches both baseId and completesAt. `houseDemand` builds `pending`.
- `lib/aoe4-build-order/houses.test.ts`: 13 `pendingSupply` lines moved to `pending` (an item at exactly `lead` when time is 0, so expected values are unchanged). Adds a new `planAutoHouse pending supply` describe.
- `lib/aoe4-build-order/simulate-construction.test.ts`: new describe `auto-houses with a long build in flight`.
- `lib/aoe4-build-order/simulate-house-warnings.test.ts`: Spear/Longbow 1800 s digest re-pinned and the comment reworded (see Edited tests).
- `docs/aoe4-build-order.md`: "Houses and supply" rewritten. It now states the within-lead rule, that a building finishing exactly at the lead counts, that a landmark does not hold houses back, and that every building under construction still counts toward the 200 cap.
- `data/aoe4-build-order/README.md`: Spear/Longbow entry. The MAA/crossbow start sentence now says the man-at-arms step arms at 681 s and the two start at 687.5 s and 695.2 s. The gold run-outs are now 1114, 1709 and 2303 s (were 1218, 1944 and 2670 s).

## Tests

- `npx vitest run` (`npm test`): 43 files, 1321 passed, 8 skipped, 0 failed.
- New planner tests (houses.test.ts, state time 100, so a dropped `state.time` is caught):
  - Lead-window table: item at `now+lead+1` plans the same as no item (2); at `now+lead` 1; at `now+lead-1` 1.
  - Several items sum by the same rule: 4 houses with no items, 2 with three 10-supply items around the lead.
  - Room cap: supply 190 with a 10-supply item at `now + 200` returns 0 at rate 100 and at rate 1000; with no item it returns 1.
  - Purity: two calls give the same count and the demand is deep-equal to a clone taken before.
- New engine tests (simulate-construction.test.ts). The data has two TCs, 3x villager production speed, and King's Palace edited to age 1 with only its wood cost:
  - 220 s landmark in flight (completes at 225): the first auto-house starts at 20 s, the same as with no landmark.
  - Two King's Palaces in flight (1 and 3 builders, completing at 225 and 137), in both start orders: 7 auto-houses start before 225 s.
  - Shipped knight + longbow with its three pre-palace `build house` steps filtered out, `autoHouses` on (the default): population is 40 at 660 s and higher at 760 s. The test also asserts the three filtered steps are houses.
- Base check (on 3ff99c6, throwaway probe, same filtered build): `spawnedPopulation` is 40 at every sample from 655 s through 780 s. After the change: 40 at 660 s, 41 at 680 s, then rising to 49 at 760 s.

## Edited pre-existing tests

- `houses.test.ts`: all 13 `pendingSupply` lines. The type changed, so each moved to `pending`: `[]` for 0, or `[arriving(10)]` (completesAt = lead, inside the window) for 10. Expected values are unchanged. The ticket rule allowed this ("each moves to `pending` with a `completesAt` inside the lead").
- `simulate-house-warnings.test.ts`, test `leaves every field of ENG Spear/Longbow into MAA/Crossbow at 1800 s but warnings as it was`: digest changed from `e7b3cb8bc1ad4299` to `a0105e4a512765a0`, and the describe comment now reads "Digests of every field but warnings; the warnings must leave them unchanged."
  - Why: it pins the full 1800 s result of a shipped build, and the King's Palace (543 to 680 s) is a pending item beyond the lead in that run. The Acceptance criteria expect that difference to be listed, not prevented.
  - There is no "old setting" to pin for a shipped build without editing build data, which is out of scope.
  - **Manager: confirm or overrule.** This sits next to the needs_spec item below.

## Needs spec: acceptance spec `acceptance/aoe4-simulate-api-spear-longbow-build.spec.ts`

`npm run acceptance` (ACCEPTANCE_PORT=3831): 571 passed, 3 failed, all in this spec. I left it unchanged.

- `at 1200 s ...` and `at 3600 s the men-at-arms step arms and starts at the Castle landmark second, with no waiting step`: the step arms at 681 s but now starts at 687.55 s, after a 6.55 s wait on resources.
- `at 1200 s no deposit has run out and no warning is raised`: `gold` now runs out at 1114.09 s, so it has a depletion and an info `node-depleted` warning with 0 idle.

Cause: during the King's Palace (543 to 680 s), houses are now planned on time. Population rises from 645 s (50 becomes 53 by 650 s and 60 by 695 s) where it used to sit at 50 until 700 s. More villagers and military are paid earlier, so the 681 s man-at-arms waits for resources and gold runs out sooner.

The ticket's rule says such a spec "keeps its expected value and pins the old setting in its setup". For this shipped build that would need either edited build data (out of scope) or a different order posted by the spec. Neither reproduces the old timing. Decision needed:

- (a) Re-pin the spec to the new values: `armedAt` 681, `startedAt` 687.5475028949656, and at 1200 s `gold` ran out with an info warning while `gold#2` and `gold#3` did not.
- (b) Retune the Spear/Longbow build (for example the 681 s trigger) in a data ticket.
- (c) Another option.

## Shipped builds: before (3ff99c6) and after, default inputs, 1800 s

- ENG 1TC: `spawnedPopulation`, `spent`, `steps` and `populationCapReachedAt` unchanged.
- ENG Knight/Longbow (King's Palace): all four unchanged. Its three explicit pre-palace houses already cover the palace window. The `auto-houses-held` warning is unchanged too (step 23, 461.8 s, 21.2 s).
- ENG Spear/Longbow into MAA/Crossbow: all four changed. Cause: the King's Palace is in flight from 543 to 680 s, beyond the lead (explained above).
  - `spawnedPopulation`: differs from 645 s on (50 vs 52/53); the final value is 200 in both runs.
  - `populationCapReachedAt`: 1373.04 became 1366.43.
  - `spent` at 1800 s: villagers 4900 became 4850, military 10270 became 10240, buildings 3972 and research 0 unchanged.
  - `steps`: steps 17 and 18 complete at 687.55 and 695.23 (were 681). Steps 23 and 24 start at 687.55 and 695.23 (were 681) and wait on resources for 6.55 and 7.68 s. Step 26 (`gold` run-out reaction) runs at 1114.09 (was 1218.40). Step 27 (`gold#2`) completes at 1708.67 (was not-reached by 1800 s).
  - 3600 s run-outs: 1114.09, 1708.67 and 2303.24 s. The README numbers are updated. The README sentence "they start at 681 s" was untrue and is reworded.

## Mutation checks

Each mutation was run against houses.test.ts and simulate-construction.test.ts in this worktree after committing, then undone with `git checkout -- <file>`. The tree is clean at the tip.

| Mutation | Tests that failed |
|---|---|
| M1: headroom filter counts every pending item (the old rule) | beyond-lead row; sum; landmark start; both same-baseId orders; knight + longbow 660 to 760 s |
| M2: `<` instead of `<=` | exactly-at-lead row; sum; existing `covers the shortfall` |
| M3: `completesAt <= lead` (drops `state.time`) | inside-lead and at-lead rows; sum; both same-baseId orders; knight + longbow; six existing auto-house tests |
| M4: room cap drops the pending sum | the supply-190 test |
| M5: planner sorts and pushes into `demand.pending` | the purity test |
| M6: headroom counts only the first arriving item | sum; knight + longbow |
| M7: completion removes the first record by baseId only | same-baseId, slow-first order |
| M8: completion never removes its record | both same-baseId orders; knight + longbow; `stop at maxPopCap`; `stay off until the last build-house step` |

Notes:
- The inside-lead row is killed by M3 only. It guards the `<= now + lead` direction, not strictness.
- The same-baseId fast-first row can't fail under M7, because there the first record by baseId is the right one. It fails under M8.

## Clean stages

- codegen: not set.
- build: `npx next build` passed (npm ci was run once at setup).
- lint: `npx tsc --noEmit` clean. `npm run lint:dup` found 0 clones.
- unit: `npm test` passed (counts above).
- acceptance: 3 failures, listed above. No server left running and port 3831 is free.
- `git diff --stat origin/main`: only the 7 files above. No lockfile or unrelated changes. `pendingSupply` hits in lib/acceptance/docs: 0. "supply of buildings" or "pending supply reaches" in docs: 0.
- Runtime: Node v24.22.2 matches the declared 24.

## Invariant check

- A1: the room cap reads `data.base.maxPopCap.value`. No new numeric literal in houses.ts; the source-shape test passes.
- A2: planning reads supply, population and the pending list only. Affordability still gates every house, and no house loop or payment code changed.
- A3: `completesAt` is the `done` value the engine already schedules. No clock or randomness. Determinism tests pass.
- No new wake time was added: `nextWake` and `affordableAt` are untouched.

## Out-of-scope findings

- `data/aoe4-build-order/README.md` knight + longbow entry ("auto-houses count the palace's supply as soon as it is under construction, so without them population stalls...") is now false. SGS-065 owns it; left as is per the ticket.
- The Spear/Longbow build's hard-coded 681 s man-at-arms trigger no longer starts on that second at default inputs (resources wait). It belongs to the needs_spec decision above.
