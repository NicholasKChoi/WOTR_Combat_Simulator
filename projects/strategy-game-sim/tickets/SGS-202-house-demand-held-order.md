# SGS-202: Leave a held instance's order out of the auto-house demand

- **Type**: Bug
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: low
- **Risk**: high
- **Invariants**: A2; A3
- **Unverified assumptions**: none
- **LOC estimate**: 15 (one condition in `houseDemand`, plus doc sentences)
- **Depends on**: none
- **On merge**: none
- **Source**: BACKLOG.md "houseDemand counts a held instance order" (reported by SGS-190 review)

## Context

While a `produce` step waits for a busy building, `offerSteps` records the free instances it holds in `engine.held`, and `startProduction` pays nothing for the order of a held instance. `houseDemand` in `lib/aoe4-build-order/simulate.ts` still adds that held instance's order to `populationPerSecond`, so the planner projects population growth that cannot happen while the hold lasts and may plan auto-houses early. The size of the effect is not measured.

The manager filed this as a Chore. It is not one: it changes the timings of builds that combine a held instance with `autoHouses`, so it is a Bug with a visible (small) result change. Risk is `high` because it changes what a run computes (PROJECT.md strongModelTriggers: simulation rules, order of operations a result depends on).

### Cause

`houseDemand` sums `entry.costs.popcap / productionSeconds` for every instance with an order whose `remaining !== 0` and whose default villagers are not done. It never consults `engine.held`, which `startProduction` does consult (`!engine.held?.instances.has(instance)`). The existing tests pin the hold (`simulate-busy-buildings.test.ts`) and the planner (`houses.test.ts`, `simulate-house-gate.test.ts`) separately, so none combines a held instance with a house that becomes due.

### Which hold each house pass reads

`runInstant` runs: house pass 1, `offerSteps` 1, `applyDueEvents`, house pass 2, `offerSteps` 2, `startProduction`, house pass 3. `engine.held` is written only by `offerSteps` (reset to `null`, then set by the blocking `produce` step's `hold`), so each house pass reads the hold the most recent `offerSteps` left: pass 1 reads the previous instant's `offerSteps` 2, pass 2 reads `offerSteps` 1, pass 3 reads `offerSteps` 2. This is the current hold, not a stale one: a busy target frees only when its completion event shifts its `paid` queue (`instanceFree` in `engine-common.ts` checks `paid.length`), events apply after `offerSteps` 1, and a reaction treats held instances as busy. So a step that holds instances at the end of an instant cannot start before `offerSteps` 2 of a later instant. At the instant it starts, passes 1 and 2 still see the instance held (correctly: `offerSteps` 1 holds it again), and pass 3 sees the hold ended, with the instance now carrying the started step's order. A hold can end at `offerSteps` 1 without the step starting (pass 1 started a house or set `houseHold`, so the step fails its resource check); then pass 1 excludes the instance and passes 2 and 3 count its order, matching the hold `startProduction` sees. Neither case delays a house start beyond the pass where the hold ends.

### Production-time check

`houseDemand` calls `productionSeconds`, which throws for a unit time that is not a positive finite number. `docs/aoe4-build-order.md` (the `productionModifier` paragraph after the Extension points hook table) promises the check runs "when auto houses estimate supply demand, which covers every unit an instance holds an unfinished order for, even one not yet paid", and `simulate.test.ts` ("checks the production time of an ordered villager that is never paid while auto houses plan supply") pins it. This ticket keeps that promise: the held instance's production time is still computed and checked; only its rate is left out of the sum.

## Scope

- `houseDemand` in `lib/aoe4-build-order/simulate.ts`: for an instance whose order counts today, still call `productionSeconds` (so a bad time still throws), but add its rate to `populationPerSecond` only when the instance is not in `engine.held.instances`, the same condition `startProduction` uses to skip paying its order. A busy instance with a paid unit still counts, as today. Read `engine.held` as it stands when the pass runs; do not recompute or snapshot it per instant.
- Docs made untrue, in `docs/aoe4-build-order.md`: the Houses and supply statement that the projection adds "the combined rate of every producer with an order" (it must name the held-instance exclusion, and that a pass uses the hold as the latest step offer left it, so the passes of an instant before the offer that starts the held step still exclude it). Check that the Queues paragraph (a held instance pays nothing for its order) and the `productionModifier` paragraph (the check covers every unfinished order, even one not yet paid) still read correctly; the latter stays true by the Scope line above. In `lib/aoe4-build-order/README.md`, the bullet that lists what `held` does (`startProduction` pays nothing for the order of a held instance) gains the demand exclusion if it lists the effects of `held`. The implementer writes the wording.
- Tests: add the regression tests named below. A test of the changed behavior takes the new expected value; any other test keeps its expected value and pins the old setting in its setup. Search the AoE4 tests that combine `autoHouses` with a waiting `produce` on several instances (for example `simulate-busy-buildings.test.ts`, `simulate-house-gate.test.ts`, `simulate.test.ts`) for results that move; the implementer lists every test it edits.

**Out of scope:** changing how `engine.held` is computed or when `offerSteps` runs; the planner math in `houses.ts` (`planAutoHouse`); the reserve and house-hold payment rules; any change to the three-pass order in `runInstant`.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] (respec 1) With `autoHouses` on, a held instance's order contributes nothing to the projected population rate: a test builds a case where a `produce` step holds a free producer with an order while it waits for a busy one, and the first auto-house starts later than at the base. The test first asserts the instance is held at the instant the base engine starts that house, so a data change fails it loudly; it pins the start the fixed engine returns, and the report records the base and fixed starts. The case is one where the first house pass of an instant decides the start (the hold was set at an earlier instant), so a mutation that ignores `engine.held` in the first pass only (or clears it before that pass) fails the test.
- [ ] A producer with an order that is not held, and one that is busy with a paid unit, still count toward the rate: a test with the same build and no held instance gets the same house start as at the base (a mutation that skips every instance with an order fails it).
- [ ] (respec 1) Each house pass uses the hold the latest `offerSteps` left, so the exclusion ends in the first pass after the offer that starts the held step: in the instant the step starts, the passes before that offer exclude the instance and the pass after it counts the instance's new order. A test pins a house that becomes due only once that new order counts: it asserts the house starts at the held step's start time, and fails if the exclusion outlives the hold (a mutation that keeps excluding the instance for the rest of that instant, for example by reading the hold as it stood at the instant's first pass, moves the start later).
- [ ] (respec 1) A held instance's order still has its production time checked while auto houses estimate demand: a test where a held instance's order has a production time that is not a positive finite number makes the run throw the production-time error with `autoHouses` on, and the same build with `autoHouses` off does not throw, so the throw is shown to come from the demand estimate. A mutation that skips a held instance before its production time is computed fails it.
- [ ] Existing tests of changed behavior take the new expected value; every other existing test keeps its assertions, with the old setting pinned in its setup where needed; the report lists each edited test.
- [ ] (respec 1) The docs named in Scope state that a held instance's order is not counted in the house demand and which hold each pass uses; the `productionModifier` paragraph's claim that the check covers every unfinished order stays true; no doc sentence is left contradicted.
- [ ] Determinism holds: the same build order and data give the same timings across a re-run (A3), and resources never go negative (A2); the existing tests asserting both pass.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-17

- Underspecified: the ticket did not decide whether a held instance's production time is still checked (the `productionModifier` doc paragraph and an existing test promise it is), and criterion 3 claimed the order counts "from that instant", including the first pass, which contradicts reading `engine.held` as is.
- Changed: `houseDemand` keeps calling `productionSeconds` for held instances and drops only their rate, with a new throw test; Context now traces which hold each pass reads (the held step can only start at the second offer of an instant, so passes 1 and 2 exclude and pass 3 counts, with no delayed house); criteria 1 and 3 now pin the first-pass exclusion and the third-pass inclusion with mutations that can fail.
- No branch work exists yet; nothing to keep or discard.

## Rework 1 - 2026-11-17 (review)

Review (report `reports/SGS-202-review-6.md`) bounced tip eaa9429; no earlier gate had run on it.

Findings:
- `lib/aoe4-build-order/simulate-busy-buildings.test.ts:285,296-297,306`: `countingHeld` is the hard-coded 48.383333333 and the assertions `toBeGreaterThan(2)` / `toBeLessThan(70)` compare it with fixed numbers, so they can never fail; criterion 1 needs the base engine's house start to be checked against the hold.
- Same file, test 3: its name says the house starts "when the wood is banked", which nothing checks (text).

Required fixes:
- [x] Compute `const countingHeld = simulate(busy).houseStarts[0]` instead of the literal; pin it in test 3 with `toBeCloseTo(48.383333333, 6)`; in test 1 bound it below by 2 and above by `withHold.result.steps[3].startedAt`.
- [x] Rename test 3 to `'still counts producers that are not held, so the same build with no hold starts its first house at 48.383 s'` (text).
- [x] Optional, non-blocking: wrap `lib/aoe4-build-order/README.md:151` at about 110 characters.
