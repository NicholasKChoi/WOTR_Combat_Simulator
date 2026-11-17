# SGS-190 implementer report 1

- Ticket: SGS-190 (Steps wait for a free building, produce and research)
- Branch: `sgs-190-busy-building-wait`
- Tip: `613c38d81e6bfe2a0a563a8969a3f6f5099b5509` (one commit on `origin/main` 3bc29b2)
- Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-190-busy-building-wait`
- Status: **needs_review**

## Run history

An earlier implementer run was interrupted and left uncommitted changes on a6ee0b3. I kept its engine
change, the build edit, the `test-helpers.ts` move and most re-baselines; finished the rest (two
re-baselines, the new test file, the three docs); committed; then rebased onto `origin/main`, which had
moved to 3bc29b2 (#200, #201) during the run. The rebase was clean, and the full suite passes on the new base
with the same pins. `checkout.sh task` reused the checkout (exit 0). No `origin/<branch>` exists, so
the own-commit check was skipped.

## Files touched

- `lib/aoe4-build-order/engine-common.ts`: exported `instanceFree` (C7c), with type-only imports.
- `lib/aoe4-build-order/simulate.ts`: `EngineState.held`, `StepStart.hold`, the `produce` check 5, `offerSteps` sets and clears the hold, `startProduction` skips held instances, `held: null` in `createEngine`.
- `lib/aoe4-build-order/research.ts`: `researchTarget` replaced by `candidateInstances` (every candidate instance in candidate then instance order). The handler checks age, then candidate instance, then resources, then the first free instance. A busy wait reserves the cost and holds nothing.
- `data/aoe4-build-order/builds/english-spear-longbow-maa-crossbow.json`: removed the four Castle blacksmith research steps.
- `data/aoe4-build-order/README.md`: Spear/Longbow entry.
- `docs/aoe4-build-order.md`: Model rules (Priority, Queues, produce, research and Tiers paragraphs).
- `docs/aoe4-build-order-format.md`: wait-reasons section.
- `lib/aoe4-build-order/test-helpers.ts`: gains `startingWith` and `tierCountAt`, moved from `research.test.ts`.
- `lib/aoe4-build-order/simulate-busy-buildings.test.ts`: new file, 37 tests.
- Re-baselined: `research.test.ts`, `research.acceptance.test.ts`, `simulate.test.ts`, `simulate-construction.test.ts`, `simulate-house-gate.test.ts`, `builds.test.ts`.

## Tests

- `npm test` (full suite, on 3bc29b2 plus this commit): 87 files passed, 1 skipped; 2715 tests passed, 15 skipped. The 13 skipped in `builds.test.ts` are also skipped at base; I saw the same count in the base scratch run.
- `simulate-busy-buildings.test.ts`, 37 tests, one describe per rule:
  - `instanceFree`, 6 rows. A paid item means not free. Held for another step means not free. Held for the same step, or outside the hold, means free (B-B1, B-B2, C7c).
  - Single busy target: scout at 10 s gives startedAt 20, completedAt 43, prerequisite 10. Food at 10 s equals the run without the step, and military spend at 20 is 65.
  - Several targets: the test first asserts a=10 < b=30. The step starts at 30 with prerequisite 29. The held barracks pays no spearman (1 spearman in total). The hold is released at the start: 3 men-at-arms at 60 and 5 at 90. A2 (`noneNegative`) and A3 (deep-equal rerun) are checked.
  - `instance: k` table: instance 1 gives 10 and instance 2 gives 30.
  - Check order: armed at 1 with the town center busy and food short. Breakdown keys are `['resources','prerequisite']` and sum to 19. Reserve: a waiting busy-target `produce` keeps 20 gold from another barracks' man-at-arms order, so the step starts at 40 and the run has 2 men-at-arms.
  - Reactions, 2 rows (`produce` and `research`, armed by a berry run-out between 10 and 30 s while barracks 1 is held): the produce reaction starts at 60 and the cursor at 30. The research reaction takes barracks 2 at 30, so the cursor starts at 90.
  - Research. At a busy barracks: 15/75 with prerequisite 10, plus A2 and A3. Research reserve: a waiting `fitted-leatherwork` keeps its gold from a man-at-arms order and starts at 60. Two researches at one blacksmith: 0/60 then 60/120, prerequisite 60. Two blacksmiths: both start at 0.
  - Candidate table, 6 rows: idle council hall at 5 s (5/65). Research listed before produce takes the range at 0. Produce first, then research at 0, takes the council hall. `at: archery-range` waits for the range (15). Two ranges free at once gives instance 1. The range that frees first gives instance 2.
  - Pausing: no villager is paid during textiles (20 to 40) and the order resumes at 40. A waiting scout takes the town center at 40 before the villager order pays.
  - No target, 2 rows: the handler outcome is exactly `{ started: false, waitingOn: 'prerequisite' }` (no reserve, no hold).
  - Never free: `waiting`/`prerequisite`, `step-stuck` for step 1, and the next step `not-reached`/`earlier-step`.
  - `pause`, `rally`, `build` and `move` start at 5 while the town center is busy. The test first asserts that a villager spawns between 15 and 20.

## Pre-existing tests edited (ticket rule: the Scope re-baseline list)

| file:test | change | fails at base? |
|---|---|---|
| research.test.ts: runs the research after the spearman already paid, for its 60 s | startedAt 5 to 15, adds prerequisite 10 | yes |
| research.test.ts: describe "a unit spawns at the highest researched tier…" (covers "reads the tier at spawn, not at payment", "keeps the cost and popcap of the tier paid", "paces auto-houses…") | setup: a third barracks, and the third step produces on idle barracks 3 (idle-building option). "paces auto-houses" spearman-3 at 400: 66 to 68 | paces: yes. The other two use an idle building, so they pass at base by design |
| research.test.ts: takes instance 1 … without looking at queue length | retitled "takes the first free instance of the named building, passing one with a unit paid"; expects town-center 2 | yes |
| research.test.ts: starts when six gold miners…, reports every waiting second as resources | run on `noAutoVillagers(game)` (`idle`) so the research never waits for the town center | no (noAutoVillagers option) |
| research.test.ts: starts at the instant the gold arrives… | `noAutoVillagers(game)` | no (noAutoVillagers option) |
| research.test.ts: holds the villager order until the research ends… | startedAt 5 to 20, prerequisite 15 | yes |
| research.test.ts: converts nothing when a lower upgrade completes after a higher one | completedAt [20,70] to [20,65]; tiers at 70 [0,0,3] to [0,0,1] | yes |
| research.test.ts: leaves the units at the highest tier when two upgrades complete at one instant… | starts with 3 barracks (1 and 3 idle) and both upgrade times 50, so they run at once | yes |
| research.acceptance.test.ts: pays the research at its step start and queues it behind… | retitled "waits for the spearman already paid, then pays the research and runs it for its 60 s"; startedAt 15, prerequisite 10; nothing charged at 10 s; research spend 350 at 15 | yes |
| research.acceptance.test.ts: starts at the instant five gold miners reach 100 gold | run with villagerTarget 0 (`idle`) | no (noAutoVillagers option) |
| research.acceptance.test.ts: lets the villager paid at 0 spawn at 20… | startedAt 5 to 20, prerequisite 15 | yes |
| simulate.test.ts: sets the standing rally from a villager produce with rally | wood rate 0 at 25 s, and one wood villager at 45 s (was at 25) | yes (base: 31.0 at 25) |
| simulate.test.ts: lets the villager in production finish and keeps the scout cost when switching | food at 10 s no longer minus 65; startedAt 10 to 20 | yes |
| simulate.test.ts: completes a continuous produce when a later produce … starts | completedAt 30 to 40 | yes |
| simulate-construction.test.ts: keeps paid items and offers next-age units at the age-up instant | startedAt [0,0,100] to [0,0,102.55…], waitSeconds 102.55…, step 1 completedAt 102.55… (the spearman waits for the man-at-arms paid before the age-up) | yes |
| simulate-house-gate.test.ts: ENG 1TC and ENG Spear/Longbow digests | re-pinned `ebe79d4a4c219f04` and `f3b256384c4bcf0f` | yes |
| builds.test.ts: runs its first two gold deposits dry… | retitled "runs its first gold deposit dry at a pinned time by 1800 s and keeps the second and third stocked"; `gold` 1181.19 to 1206.874034229912; `gold#2` 1591.52 to null | yes |

"holds 20 tier-2 longbowmen…" (Knight/Longbow) was not edited. SGS-189 had already derived its sample times from
`completedAt`, and it passes unchanged under the rule. Measured: `veteran-longbowmen` completedAt
838.018581311992. At sample 835, longbowman-2 is 20 and longbowman-3 is 0. At sample 840, they are 0 and 20.
The final longbowman-3 count is 71. It asserts no (840, 845] window. The completion did not move from the base value (about 838 s).

How I checked "fails at base": I made a scratch checkout at `origin/main` 3bc29b2 and copied in the edited test files and
`test-helpers.ts`. 14 tests failed, plus the rally test after I strengthened it. Each failure was on the changed assertion,
listed in the column above. Those failures are the mutation evidence for the re-baselines. The scratch checkout was removed.

## Pinned outputs

- `simulate-house-gate.test.ts` digests at 1800 s: ENG 1TC `ebe79d4a4c219f04`; ENG Spear/Longbow `f3b256384c4bcf0f`.
- `builds.test.ts` Spear/Longbow at 1800 s: `gold` depletedAt 1206.874034229912; `gold#2` and `gold#3` null.
- `simulate-construction.test.ts`: 102.55000000000001 (a man-at-arms paid at 87.9 with the stock time of 14.65 s).
- Reaction rows: produce reaction 60 with cursor 30; research reaction 30 with cursor 90 (berry stock 60, 6 berry villagers, armed at 18.22).

## Mutation checks (each undone; the final diff matches the committed code)

| break | failing test, assertion |
|---|---|
| engine-common.ts `instanceFree`: drop `paid.length === 0` | instanceFree rows "paid item" (`toBe(false)`), plus 21 behavior tests |
| engine-common.ts: drop the held clause | instanceFree "held for another step"; both reaction rows (`startedAt` 18.22 instead of 60 or 30) |
| engine-common.ts: drop `held.step !== step` | instanceFree "held for the same step" (`expected false to be true`) |
| simulate.ts `produce`: `hold: []` | "pays no spearman on the held barracks 1" (`expected 3 to be 1`); reaction rows |
| simulate.ts `startProduction`: ignore `held` | "pays no spearman on the held barracks 1" (`expected 3 to be 1`) |
| simulate.ts `offerSteps`: remove `engine.held = null` | "releases the hold when the step starts" (`expected 4 to be 5`); reaction produce row |
| simulate.ts `produce` check 5: no `reserve` | "reserves the cost while it waits for the busy building" (step stays `waiting`) |
| simulate.ts `produce`: busy check before resources | "waits on resources until the scout is affordable…" (keys `['prerequisite']`). My first version armed at 0 and passed under this break, so I rewrote it to arm at 1 |
| research.ts: `instances[0]` instead of the first free | 19 tests across the new file, research.test and research.acceptance.test |
| research.ts busy wait: no `reserve` | "reserves its cost while it waits for the blacksmith" (step stays `waiting`) |
| research.ts: ignore `at` | candidate row "the named range" (`council-hall` instead of `archery-range`) |

## Codegen, build, lint

- codegen: not set.
- build (`link-node-modules.sh` and `npx next build`): passes.
- lint: `npx tsc --noEmit` exits 0; `npm run lint:dup` finds 0 clones.
- Acceptance specs (`npm run acceptance`): **not run**. common.md leaves them to the acceptance-test gate, since this ticket does not change the harness. Specs likely to move: `-research`, `-veterancy-conversion`, `-production-buildings`, `-markers`, `-waits`, `-spear-longbow-build`.
- `git status` was clean after the build, and no tool-made changes are in the diff.

## Doc claims (each reread against the code)

docs/aoe4-build-order.md:
- "A step waiting on resources reserves its cost; a reaction never reserves." Source: `offerSteps` sets `engine.reserve = outcome.reserve`; `offerReactions` only feeds `reactionNeeds` (wake times).
- "a step waiting for a busy building reserves its cost, and an instance it holds (Queues) pays nothing for its order." Source: `produce` check 5 and `researchHandler` return `reserve`; `startProduction` checks `engine.held`.
- "At one instant, steps start before orders pay, so a step wins a tie with an order payment: an instance whose unit or research ends at that instant is free for a waiting step before its order pays its next unit." Source: `runInstant` order (events, then `offerSteps`, then `startProduction`); tests "lets a waiting produce take the instance at the research end" and back-to-back blacksmith.
- Queues: "Each building instance has one queue, which holds its paid units and its running research. An instance is free for a step when nothing is paid in its queue and it is not held for another step; an instance whose order cannot pay right now is free." Source: `instanceFree`.
- "A `produce` or `research` step starts only on free instances; until then it waits on `prerequisite`, and a target that never frees leaves it `waiting` at the horizon with the `step-stuck` warning. `pause`, `rally`, `build` and `move` never wait for a building." Source: handlers; tests "a target never free by the horizon" and "steps that never wait on a building".
- "An order pays its next unit only when its instance has no paid unit or research left and is not held." Source: `startProduction` condition.
- The produce paragraph (targets and check order; starts only when every target is free at one offer; `instance: k`; the hold, worked out again at each offer and released when the step starts, fails an earlier check, or another step blocks later steps; reactions treat held instances as busy and never hold; no cancellation because the targets are idle; "A `pause` lets the unit in production and every paid unit finish"). Source: `produce`, `offerSteps`, `offerReactions` (reads no hold), `pause` (sets `order = null` only).
- The research candidate paragraph (candidates `at` or `producedBy`; check order; first free instance in candidate then instance order; never holds; the textiles example with town center 2). Source: `researchHandler` and `candidateInstances`; test "takes the first free instance of the named building".
- "A `research` step pays its cost when it starts, on an instance with nothing paid, so it starts running at once and an instance runs at most one research." "Two researches at one instance therefore run one after the other with no gap, each paid when it starts." "It waits, reserving nothing, while no target instance exists or while no entry … ; it waits, reserving its cost, while it is short of resources or no candidate instance is free." Source: `researchHandler`; blacksmith tests.
- Tiers: "A veterancy upgrade occupies its building for its research time, during which the building trains nothing." Source: B-B8 via `paid` non-empty; test "pays no villager while it runs".

docs/aoe4-build-order-format.md:
- "A `produce` or `research` step also waits while the building instances it needs are busy."
- `prerequisite` row: "… or a targeted instance is not free" for `produce`, and "… or no candidate instance is free" for `research`.
- `resources` row: "every earlier check passes but the bank is short of the step's cost …". The old "this is the only reason that reserves" is removed.
- "The order is a missing building or an age (`prerequisite`), then `villagers` or `population`, then `resources`, then, for `produce` and `research`, a busy building (`prerequisite`). A non-reaction step waiting on `resources` or on a busy building reserves its cost; no other wait reserves." Source: handler check order; `offerSteps` reserve.

data/aoe4-build-order/README.md (Spear/Longbow):
- "A blacksmith at 950 s researches the four Feudal attack and armor upgrades, one after the other". The remaining techs are `steeled-arrow-2`, `fitted-leatherwork-2`, `bloomery-2` and `iron-undermesh-2`, all age 2. A measured run has them start at 999, 1059, 1119 and 1179 s.
- "Omitted: the Castle blacksmith upgrades `wedge-rivets`, `balanced-projectiles`, `decarbonization` and `insulated-helm`. A research waits for a free blacksmith and holds back every later step while it waits, so four more 60 s researches would leave the last steps unstarted at 1200 s." Measured: the base build under the new engine leaves steps 73 to 78 unstarted at 1200 s.
- The transcription note was left as it was. The man-at-arms (708.7 s) and crossbowman (715.4 s) steps wait on `resources` only, not on a busy building, so the busy rule makes no sentence of it untrue.

Search criteria: `Queue length is not consulted` and `replaces its order (a switch)` over `docs/` find nothing. `While it waits on resources` and `short of resources alone` in the model doc find nothing. `only reason that reserves` and `` The order is `prerequisite`, then `` in the format doc find nothing.

Comments in code:
- engine-common.ts: "Whether an instance can take step `step`: nothing is paid in its queue and it is not held for another step (Model rules)." Source: the `instanceFree` body.
- simulate.ts `held`: "Free targets the waiting cursor step keeps idle until all its targets are free; set only by offerSteps." Source: the only writers are `offerSteps` and `createEngine` (init).
- simulate.ts `reserve`: "What the armed cursor step reserves while it waits on resources or a busy building." Source: `produce` and `researchHandler` returns.
- research.ts: "Every instance of the candidate buildings, in candidate order, then instance number." Source: `flatMap` over candidates, with each instances list in creation order.
- Test comments state setup facts that the assertions next to them check.

## Build edit check

A probe (deleted) compared the base JSON's steps, with the four techs filtered out, to the new build by `JSON.stringify`. They were equal, and the probe removed exactly 4 steps (82 to 78). No trigger changed.

## builds.test.ts bars

Every `builds.test.ts` case passes. `production-floors.ts` and `MAX_FLOATING_AT_1200` are unchanged. The Spear/Longbow bars "reaches Castle …" and "leaves no villager arriving at an empty resource and no stuck step through 1800 s" pass unchanged.

## Invariant check

- A1: no game number in engine code. Test times are set through `editGameData`.
- A2: a held step reserves its cost (`produce` and `research`). `noneNegative` passes on the several-target, research-at-busy and both reserve cases.
- A3: the hold is a `Set` used only for membership. Candidate order is `producedBy` order, then instance creation order. The deep-equal reruns pass.
- S3: no new inputs.

## Deviations and notes

- `researchTarget` is renamed to `candidateInstances`, because it now returns every candidate instance. The handler needs "no instance" (check 2) apart from "none free" (check 4), with the resources check between them. The ticket asked for the comment to be updated; the name changed as well.
- Criterion "armed at 0 it takes the archery range, whose first longbowman is not yet paid at the first offer (B-B9)": when the `produce longbowman` step comes before the research, the produce handler pays the first longbowman at the 0 s offer, before the research is offered. The research then goes to the idle council hall. The range is taken at 0 only when the research is listed before the produce. Both cases are pinned as candidate rows. The design's sample does not hold for produce-then-research at 0; review may want the design note corrected.
- Unverified assumptions added to the ticket: none.

## Out-of-scope findings

- None found.
