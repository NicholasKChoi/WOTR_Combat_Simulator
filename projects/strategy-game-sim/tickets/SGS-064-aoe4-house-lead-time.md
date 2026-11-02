# SGS-064: Count only supply that lands within the house lead time when planning auto-houses

- **Type**: Bug
- **Component**: aoe4-build-order
- **Milestone / criteria**: M4 / M4.4
- **Priority**: high
- **Risk**: high
  <!-- REPO.md criticalPaths: simulate.ts `houseDemand`, `startConstruction`, `completeConstruction` and the `constructing` field decide when auto-houses start, which decides every population and timing result (A3); `planAutoHouse` changes which houses start. PROJECT.md strongModelTriggers: changes simulation rules and the order of operations a result depends on. -->
- **Invariants**: A3 (`completesAt` is the time the engine already schedules; no clock, no randomness), A2 (planning reads supply and population only; the existing affordability check still gates every house), A1 (the room cap reads `data.base.maxPopCap.value`)
- **LOC estimate**: ~30 (`houses.ts` `HouseDemand` and `planAutoHouse` ~12; `simulate.ts` `constructing` record, `startConstruction`, `completeConstruction`, `houseDemand` ~18; tests and docs excluded)
- **Depends on**: SGS-063
- **On merge**: none
- **Source**: M4.4; `design/M4.md` C7, Engine "auto-house planning" table, "Docs and OpenAPI" (M4.4 row); BACKLOG: "`planAutoHouse` counts supply under construction; King's Palace 10 supply, 220 s; pop sits at 40, nothing spent 660-764 s"

## Context

`planAutoHouse` (`lib/aoe4-build-order/houses.ts`) adds the supply of every building under construction to the supply it compares against the projected population. A King's Palace (10 supply, 220 s) counts as headroom the moment it starts, so no house is planned while it builds, production blocks at the supply limit, and the knight + longbow build sits at 40 population with nothing spent for over 100 s. Only supply that arrives before the population needs it should count as headroom.

## Scope

Names are the design's (C7, "Engine: auto-house planning"). `simulate.ts` is edited by SGS-062 and SGS-063 first; this ticket is based on main after SGS-063 merges and locates its edits by function name, not line. Line numbers and counts below are for origin/main d5c2549 (which includes the knight + longbow build) and drift.

**`lib/aoe4-build-order/houses.ts`**

- Replace `HouseDemand.pendingSupply: number` with `pending: { supply: number; completesAt: number }[]` (every building under construction, explicit or auto); `populationPerSecond` is unchanged. Update the comment above it. `planAutoHouse(state, inputs, data, demand)` keeps its signature.
- In `planAutoHouse`, `lead` is unchanged. Headroom for the shortfall is `state.supply + Σ supply of pending items with completesAt <= state.time + lead` (an item at exactly `now + lead` counts). `shortfall = population + populationPerSecond * lead - headroom` as today.
- The room cap uses every pending item: `room = ceil((maxPopCap - state.supply - Σ all pending.supply) / houseSupply)`, so planning never goes past `maxPopCap`. The return value stays `max(0, min(ceil(shortfall / houseSupply), room))`.
- `planAutoHouse` stays pure in its arguments.

**`lib/aoe4-build-order/simulate.ts`**

- `Engine.constructing` changes from `string[]` of baseIds to records holding `baseId` and `completesAt` (the field shape is the implementer's; design leaves where `completesAt` is stored to the ticket). `startConstruction` already computes `done = time + villagerWalk + constructionSeconds`: store that value on the record it pushes (it is the walk-plus-build time while builders walk and the scheduled completion once they build, the same number the engine schedules). `completeConstruction` removes its own record (today it `splice`s by `baseId`; with two buildings of one baseId in flight, remove the record whose `completesAt` equals the completing job's, so that the removed one is the right one).
- `houseDemand` builds `pending` from the records with `supply: supplyOf(engine, baseId)` evaluated at planning time as today, and drops `pendingSupply`.
- `startAutoHouses`, `houseGateOpen`, the house loop, affordability, and every wake time (`nextWake`, `affordableAt`) are unchanged. No new wake is added for the moment a pending item enters the lead window: planning re-runs at every existing instant, and samples occur every `SAMPLE_SECONDS` (5 s).

**Tests (rule, not a list) (respec 2).** `lib/aoe4-build-order/houses.test.ts` passes `{ pendingSupply: n, ... }` in 13 lines (`git grep -n pendingSupply -- lib acceptance docs` finds 17 lines on origin/main: houses.ts 2, simulate.ts 2, houses.test.ts 13); each moves to `pending` with a `completesAt` inside the lead to keep its expected value (a `pendingSupply: 0` becomes `pending: []`). A test of the changed behavior gets the new expected value; any other test that does not pin a shipped build keeps its expected value and pins the old setting in its setup (for example, `autoHouses: false` with explicit `build house` steps, or a pending item within the lead). A test that pins the result of a SHIPPED build may be re-pinned to the new values wherever the lead-time rule explains the change; retuning build data is out of scope (decided by the manager). Each re-pin carries a comment naming the lead-time rule as the reason. The implementer lists every test it edits, and the PR body lists every re-pinned test.

Re-pins required (measured by the implementer on branch tip 68e0ac1; re-measure on the final code and state values at the precision the existing assertions use, which is the full double):

- `acceptance/aoe4-simulate-api-spear-longbow-build.spec.ts`, the two tests at 1200 s and 3600 s that expect the men-at-arms step (23) to start at 681 s: now expect `armedAt` 681 (`CASTLE_LANDMARK_SECONDS`) and `startedAt` 687.5475028949656 (about 687.55 s, a 6.55 s wait on resources after the King's Palace window runs on-time houses). The test titles are reworded to say it arms at the landmark second and starts when resources allow. The `no waiting step` assertion stays only if it still holds; if step 23 now reports `waiting` it is changed to assert exactly that, and the implementer states which in the report.
- The same spec's test `at 1200 s no deposit has run out and no warning is raised`: now asserts that at 1200 s `gold` has a `depletedAt` of about 1114.09 s (the implementer states the exact double), `gold#2` and `gold#3` have `depletedAt` null, and `warnings` is exactly one `node-depleted` warning on node `gold` with severity `info`. The title is reworded to match. The 3600 s test is unchanged (all three still run out with info warnings).
- `lib/aoe4-build-order/simulate-house-warnings.test.ts`, Spear/Longbow into MAA/Crossbow 1800 s digest: `e7b3cb8bc1ad4299` becomes `a0105e4a512765a0`, for the same reason (the King's Palace, 543 to 680 s, is a pending item beyond the lead in that run).
- 1TC and Knight/Longbow shipped builds are not re-pinned: their results stay byte-identical (see Acceptance).

New unit tests (`houses.test.ts` for the planner; `simulate-construction.test.ts` or `simulate.test.ts`, whichever is nearest, for the engine):

- `planAutoHouse`: pending item beyond the lead is not headroom (a 10-supply item at `now + lead + 1` plans the same houses as no pending item); at exactly `now + lead` it counts; at `now + lead - 1` it counts; the room cap counts every pending item even beyond the lead (supply 190, a 10-supply item far out, `maxPopCap` 200: returns 0 however large the shortfall); several pending items sum by the same rule; the function returns the same result when called twice with the same arguments.
- Engine: the shipped `data/aoe4-build-order/builds/english-knight-longbow.json`, loaded in the test with its three explicit pre-palace `build house` steps (the ones between the second `build archery-range` and `rally kings-palace`) filtered out, `autoHouses: true`; the shipped file is not edited and keeps those houses has `spawnedPopulation` strictly rising between 660 s and 764 s. Pin the values before the change (flat at 40; the implementer measures the exact pre-change series in a throwaway run and pins it as the "was" value in a comment-free assertion of the new rise only).
- Engine: while a 220 s landmark is building, a house starts as soon as projected population exceeds supply (assert the house's start time against an explicit expected number measured on the final code, not a range).
- Engine: two buildings of the same baseId in flight complete in either order and each completion removes its own record (assert `houseDemand`-visible behavior through the resulting house count, not the field shape).
- Timing unchanged where nothing long is in flight: the three shipped builds on origin/main (`english-1tc`, `english-knight-longbow`, `english-spear-longbow-maa-crossbow`) at default inputs and 1800 s have identical `spawnedPopulation`, `spent`, `steps`, `populationCapReachedAt` before and after, unless a pending item beyond the lead occurs in that run, in which case the report lists the difference (see Acceptance).

**Docs (same diff).** `docs/aoe4-build-order.md` "Houses and supply" paragraph (lines 296-302 on origin/main): the sentence "When it passes the supply plus the supply of buildings under construction" and "Planning stops once supply plus pending supply reaches `maxPopCap`" describe the old rule. Rewrite them to: headroom counts only supply from buildings finishing within the lead (a building completing exactly at the lead counts); supply from every building under construction still counts toward the 200 cap, so planning never passes it. State that a long build such as a landmark does not hold houses back. Grep the doc, `README.md` and `data/aoe4-build-order/README.md` for "under construction", "pending supply" and "supply of buildings" and fix any sentence the change contradicts (the README hit at line 49 is about builders joining a building and stays). No OpenAPI change: the response shape is unchanged. Build READMEs that quote numbers for a shipped build (population, timings) are re-checked against the post-change run; if a number changes, update it. `data/aoe4-build-order/README.md` Spear/Longbow entry (respec 2): population 200 at 1366.43 s instead of 1373.04 s; gold runs out at 1114, 1709 and 2303 s instead of 1218, 1944 and 2670 s; the sentence saying the men-at-arms and crossbow steps start at 681 s now says the man-at-arms step arms at 681 s and the two steps start at 687.5 s and 695.2 s. `data/aoe4-build-order/README.md` lines 81-83 (knight + longbow entry) say auto-houses count the palace's supply at once and the three houses prevent a stall; that reason is false after this ticket. SGS-065 rewrites that sentence (the build keeps the houses); this ticket leaves it and reports it.

**Out of scope:** editing shipped build data, including the pre-palace houses, which stay (SGS-065 owns the build data and README sentence); a new wake time (see below); changing `houseGateOpen` or the house-gate warnings (SGS-063); changing `lead`, house cost, builder choice or any other `planAutoHouse` rule; a new wake time at `completesAt - lead`; UI and OpenAPI changes.

## Diagrams

```mermaid
flowchart LR
  subgraph read
    A[runInstant: startAutoHouses] --> B[houseDemand: pending = constructing records supply + completesAt; populationPerSecond]
  end
  subgraph act
    B --> C[planAutoHouse: lead = walk + build time]
    C --> D{headroom = supply + pending with completesAt at or before now + lead}
    D --> E[shortfall = population + rate x lead - headroom]
    E --> F[count = min ceil shortfall / houseSupply, room]
    F --> G[room uses supply + ALL pending, capped at maxPopCap]
  end
  subgraph record
    G --> H[startConstruction pushes baseId, completesAt = time + walk + build]
    H --> I[completeConstruction removes that record]
  end
```

## Acceptance criteria

- [x] `planAutoHouse` counts a pending item as headroom only when `completesAt <= now + lead`: an item at `now + lead + 1` does not change the returned count, an item at exactly `now + lead` does, in unit tests.
- [x] The room cap counts every pending item: with supply 190 and a 10-supply item due far beyond the lead, `planAutoHouse` returns 0 for any shortfall, in a unit test.
- [x] A knight + longbow order without its three pre-palace explicit houses (filtered in the test from the shipped JSON, `autoHouses: true`) (respec 1) has `spawnedPopulation` rising between 660 s and 764 s, in a unit test; the same order on the pre-change code is flat at 40 over that interval (the implementer states in the report that they checked this on the base).
- [x] While a landmark with 220 s construction is in flight, an auto-house starts at the first instant the projected population exceeds supply, with the start time asserted in a unit test.
- [x] Two same-`baseId` buildings in flight each remove their own record on completion in either order, with the resulting house count asserted.
- [x] `git grep -n "pendingSupply" -- lib acceptance docs` finds 17 lines on origin/main today (houses.ts 2, simulate.ts 2, houses.test.ts 13) (respec 1) and 0 after the change.
- [x] `git grep -n "supply of buildings" -- docs` finds 1 line today (`docs/aoe4-build-order.md` 300) and 0 after the change; `git grep -n "pending supply reaches" -- docs` finds 1 line today (302) and 0 after; the reworded section states the within-lead rule, the exactly-at-lead inclusion and the unchanged 200 cap.
- [x] The report lists, for each of the three shipped builds on origin/main at default inputs and 1800 s, whether `spawnedPopulation`, `spent`, `steps` and `populationCapReachedAt` changed from the base; every change is explained and any README number it makes untrue is fixed.
- [x] Mutation check: changing the headroom filter to count every pending item (the old rule) makes the beyond-lead planner test and the 660-764 s engine test fail; dropping the room-cap's pending sum makes the supply-190 test fail. The named tests are new, so the implementer runs each mutation against them in a throwaway worktree.
- [ ] (respec 2) The re-pins listed in Scope hold: the spear/longbow acceptance spec's three tests assert the new armed/start times and the 1200 s gold depletion with its info warning, each with a comment naming the lead-time rule; the Spear/Longbow 1800 s digest in `simulate-house-warnings.test.ts` is `a0105e4a512765a0`; the README Spear/Longbow numbers match the post-change run; the PR body lists every re-pinned test.
- [x] (respec 2) The `english-1tc` and `english-knight-longbow` shipped builds at default inputs and 1800 s are byte-identical to the base (`spawnedPopulation`, `spent`, `steps`, `populationCapReachedAt`, warnings), checked in the report.
- [x] `npx tsc --noEmit`, `npm run lint:dup`, `npm test` and `npm run acceptance` pass; the implementer's report lists every test edited and why.
- [x] No INVARIANTS.md regressions

## Open questions

None. Designer pass 4 answered both earlier questions: no new `nextWake` candidate (entering the lead window only adds headroom, so it can lower a house count but never start one; a house can start up to `SAMPLE_SECONDS` late), and the knight + longbow build keeps its three pre-palace houses.

## Re-spec 2026-11-02

- Underspecified: the ticket was written against a stale local main without the knight + longbow build; it called for a "test-local copy" and quoted old counts and line numbers.
- Changed: re-read origin/main d5c2549: engine test filters the shipped build's three houses, `pendingSupply` count is 17 (houses.test.ts 13), doc lines are 296-302, README lines 81-83 are SGS-065's; both open questions answered and removed.
- Stands: all planner and engine Scope, diagrams and mutation checks are unchanged.

## Re-spec 2026-11-02 (2)

- Underspecified: the existing-test rule ("pin the old setting in setup") cannot hold for a shipped build whose House timing is the thing the ticket changes; three acceptance tests and one digest test pin the Spear/Longbow result.
- Changed: tests that pin a shipped build may be re-pinned where the lead-time rule explains the change (manager decision); Scope lists the exact re-pins, README numbers and the byte-identical 1TC and Knight/Longbow criterion; the README knight + longbow sentence still belongs to SGS-065.
- Stands: all planner and engine code, new unit tests, docs rewrite and the implementer's branch work (68e0ac1), which only needs the three acceptance tests re-pinned.

## Rework 1 - 2026-11-02 (review)

Gate that bounced: review (reports/SGS-064-review-1.md). Tip reviewed: fe3de3e555ed8280b17ae1b4103a1684f35e081a. No earlier gate had passed it. Engine and planner code were found correct (1TC and Knight/Longbow identical in every result field; Spear/Longbow changes only as the rule explains; four mutations fail the expected tests); the findings are wording in test files.

Findings:
- `acceptance/aoe4-simulate-api-spear-longbow-build.spec.ts:34`: the test title says step 23 "starts once the house lead time has supplied the population", but the result shows step 23 waited only on resources (`waitBreakdown: { resources: 6.5475... }`; step 24 too, 7.68 s). The ticket asks for "starts when resources allow".
- Same file, line ~44: the comment "The lead-time rule shifts the build later" is the opposite of what happens: the build runs ahead (`spawnedPopulation` higher at all 140 differing samples and never lower; population 200 at 1366.43 s instead of 1373.04 s; gold runs out ~104 s earlier).
- `lib/aoe4-build-order/simulate-house-warnings.test.ts:~163`: the Spear/Longbow digest is re-pinned to `a0105e4a512765a0` without the comment naming the lead-time rule that Scope requires for each re-pin.

Required fixes:
- [x] (rework 1) Retitle the step-23 test so it says the step starts when resources allow, and assert its resources wait (`waitBreakdown.resources` about 6.5475, not a population wait).
- [x] (rework 1) Fix the comment at ~line 44 to say the lead-time rule makes the build run ahead (higher population, population 200 at 1366.43 s instead of 1373.04 s, gold runs out earlier).
- [x] (rework 1) Add a comment on the digest re-pin in simulate-house-warnings.test.ts naming the lead-time rule (no ticket ids or PR numbers).
- [x] No production-code change. (Non-blocking, optional: `houses.ts:22` a building started in the same instant as planning can fall 1 ulp past `now + lead` when walk or build times are fractional; no shipped build hits it. Do not change code; do not add it.)
