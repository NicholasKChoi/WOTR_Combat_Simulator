# SGS-064 review 1

Verdict: **REQUEST CHANGES**

Branch `sgs-064-aoe4-house-lead-time` (local only, not on origin), tip `fe3de3e555ed8280b17ae1b4103a1684f35e081a`, base origin/main `3ff99c6421141c870bbba3f02f056c6cdeea75ce` (merge-base = origin/main). Two commits: 68e0ac1 (the rule change) and fe3de3e (test re-pin). Full-branch review (first review of this ticket).

The engine and planner code is right. All three blocking findings are wrong or missing wording in test files: two sentences contradict the simulation result, and one re-pin has no comment. Each is a one-line fix.

## Blocking findings

1. `acceptance/aoe4-simulate-api-spear-longbow-build.spec.ts:34` - test - The title says step 23 "starts once the house lead time has supplied the population". The run shows otherwise: step 23 has `waitBreakdown: { resources: 6.547502894965646 }` and no supply wait, and step 24 has `{ resources: 7.679958872869065 }`. Supply was not what held the step, and the assertions check only the times. The ticket's Scope asks for a title that says the step "arms at the landmark second and starts when resources allow". Why it matters: a test title that claims a cause its assertions don't check, and that the result contradicts, is always blocking. Direction: retitle it to "arms at the Castle landmark second and starts when resources allow". Optionally assert `waitBreakdown` is `{ resources: ... }` so the title is checked.
2. `acceptance/aoe4-simulate-api-spear-longbow-build.spec.ts:44` - contract - The comment "The lead-time rule shifts the build later, so the first deposit now empties inside the window" says the opposite of what happens. With the new rule the build runs ahead, not later. `spawnedPopulation` is higher than on the base at all 140 samples that differ (for example 645 s: 52 vs 50, 700 s: 60 vs 53) and lower at none. Population reaches 200 at 1366.43 s instead of 1373.04 s, and `gold` runs out 104 s earlier (1114.09 vs 1218.40). Why it matters: an added comment the code contradicts is always blocking. Direction: say that houses now start during the King's Palace build, so production does not stall at the supply limit, more villagers gather earlier, and the first gold deposit runs out before 1200 s.
3. `lib/aoe4-build-order/simulate-house-warnings.test.ts:163` - contract - The Spear/Longbow digest is re-pinned to `a0105e4a512765a0` with no comment naming the lead-time rule. Ticket Scope (respec 2): "Each re-pin carries a comment naming the lead-time rule as the reason". The comment edited at line 155 describes the whole table and does not explain why this row changed. Why it matters: a reader can't tell that this row's change is intended and the other two rows' values are not. Direction: add a short comment on the row, for example: houses during the King's Palace build count only supply that lands within the house lead time.

## Spec gaps

None.

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Pending supply counts only when `completesAt <= now + lead` | pass | `houses.ts:22`; the `it.each` rows in `houses.test.ts` cover beyond the lead (2 houses), exactly at it (1) and inside it (1). Mutation M1 (count all) and M2 (`<`) each fail these rows |
| 2 | Room cap counts every pending item | pass | `houses.ts:28-29`; with supply 190 and an item due far beyond the lead, the result is 0 at both 100 and 1000 pop/s. Mutation M4 (drop the pending sum) fails that test only |
| 3 | Knight + longbow without its three pre-palace houses rises over 660-764 s | pass | Measured: tip 660:40, 680:41, 700:43, 720:45, 740:47, 760:49, 765:50. Base flat at 40 from 655 to 770 s. The test asserts 660 = 40 and 760 > 660, and fails under M1 |
| 4 | House start during a 220 s landmark is asserted | pass | Palace completes at 225 and the first house starts at 20, the same as with no palace. Fails under M1 |
| 5 | Same-baseId records are removed correctly in either order | pass | Completions at 137/225, with 7 house starts before 225. M7 (remove the first record by baseId) fails the slow-first row. M8 is not run here; the implementer reports it fails both rows |
| 6 | `pendingSupply` grep: 17 to 0 | pass | Base 17, tip 0 |
| 7 | Doc greps go to 0 and the section states the rule | pass | "supply of buildings" 0, "pending supply reaches" 0. `docs/aoe4-build-order.md:303-308` states the within-lead rule, that an item at exactly the lead counts, and the 200 cap |
| 8 | Report lists the changes for each of the three builds | pass | implementer-1 lists them. My own differential below matches |
| 9 | Mutation checks | pass | Re-run here for M1, M2, M4 and M7 (results above) |
| 10 | (respec 2) Re-pins hold, with comments; digest; README; PR body | **fail** | The values are right (687.5475028949656, 1114.092642631611, `a0105e4a512765a0`, README 1114/1709/2303 and 687.5/695.2). Findings 1-3 cover the comments and title. There is no PR yet, so the PR body can't be checked |
| 11 | (respec 2) 1TC and Knight/Longbow byte-identical | pass | Every result field is identical: default, 1200, 1800 and 3600 s, `autoHouses` unset/true/false |
| 12 | tsc, lint:dup, unit, acceptance pass | pass | Node 24.22.2: tsc clean, jscpd 0 clones, 1321 passed / 8 skipped, acceptance 574 passed (ACCEPTANCE_PORT=3839), `next build` ok |
| 13 | No invariant regressions | pass | See below |

No criteria ticked (verdict is not APPROVE).

### Differential vs origin/main (all result fields)

- ENG 1TC and ENG Knight/Longbow: identical at every duration and `autoHouses` setting.
- ENG Spear/Longbow with `autoHouses` false: identical at every duration.
- ENG Spear/Longbow with `autoHouses` on: changes only in steps 17, 18, 23, 24, 26, 27 and 28, plus the series that follow from them.
  - Steps 17 and 18 complete at 687.55 and 695.23 (were 681).
  - Step 23 is armed at 681 and starts at 687.5475028949656 after a 6.55 s resources wait.
  - Step 24 is armed at 687.55 and starts at 695.2274617678347 after a 7.68 s resources wait.
  - Population reaches 200 at 1366.4258447556392 (was 1373.038383838384).
  - Gold runs out at 1114.092642631611 / 1708.6684002073687 / 2303.2441577831246 (was 1218.40 / 1943.99 / 2669.58).
  - At 1200 s the only warning is `[node-depleted, info, gold]`. Spent at 1800 s: villagers 4900 to 4850, military 10270 to 10240, buildings 3972 unchanged.
  - `spawnedPopulation` differs from 645 s on and is never lower than on the base.
  - The cause is the one the ticket names: the King's Palace, in flight from 543 to 680 s, no longer counts as headroom, so houses start during the palace build.
  - Other fixtures in the dump (house repro, stock pin, a late-house sweep of 27 cases): identical.

## Invariants touched

- A1 holds: the room cap reads `data.base.maxPopCap.value`, and no new literal was added.
- A2 holds: the house loop still runs every house through `canAfford`/`payCost`, and planning reads only supply, population and the pending list.
- A3 holds: `completesAt` is the `done` value passed to `schedule` (`simulate.ts:382-384`). There is no clock or randomness. `nextWake` and `affordableAt` are unchanged, so no wake time moved.
- S3: not touched.

## Contract checks

- `HouseDemand` matches design C7 exactly. `planAutoHouse` keeps its signature and stays pure; the purity test checks this, and the code only uses `filter`/`reduce`.
- `constructing` record shape: `{ baseId, completesAt }` (`simulate.ts:140`). `completeConstruction` removes the record matching both baseId and `completesAt`. Two jobs with the same baseId and the same `completesAt` can't be told apart, but either removal is correct.
- Room cap: `room = ceil((maxPopCap - supply - Σ all pending) / houseSupply)`. This is numerically the same as the base, where headroom included all pending supply, so planning past 200 behaves exactly as before.
- Out of scope respected: no build data edits, no wake change, `houseGateOpen` and warnings untouched, no UI or OpenAPI change. The knight + longbow README sentence at `data/aoe4-build-order/README.md:81-83` is left for SGS-065, as the ticket says.
- No open question was answered with an invented constant.

## Bot reconciliation

`reviewBot.cli` and `reviewBot.rulesFile` are empty, so there is nothing to reconcile.

## Non-blocking notes

- `houses.ts:22`, at the boundary of the lead window. An item started at the same instant as planning has `completesAt = (t + walk) + build`, while the window ends at `t + (walk + build)`. With fractional walk or build times (a `moveSpeed` modifier, for example), floating-point rounding can put the item 1 ulp past `now + lead`. Example: walk 5/1.15 and build 13.33 s miss in about 3.6% of random `t`. In that case an explicit house started in the same instant with `houseBuilders` builders is not counted, and one extra auto-house may be planned. Integer walk and build times, which every shipped build has, never hit this. Consider computing both sides the same way, or comparing with a small time tolerance.
- `simulate.ts:390`: if `findIndex` returns -1, `splice(-1, 1)` would drop the last record. It can't happen today because the closure's `done` is the pushed value, and the base's `indexOf` had the same shape.
- `simulate-construction.test.ts:487` finds the pre-palace houses with the magic index `i > 20`. The next assertion makes sure those three steps are houses, so a data change fails loudly. Anchoring on the second `build archery-range` would read better.
- `simulate-construction.test.ts:485`: "keep population rising" checks only two points. The series is flat at 40 from 660 to 675 s and then rises.
- `houses.test.ts`: the `arriving(supply, completesAt = lead)` helper puts the converted existing rows exactly on the boundary (time 0 + lead 20), not strictly inside it. They still keep their values, and M2 now also fails `covers the shortfall`. The new describe block builds `{ supply, completesAt }` inline instead of using the helper.
- `acceptance/...spear-longbow-build.spec.ts:9`: the comment sits above `CASTLE_LANDMARK_SECONDS` but explains `MAN_AT_ARMS_START_SECONDS`. It would read better above the start constant, worded as in finding 1.
- `data/aoe4-build-order/README.md:68` runs past the file's usual wrap width.

## Coverage

- Reviewed every changed file: `houses.ts`, `simulate.ts` (startConstruction, completeConstruction, houseDemand, startAutoHouses, runInstant), `houses.test.ts`, `simulate-construction.test.ts`, `simulate-house-warnings.test.ts`, the acceptance spear/longbow spec, `docs/aoe4-build-order.md` (Houses and supply), `data/aoe4-build-order/README.md`.
- Compared against sibling tests in `simulate-construction.test.ts:289-447` (describe/it phrasing, `housesDone`, `twoTowns`) and the `simulate-house-warnings.test.ts` digest table.
- REPO.md Review checklist, Every diff and AoE4: ran `next build`. No page file is touched; the AoE4 page flows are covered by the full acceptance suite (574 passed). No helper or tolerance is copied: `RESOURCE_TOLERANCE` is imported. Checked the doc against the code.
- Not done: there is no PR yet, so the PR body's re-pin list can't be checked. No manual browser click-through, because no UI changed.
- Linter: tsc and jscpd are clean, so there are no lint findings.
