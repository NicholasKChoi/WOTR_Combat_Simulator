# SGS-215 implementer report (7)

- Ticket: SGS-215, Let production continue past the population cap (Feature, risk high)
- Branch: `sgs-215-production-past-population-cap`, base `origin/main` @ 7d74800
- Tip: `ae9295276298cf29d0bcf2eabd3cc43815fdc4fd` (one commit)
- Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-215-production-past-population-cap`
- Status: **needs_review**

The checkout did not exist before the `checkout.sh task` call, so the pre-call record and the own-commit check were skipped, as common.md allows.

## Files touched

- `lib/aoe4-build-order/simulate.ts`: `populationCapReachedAt` moves from `Engine` to `EngineState`; `noteCapReached(state: EngineState)` with no `as Engine` cast; new exported `hasPopulationRoom`; the `produce` handler and `payOrder` call it in place of the inline checks.
- `data/aoe4-build-order/builds/english-spear-longbow-maa-crossbow.json`: retune. The two 1000 s rally steps (Town Center and King's Palace to `gold`) are dropped.
- `data/aoe4-build-order/README.md`: the Spear/Longbow entry is rewritten to match the file; the Council Hall "past the population cap" sentence now names the production past the cap.
- `docs/aoe4-build-order.md`: the `Trigger.count` row; the supply-gate sentences in Priority and Queues; "Houses and supply", plus a new population-limit paragraph; the house-wait and `autoHouses: false` sentences; the feature-list bullet.
- `docs/aoe4-build-order-format.md`: Outputs `spawnedPopulation` and `populationCapReachedAt`; the "supply has no room" sentence; the `population` wait-code row and the wait-detail row.
- `docs/api/openapi.json`: two descriptions (`spawnedPopulation`, the `population` wait detail). No schema, enum or `info.version` change.
- `lib/aoe4-build-order/test-helpers.ts`: `housesDone()` also returns `supplies` (the supply just after each house completes).
- `lib/aoe4-build-order/simulate-population-limit.test.ts` (new): the `hasPopulationRoom` table and the lift, gate, ordering, villager and population-wait tests.
- `lib/aoe4-build-order/simulate-house-gate.test.ts`: the two 1800 s digests are re-pinned; new describe "prebuilt builds before the population cap" with pins taken at the base.
- `lib/aoe4-build-order/simulate.test.ts`: the export list gains `hasPopulationRoom` and the count goes from 15 to 16; new performance test for S3.
- `lib/aoe4-build-order/simulate-construction.test.ts`: the two `maxPopCap` 30 tests are rewritten.
- `lib/aoe4-build-order/research.acceptance.test.ts`: the tier-3 longbowman total at 1800 s is re-pinned.
- `acceptance/aoe4-simulate-api-spend-population.spec.ts`: the last `spawnedPopulation` at 1800 s is re-pinned.

Business logic is about 20 lines in `simulate.ts`.

## Retune (D7)

- **Cause.** The build's first step is an uncapped `produce villager` on the Town Center (D11). Once the limit lifts, it keeps making villagers past 100: 116 at 1800 s and 205 at 3600 s.
- **What went wrong.** The 1000 s rallies sent those villagers to `gold`. They arrived after `gold` ran out (idle-arrival at 1216.2 s: 36 villagers by 1800 s, 125 by 3600 s). `gold#2` then ran out at 1799.4 s.
- **Retune.** Drop the two 1000 s gold rallies. The Town Center keeps its 700 s wood rally and the King's Palace keeps its wood rally, so villagers made past the cap go to wood, which never runs out.
- **Results with the engine change:**
  - `gold` runs out at 1206.874034229912, the same value the old pin holds, so the pinned run-out time in `builds.test.ts` needed no edit.
  - `gold#2` runs out at 1932.47 s and `gold#3` at 2658.06 s, and each has its move-all reaction.
  - No idle-arrival or step-stuck warning at 1800 s or 3600 s.
  - The build still reaches Castle and produces spearmen, longbowmen, men-at-arms and crossbowmen; the production floors hold at 1200 s.
- **Tests and specs.** Every test in `builds.test.ts` passes with its assertions as written (57 passed, 13 skipped). Changing the rally targets to `wood` instead of dropping the steps gave an identical result, so the steps were dropped rather than kept as no-ops.
- **Re-pin.** The 1800 s Spear/Longbow digest in `simulate-house-gate.test.ts` goes from `f3b256384c4bcf0f` to `0732dbf8f9a2b5d8`.
- **`PRODUCTION_FLOORS` entry.** Unchanged; it passes.

## Tests run

### Unit and acceptance results

- **Unit suite** (`npm test`): 96 files passed, 1 skipped; 3137 tests passed, 15 skipped, 0 failed.
- **`simulate-population-limit.test.ts`:** 15 passed.
- **Acceptance specs:** each was run alone after `commands.acceptanceSetup` (`link-node-modules.sh . && npm run acceptance:setup`). The single-file command was `timeout 600 npx playwright test acceptance/<file> --reporter=line`, run through `run.sh`, one invocation per spec, from the task checkout.
  - Edited spec: `aoe4-simulate-api-spend-population.spec.ts`, 7 passed.
  - At-risk specs, all passing:

    | spec | passed |
    |---|---|
    | `-spear-longbow-build` | 3 |
    | `-prebuilt-plans` | 20 |
    | `-house-rule` | 9 |
    | `-house-gate` | 2 |
    | `-prebuilt-farms` | 17 |
    | `-deer-pack` | 3 |
    | `-unit-lines` | 7 |
    | `aoe4-units-chart-upgrade-dots` | 17 |
    | `-contract` | 74 |
    | `-markers` | 10 |
    | `-depletion-engine` | 19 |
    | `-knight-longbow-build` | 4 |
    | `-veterancy-conversion` | 2 |
    | `-triggers` | 60 |
    | `-waits` | 35 |
    | `-edges` | 31 |
    | `aoe4-build-order-knight-longbow-page` | 2 |
    | `aoe4-build-order-pin-compare` | 42 |
    | `aoe4-auto-run` | 14 |
    | `aoe4-gathered-resources` | 5 |
    | `aoe4-builds-api-contract` | 22 |
    | `aoe4-named-builds-api-contract` | 15 |
    | `fight-api-contract` | 31 |
    | `aoe4-build-order-m3-flow` | 3 |
    | `aoe4-build-order-m4-flow` | 1 |
    | `aoe4-build-order-inline-issues` | 14 |

  - `fight-api-spec-surface.spec.ts`: 31 passed, **1 failed**. This failure is pre-existing and unrelated; see Out-of-scope findings.

### Invariants the new tests encode

- **`hasPopulationRoom`**, one row each:
  - before the cap, supply and population both at the cap: false (the D1 case);
  - before the cap, room left: true;
  - the field missing: treated as not reached;
  - after the cap with supply at the cap: true;
  - after the cap with supply below it: false.
- **Gates past the lift**, with a start population of 7 at a cap of 7:
  - a two-target `produce` starts at 0 and both men-at-arms spawn together;
  - a continuous order keeps paying.
- **Same-instant lift.** A step that waited on population starts exactly at `populationCapReachedAt` (60 s), the spawn instant.
- **Lowered cap of 30** (auto-houses on, infinite nodes, full bank):
  - spawned population passes 30;
  - supply after the last house is 30;
  - `populationCapReachedAt` is the first reach;
  - `spent.buildings` does not grow after the cap instant.
- **Start at or past the cap with low supply** (12 villagers, cap 12, Town Center supply 10):
  - `populationCapReachedAt` is 0;
  - exactly one auto-house, with supply 12 after it;
  - the step waits on population and starts at that house's completion.
- **Villagers** (cap 30, `villagerTarget` 40):
  - the default order stops at 40 alive (34 produced);
  - a `produce villager` step goes past it.
- **Population waits**, for ENG 1TC at 1800 s and the lowered-cap fixture:
  - no step's `waitBreakdown.population` exceeds `max(0, populationCapReachedAt - armedAt)`;
  - no step ends with `waitingOn: 'population'`.
- **Pre-cap results equal the base:**
  - ENG 1TC at 1060 s and 1090 s: null cap and the base digest;
  - ENG 1TC, Council Hall and Knight/Longbow: the cap instant equals the base value, and a run to `Math.floor(cap)` has a null cap and the base digest.
- **S3.** An hour of continuous production past the cap finishes under the bound.

## Pre-existing tests edited

Each edit falls under Scope's rule "a test of the changed behavior gets the new expected value". The `maxPopCap` 30 rewrites and the export-list entry also follow that rule's named examples.

- `simulate-construction.test.ts`, "raises supply only at completion and never past maxPopCap":
  - the run now passes `housesDone()` rules;
  - `countAt(villager, 900) === 23` is replaced by `supplies` equal to `[20, 30, 30]` (supply observed directly);
  - a separate assertion checks that the last `spawnedPopulation` is greater than 30.
- `simulate-construction.test.ts`, auto-houses "stop at maxPopCap": `villagersAt(900) === 23` becomes `> 23` (villagers keep spawning past 30). The house-count assertion (2 houses) is unchanged.
- `simulate-house-gate.test.ts`, "prebuilt builds at 1800 s":
  - ENG 1TC: `ebe79d4a4c219f04` becomes `97bf145f743ff06b`;
  - Spear/Longbow: `f3b256384c4bcf0f` becomes `0732dbf8f9a2b5d8`.
- `research.acceptance.test.ts`, "holds 20 tier-2 longbowmen ...": the tier-3 longbowman total at 1800 s goes from 71 to 143.
- `simulate.test.ts`, "exports exactly the seam names": the list gains `hasPopulationRoom` and the `simulate.ts` export count goes from 15 to 16.
- `acceptance/aoe4-simulate-api-spend-population.spec.ts`, "is the spawn instant of the 200th population ...": `last(long.spawnedPopulation)` goes from 200 to 406.

## Pinned outputs

**Base pins**, computed on origin/main 7d74800 before the engine change. A temporary probe test (deleted) ran `simulateBuildOrder(build, ENGLISH, inputsFor(ENGLISH, { durationSeconds }))` and took `digestTimeline`, the same function as in `simulate-house-gate.test.ts`. After the engine change the same probe gave identical values.

| run | populationCapReachedAt | digest |
|---|---|---|
| ENG 1TC, 1060 s | null | `bc6d3b97d709cf02` |
| ENG 1TC, 1090 s | null | `8cdc9dac19376b0f` |
| ENG 1TC | 1094.9413171060362 (at 1800 s) | 1094 s run: null, `75c39cbfd688e42a` |
| ENG 1TC Council Hall | 1158.2043721756909 | 1158 s run: null, `8a940a7a15538c4f` |
| ENG Knight/Longbow (King's Palace) | 1247.0055555555555 | 1247 s run: null, `d4acfe9d43a88bf0` |

**Pins of the new behavior** (engine change plus retuned build):

| test | inputs | pinned value |
|---|---|---|
| house-gate 1800 s digest, ENG 1TC | 1800 s | `97bf145f743ff06b` |
| house-gate 1800 s digest, Spear/Longbow | 1800 s | `0732dbf8f9a2b5d8` |
| `research.acceptance` tier-3 longbowmen | Knight/Longbow, 1800 s | 143 |
| spend-population spec, last `spawnedPopulation` | ENG 1TC, 1800 s | 406 |
| `builds.test.ts` first gold run-out | Spear/Longbow, 1800 s | 1206.874034229912 (unchanged) |

**S3 performance test** (`simulate.test.ts`, "runs an hour of continuous production past the population cap in under two seconds"):
- Request: default English start; continuous Town Center villagers; rallies at 240, 480 and 600 s; 10 barracks; continuous men-at-arms from 900 s; `durationSeconds` 3600; `nodeAmounts` all infinite; auto-houses on.
- Measured: 113 to 205 ms over 10 runs. Final `spawnedPopulation` 754; cap reached at 1270.45 s.
- Bound: 2000 ms.

## Mutation checks

All breaks ran in the `mutate-SGS-215` scratch.
- **Setup.** The scratch was created with `checkout.sh scratch "$PROJECT_DIR" mutate-SGS-215 sgs-215-production-past-population-cap sgs-215-production-past-population-cap` at tip ae92952. It was provisioned with `link-node-modules.sh . && npm run acceptance:setup` (no codegen is set).
- **Reset.** Every break was undone with `git checkout -- <file>` and `git diff --exit-code` was confirmed clean ("reset clean: True" for each).
- **Earlier scratch.** The house-gate, construction, research, simulate-test and builds breaks (M3, M7, M8, M9, M15, M18, M20 on those files) ran in an earlier `mutate-SGS-215` scratch at bd9be4e. Those test files are byte-identical at ae92952; only `simulate-population-limit.test.ts` changed between the two, and every break on it was re-run at ae92952.
- **`tree-record.sh`** on the task checkout, before creating the scratch and after removing it: an empty status listing both times and `hash 6d9b3f285ef4cb73bf050b5c44bc358bfe4a646f` both times. They match.

**Breaks** (`simulate.ts` unless named):
- **M1:** the `produce` handler keeps its old inline check (`state.population + popcap > state.supply`).
- **M2:** `payOrder` keeps its old inline check.
- **M3:** the lift is keyed on supply alone (`supply >= maxPopCap`). This is the D1 rejected alternative.
- **M4:** the lift ignores supply (`populationCapReachedAt != null` only).
- **M5:** `!== null` in place of `!= null`. This is the stated choice for a fake state without the field.
- **M6:** the lift applies only from the next instant (`populationCapReachedAt < state.time`). This is the rejected alternative to a same-instant lift.
- **M7:** `<` in place of `<=` in the pre-cap rule.
- **M8:** `noteCapReached` overwrites on every spawn (the `=== null` guard dropped).
- **M9:** no clamp of supply to `maxPopCap` in `addBuildingInstance`.
- **M10:** OD1 option B, supply growing past the cap: no clamp, plus `planAutoHouse` in `houses.ts` ignoring `room`.
- **M11:** `defaultVillagersDone` dropped from `payOrder`.
- **M12:** `defaultVillagersDone` also caps `produce` steps.
- **M14:** the `noteCapReached(state)` call dropped from `spawnUnit`.
- **M15:** base behavior, where the lift never applies.
- **M16:** the lift needs `supply > maxPopCap`.
- **M17:** `produce` pays only its first target.
- **M18:** the run samples one `SAMPLE_SECONDS` past the horizon.
- **M19:** a slow loop added to `runInstant`.
- **M20:** the 1000 s gold rallies restored in the build JSON.
- **M21:** M1 plus `population` removed from `BREAKDOWN_REASONS`.
- **M22:** `hasPopulationRoom` un-exported.
- **M23:** an extra `export { noteCapReached }`.

M13, where `noteCapReached` reads `population` in place of `spawnedPopulation`, failed nothing. The one assertion it targeted (`spawnedPopulation[after] >= cap`) had no other break and was deleted.

**`simulate-population-limit.test.ts`**, each item and the break that failed it on that item's own assertion (line numbers at ae92952):

| item | break | failure |
|---|---|---|
| row "before the cap, supply and population at the cap" (l.45) | M3 | true, not false |
| row "with room for the unit" | M7 | false, not true |
| row "without the field, as not reached" | M5 (stated choice) | true, not false; M3 also failed it |
| row "after the cap, supply at the cap" | M15 | false, not true; M6 and M16 also failed it |
| row "after the cap, supply below the cap" | M4 | true, not false |
| "starts a produce step on every target together": `populationCapReachedAt` toBe 0 (l.55) | M8 | 14.65 |
| same test: `startedAt` toBe 0 (l.56) | M1 | null; M6 gave 5 |
| same test: 2 men-at-arms at 15 s (l.57) | M17 | 1 |
| "keeps paying a continuous order": l.62 | M8 | 1186.65 |
| same test: l.63 | M2 | 1, not greater than 1 |
| "starts a step that waited on population at the instant ...": l.71 waited > 0 | M3 | 0; M12 also failed it |
| same test: l.72 reached not null | M14 | null |
| same test: l.73 startedAt equals the cap instant (stated choice) | M6 | 65, not 60 |
| lowered cap 30, "lets population grow ...": l.86 | M14 | null |
| same test: l.87 `spawnedPopulation[after-1] < cap` | M8 | 51 |
| same test: l.89 last > cap | M2 | 30 |
| same test: l.90 last supply equals the cap | M10 | 60 |
| "starts no auto-house after the cap": l.94 | M10 | 250, not 150; M14 also failed it |
| start at the cap with low supply: l.106 | M8 | 1200, not 0 |
| same test: l.107 one house | M10 | two houses (supplies 20 and 160) |
| same test: l.108 supplies `[12]` | M9 | `[20]` |
| same test: l.109 waited > 0 | M4 | 0 |
| same test: l.110 startedAt equals the house completion | M16 | null, not 20 |
| villagers, default order: l.121 | M14 | null |
| same test: l.122 equals 34 | M11 | 60; M2 gave 23 |
| villagers, produce step: l.127 | M14 | null |
| same test: l.128 greater than 34 | M12 | 34 |
| population-wait helper: l.136 not null | M14 | null |
| helper: l.139 breakdown bound | M1 | step 1 had 100 s, limit 1e-9 |
| helper: l.141 no final `waitingOn: 'population'` | M21 | step 1 still waiting on population |
| row ENG 1TC 1800 s (l.146) | M14 | null at l.136 |
| row lowered cap (l.152 and l.153) | M8 (l.152, 900 not less than 800); M1 (l.139) | as shown |

**`simulate-house-gate.test.ts`:**

| item | break | failure |
|---|---|---|
| 1800 s digest rows ENG 1TC and Spear/Longbow (l.122) | M15 | the old base digests; M20 also failed the Spear/Longbow row |
| ENG 1TC 1060 s row (l.137) | M7 | digest changed |
| ENG 1TC 1090 s row (l.137) | M3 (D1) | `10949b6277d3d943`; the 1060 s row did not fail under M3, which confirms the test comment |
| null assertion (l.136) | M18 | 1090 s row: 1094.94, not null |
| cap-instant rows, reachedAt (l.146) | M8 | all three rows changed |
| below-run null (l.148) | M18 | all three rows non-null |
| below-run digest (l.149) | M3 | ENG 1TC and Council Hall digests changed |

**Other files:**

| item | break | failure |
|---|---|---|
| construction l.100 supplies `[20, 30, 30]` | M9 | `[20, 30, 40]` |
| construction l.101 spawned > 30 | M2 | 30 |
| construction l.349 villagers > 23 | M2 | 23 |
| research 143 | M15 | 71 |
| simulate.test export names (l.855) | M22 | list one short |
| simulate.test export count 16 (l.859) | M23 | 17 |
| S3 test, final past the cap (l.824) | M15 | 200 |
| S3 test, elapsed < 2000 (l.825) | M19 | 6015.7 ms |
| `acceptance/aoe4-simulate-api-spend-population.spec.ts`, 406 | M15 | Received 200; Playwright run alone in the scratch, 1 failed and 6 passed |

Assertions deleted because no break failed them on their own check:
- `countAt(man-at-arms, 10) === 0`
- `houses.every(t < reached)`
- `steps[1].startedAt` not null in the lowered-cap row
- `spawnedPopulation[after] >= cap` (only M13 targeted it, and it passed)

**Note on criterion 6.** In the population-wait test, the ENG 1TC 1800 s row does not fail under M1. ENG 1TC has no produce step armed after its cap instant, so only its null check (M14) can fail that row. The lowered-cap row is the one that fails when a gate keeps the old check (M1 at l.139).

## Codegen, build, lint

| stage | result |
|---|---|
| codegen | not set |
| build | `link-node-modules.sh . && npx next build` passed |
| lint | `npx tsc --noEmit && npm run lint:dup`: tsc clean, jscpd found 0 clones |
| unit | 3137 passed |

`git diff --stat origin/main` names only the 13 files above; there were no tool-made changes to revert.

## Doc claims

Each claim was reread against the code named for it.

- `docs/aoe4-build-order.md` `Trigger.count`: "1..200 (a request cap)". Source: `schema.ts` `SIM_INPUT_BOUNDS.triggerCount` is `bound(1, 200)`, independent of `maxPopCap`.
- `docs/aoe4-build-order.md` Priority: "A step waiting on supply (which happens only before the population limit lifts, Houses and supply)". Source: `simulate.ts` `produce`, which returns `population` only when `!hasPopulationRoom`.
- `docs/aoe4-build-order.md` Queues: "supply has room for it (until the population limit lifts, after which supply is not checked; Houses and supply)". Source: `payOrder` and `produce` both go through `hasPopulationRoom`.
- `docs/aoe4-build-order.md` Queues: "supply has room for one unit per target (checked only before the population limit lifts, as one check for all targets)". Source: `produce`, where `popcap = targets.length * entry.costs.popcap` is passed once.
- `docs/aoe4-build-order.md` Houses and supply: "capped at `maxPopCap`, 200, and never rises past it; production continues past it under the population limit below". Source: the `addBuildingInstance` clamp and `hasPopulationRoom`.
- `docs/aoe4-build-order.md`, the new population-limit paragraph:
  - "lifts for the rest of the run at the first instant the spawned population ... has reached `maxPopCap` while supply is at `maxPopCap`": `hasPopulationRoom`, with `noteCapReached` setting the field once.
  - "a `produce` step and an order payment skip the supply check": the two call sites.
  - "no house is planned": `houses.ts` `planAutoHouse`, where `room <= 0` at supply equal to the cap with nothing pending.
  - "paid units still in production count toward the supply check but not toward the spawned population": `payUnit` increments `population`; `spawnUnit` increments `spawnedPopulation`.
  - "That spawn lifts the limit within its own instant, so the instant's second step offer and its order payments already see it": `runInstant` runs `applyDueEvents`, then `offerSteps`, then `startProduction`. The test l.73 (start at 60 s) and M6 confirm it.
  - "start population already at or past the cap ... supply check still applies, auto-houses build up to the cap, and the limit lifts at the instant supply reaches it; without houses ... it never lifts": `hasPopulationRoom` plus `planAutoHouse` `room`; tests l.106 to l.110.
  - "A `produce villager` step keeps producing past the cap; the default villager order still stops at `villagerTarget`": `defaultVillagersDone` (step null only); tests l.122 and l.128.
- `docs/aoe4-build-order.md`: "before the population limit lifts, supply may block production meanwhile"; and "before the population limit lifts production blocks at supply until a `build house` step adds more". Source: `hasPopulationRoom`.
- `docs/aoe4-build-order.md` feature list: "the population cap, where supply stops and past which production continues once the cap is reached". Source: the clamp and the lift.
- `docs/aoe4-build-order-format.md` `spawnedPopulation`: "It may exceed the population cap once the cap has been reached, since production then continues with supply at the cap". Source: the lift; the S3 test shows 754.
- `docs/aoe4-build-order-format.md` `populationCapReachedAt`: "keeps that first instant when later spawns take `spawnedPopulation` past the cap". Source: the `noteCapReached` `=== null` guard; M8 breaks it.
- `docs/aoe4-build-order-format.md`: "while supply has no room (only before the population limit lifts ...)"; the `population` row "Only before the population limit lifts; after it no step waits on `population`"; and the wait-detail row "only before the population limit lifts". Source: `produce`'s only `population` return is behind `!hasPopulationRoom`.
- `docs/api/openapi.json` `spawnedPopulation`: "May exceed the population cap once it has been reached, since production then continues with supply at the cap."
- `docs/api/openapi.json` population detail: "Occurs only before the population limit lifts (the population cap reached with supply at the cap)."
- `data/aoe4-build-order/README.md`, Spear/Longbow:
  - "whose `produce villager` step is not capped and keeps making villagers past the population cap": the build's first step, `defaultVillagersDone`. The probe gave 116 villagers at 1800 s.
  - "the King's Palace, whose default order stops at the simulator's 100-villager target": no produce step targets `kings-palace`.
  - "No rally sends villagers to gold after 700 s": the remaining rally steps are 130 s and 560 s to gold, 200 s and 700 s to wood, and the King's Palace to wood.
  - "never reach a gold deposit that has run out": `builds.test.ts` shows no idle-arrival at 1800 s or 3600 s.
  - "run `gold`, `gold#2` and `gold#3` out at about 20, 32 and 44 minutes": 1206.9 s, 1932.5 s and 2658.1 s at 3600 s.
- `data/aoe4-build-order/README.md`, Council Hall: "these techs and the continuous longbowman and spearman production, which goes on past the cap, spend part of the economy's income, and the rest floats". Probe at 1800 s: population 400; floating gold 7091, food 3390, wood 16425.
- `lib/aoe4-build-order/simulate.ts` doc comment on `hasPopulationRoom`: "Whether supply has room for `popcap` more population; always true once the population cap has been reached with supply at the cap". Source: the function body.
- `test-helpers.ts` comment: "The completion time of each house and the supply just after it". Source: the `onBuildingComplete` hook, which runs after `addBuildingInstance` in `completeConstruction`.

## Invariant check

- **A1 (game numbers from data):** upheld. `hasPopulationRoom` reads `data.base.maxPopCap.value`; no new numeric literal (the literal-scan test passes); the tests use caps 7, 10, 12 and 30.
- **A2 (resources never negative):** upheld. The gates only skip the supply check; `canAffordHeld` and `canAfford` still precede every payment.
- **A3 (determinism):** upheld. There is no randomness or clock, and pre-cap runs are byte-identical to the base digests.
- **S3 (bounded time):** upheld. `durationSeconds` is at most 3600 and production times are positive. The S3 test measured at most 205 ms against a 2000 ms bound.

## Unverified assumptions added

None. No test fakes an external behavior.

## Out-of-scope findings

1. **Pre-existing acceptance failure.** In `acceptance/fight-api-spec-surface.spec.ts`, the test "has exactly the pinned fight and AoE4 schema names and no others" fails because `docs/api/openapi.json` has a `RenameNamedBuildRequest` schema that the spec's pinned name list does not include. This branch's OpenAPI diff changes two description strings only, so the failure comes from the base, most likely from the rename-named-build feature (e396ca3).
2. **Request bound vs build schema.** The ticket's S3 criterion asks for "the maximum startVillagers". `SIM_INPUT_BOUNDS.startVillagers` is 0..200 per node, but `checkBuildOrder` requires `start.villagers` to sum to the civ's 6, so no valid request starts with more than 6 villagers. The S3 test therefore uses the default start, and production past the cap comes from the steps. A probe with 800 start villagers, an invalid request run straight through the engine, took 121 to 205 ms.
3. **Population-wait coverage.** Criterion 6's ENG 1TC 1800 s run has no produce step armed after its cap instant, so that row cannot catch a gate that keeps the old check; the lowered-cap row does (see Mutation checks).
