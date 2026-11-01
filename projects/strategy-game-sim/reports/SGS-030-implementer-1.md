# SGS-030 implementer report 1

- Ticket: SGS-030 (AoE4 simulation engine core), risk high
- Branch: `sgs-030-aoe4-engine-core`, base `origin/main` dbe695f
- Tip: f65781517a3af8dfe341ee5ee6268a989c5abd44 (one commit)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-030-aoe4-engine-core
- Status: `needs_review`

## Files

- `lib/aoe4-build-order/simulate.ts` (new): the event loop, trigger test, step arming and handler seam, per-instance paid FIFO and order payments, priority reserve, rally state, income, sampling and the result.
- `lib/aoe4-build-order/civ-rules.ts` (new): `CivRuleContext`, `CivRules`, frozen `NO_CIV_RULES`, and `civRules`, which throws for an unknown civ.
- `lib/aoe4-build-order/simulate.test.ts` (new): 56 unit tests.
- `docs/aoe4-build-order.md`: adds the Priority paragraph under "Ordering and triggers", two "Queues" paragraphs, the step-life wait causes and completion rule, and says `NO_CIV_RULES` is frozen. "Houses and supply" is not touched.

Size: simulate.ts has 485 non-blank, non-comment lines. Seam types are about 77 of those and imports about 9, which leaves roughly 400 lines of logic. civ-rules.ts has 27, almost all types. That is at the ticket's ~400 estimate, not materially over it, so I did not split anything.

## Tests (`npm test`: 19 files, 542 tests, all pass; simulate.test.ts: 56 pass)

- **Never negative (A2), using a barracks GameData with food 0 and gold 100:**
  - Every floating value is >= 0.
  - startedAt is close to 90/(6r) and greater than armedAt; waitSeconds equals startedAt - armedAt.
  - The first villager is paid at startedAt + 50/(6r). The test reads it as the armedAt of an `at 7 vils` step, which equals that time + 20.
  - Man-at-arms completes at startedAt + 14.65.
- **Priority:**
  - With food 200 and gold 0, the villager order pays at 0 and 20 while the step stays `waiting`.
  - With food 120, the order skips the payment that would drop food below the 90 reserve.
- **Payment:**
  - A unit is never paid short: food 49.5 with no income pays nothing.
  - At the same instant the step beats the order payment: with food 65, the scout is paid and the villager is not.
- **Determinism (A3):**
  - Two runs are deeply equal with a mid-game rally and with a start split.
  - The order, the inputs and `GameData` civData and base are not mutated.
  - Neither file reads a clock or random source.
  - A start split puts villagers at t=0 with no walk.
- **Default start:**
  - Villager counts are 0@15, 1@20, 2@40, 3@60 and 3@120.
  - Food rate is 6r·60 at 20 and 7r·60 at 25. Food at t=0 is 150.
  - The scout is in population (without it, 4 villagers by t=80) but in no series.
- **Triggers:** `@0:30` arms at 30. `at 8 vils` arms at 40. A blocked step is `waiting` and the step after it is `not-reached` with armedAt null.
- **Same instant:** `@0:20` rally routes the villager spawning at 20 (wood from 25). `at 7 vils` routes villager 8, not 7.
- **Rally scope (probe handlers on `move` and `build`, removed in `finally`):**
  - With `instance: 1`, only that instance changes.
  - A baseId-wide rally changes every existing instance and the default.
  - A rally for an unbuilt instance is held. New instances take the held rally, then the default, then `start.rally`, and a held rally beats the default.
  - A later baseId-wide rally overrides a held one.
  - A villager `produce ... rally` sets the standing rally.
  - A `rally` step's timings are equal to its armedAt and it is `completed`.
  - Walk time is (walkSeconds ?? inputs.walkSeconds)/moveSpeed, checked with a GameData whose moveSpeed is x2.
- **Switch and pause:**
  - Scout `@0:10`: food at 10 is 150 + 6r·10 - 65. The scout spawns between 40 and 45, the step completes at 43, the series order is [villager, scout], and no villager is paid after 10.
  - A pause at 10 has all timings at 10, the villager still spawns at 20, and none follow.
  - Pausing a missing instance (`#2`) or a missing baseId is a completed no-op. A town-center built afterwards gets the default order.
- **Completion:**
  - `x2` completes at 40.
  - A continuous produce is `in-progress` at the horizon, and `completed` at 30 when a pause at 30 replaces it (the paid villager still spawns at 40).
  - A later produce replacing it completes it at 30; that scout completes at 63.
- **Produce waits:** a missing `#2` waits and blocks the next step. The age-2 spearman waits and does not reserve. Supply-blocked waits do not reserve.
- **Seam:**
  - `build`, `move` and `research` steps are `waiting` and block the next step.
  - A registered `build` handler starts with no loop change and is removed in `finally`.
  - `schedule` runs events by time, with ties in insertion order.
- **Sampling:** samples are every 5 s, the last two for a 62 s run are 60 and 62, every array has times.length entries, a 60 s run ends 55, 60, and a `@0:00` rally starts at 0. The test also checks the result's shape.
- **Hooks:** one hand-computed check for each of gatherRateModifier, productionModifier, supplyProvider (plus the maxPopCap cap), villagerProducer, dropOffRule and startingState. The dropOffRule check uses a 20 s town-center walk and expects 6·10/(10/0.75+2.86)·60. Also: `civRules('english') === NO_CIV_RULES`, it is frozen, and it gives the default result.
- **Data sensitivity (A1):** villager costs.time, a productionSpeed effect and the sheep rate each change the output.
- **Performance:** a 3600 s run with 20 steps finishes in under 1 s (measured in milliseconds) and produces 180 villagers.
- **Source shape:**
  - The exports are exactly the seam names (12 in simulate.ts, 4 in civ-rules.ts).
  - Numeric literals are limited to 0, 1, 60, the single 5 in SAMPLE_SECONDS and the one tolerance.

## Mutation checks

A scripted driver applied each break, ran the suite, and restored the file in `finally`. `git status` was clean afterwards. Every break below failed at least one test:

- **Payment and priority:**
  - Paying within 1 instead of the tolerance: fails "never pays short".
  - Removing the clamp (and subtracting 1e-6): 20 tests fail.
  - Ignoring the reserve: the A2 start, priority and skip tests fail.
  - Reserving every kind: the food 200 / gold 0 test fails.
  - Paying orders before steps: the tie, skip and counted-completion tests fail.
- **Instant order and triggers:**
  - Removing the first offer pass: fails `@0:20` rally.
  - Removing the second offer pass: fails `at 8 vils` and the A2 villager timing.
  - A villagers trigger that ignores walking villagers: fails 8 vils.
  - A strict `>` time trigger: 10 tests fail.
- **Rally:**
  - Default over held: fails held precedence.
  - A wide rally that keeps held entries: fails the override test.
  - Held rallies never consumed: fails the held test.
  - A rally that hits all instances: fails instance scope.
  - Ignoring the produce rally: fails the standing rally test.
- **Supply and walk:** removing the supply cap fails the cap test. Ignoring moveSpeed, or the source's walkSeconds, fails the walk test.
- **Produce and pause:**
  - Not paying the first unit: fails the switch and completion tests.
  - No supply check, age check or target check: fails the matching wait test.
  - No completion from produce or from pause, a pause that keeps the order, or a counted order that never ends: each fails its completion or pause test.
- **Status and sampling:** reporting waiting as in-progress fails 6 tests. Dropping the trailing sample fails sampling. Dropping the x60 fails 11 tests.
- **Hooks:** a swapped drop-off view, or ignoring any of the six value hooks, fails that hook's test. The supplyProvider break also fails performance.
- **Start:** ignoring the start split fails the split and trigger tests. Leaving units out of population fails the default-start, supply-wait and supply tests.
- **Seam and loop:**
  - Reversed schedule ties: fails the schedule test.
  - Series not sorted by first spawn: fails the switch test.
  - A missing handler treated as started: fails the seam test.
  - Ignoring productionSpeed: fails the productionSpeed test.
  - No wake on affordability: fails A2.
  - Not recording waitSeconds: fails A2.
- **Source shape:** an extra export, an extra literal and a `Date.now` read each fail their test. Mutating the inputs fails no-mutation. Run-to-run drift fails deep equality.
- **civ-rules:** an unfrozen `NO_CIV_RULES` and English not mapped to `NO_CIV_RULES` each fail the defaults test.
- **Not mutated:** the performance test's time bound, which is a guard, not logic.

## Gates

- No codegen in REPO.md.
- `npx tsc --noEmit` (lint) passes.
- `npm test` passes: 542/542.
- `npx next build` passes.
- `git diff --stat origin/main` shows only the four files above, with no tool churn.
- Node v24.22.2 matches engines 24.x.

## Invariant check

- **A1 (no game numbers in code):** upheld. The only literals are 0, 1, 60 (per minute), SAMPLE_SECONDS = 5 and `RESOURCE_TOLERANCE = 1e-9`, and a test enforces this. Every game value comes from GameData or SimInputs.
- **A2 (no negative resources, waits reported):** upheld. Payment needs every resource to cover the cost within the tolerance, then clamps at 0. Waits appear as armedAt, startedAt, waitSeconds and `waiting`.
- **A3 (deterministic):** upheld. There is no clock or random source. Events are ordered by time, then insertion. Map iteration follows insertion order. The series order breaks ties with a plain `<` on unitId, not a locale compare. Neither the inputs nor GameData is written.

## Interpretations to confirm in review

- A baseId-wide `rally` also clears that baseId's `heldRallies`, so a later wide rally overrides one held earlier for an unbuilt instance; the ticket only says "last writer wins". Under this reading a held rally beats the default only when it was written after the wide rally.
- `dropOffRule`: gather.ts picks the walk from real buildings and the ticket forbids changing gather.ts. When the hook disagrees with the default, the engine passes gather.ts an inputs view whose two walk fields both carry the walk the hook selected.
- An order payment that waits on resources counts as a wake candidate, as the ticket says. An order blocked on supply or age adds no wake, because nothing in this ticket changes those during a run.

## Out-of-scope findings

- The ticket cites docs line numbers from 68e004a (for example the step-life section "l.380-403" and Queues "l.131-133"). On the current main these sections sit near l.150 and l.455-480. I edited the sections by heading.
- The docs' Outputs section says `unitsProduced` has one series "per unit entry and tier"; the ticket orders the series by first spawn, then unitId. The two agree, but the docs never state the order. I left that alone because the ticket does not ask for it.
