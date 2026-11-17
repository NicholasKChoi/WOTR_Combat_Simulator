# SGS-202 implementer report

- Ticket: SGS-202, "Leave a held instance's order out of the auto-house demand" (Bug, risk high)
- Branch: `sgs-202-house-demand-held-order`, base `origin/main` bd0caf970d255207d84956d29ad57f700836a6af
- Tip: eaa9429 (one commit on top of the base)
- Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-202-house-demand-held-order
- The checkout was new, so there was no pre-call record and no own-commit check.

## Files touched

- `lib/aoe4-build-order/simulate.ts`: in `houseDemand`, `productionSeconds` still runs for every counted order. The rate is now added only when `engine.held` does not contain the instance.
- `docs/aoe4-build-order.md`: in Houses and supply, two sentences after "the combined rate of every producer with an order": the held-instance exclusion, and which hold each run reads.
- `lib/aoe4-build-order/README.md`: the `held` bullet now also lists the demand exclusion.
- `lib/aoe4-build-order/simulate-busy-buildings.test.ts`: a new describe, "auto-house demand leaves out the orders of held instances", with 5 tests. Imports added: `CivRules`, `constructionSeconds`, `housesDone`.

## Tests

- Fixture: age 2; a capital TC, 3 barracks and 2 houses (supply 30); wood 0; spearman time 2 with wood cost 0; man-at-arms time 70. Start: `{ sheep: 7, wood: 2 }`, rally sheep. Inputs: `walkSeconds: 0`, infinite sheep, 120 s.
- Steps: man-at-arms on barracks 2 (count 1); spearman on barracks 1 (continuous); spearman on barracks 3 (continuous); then `produce spearman` on all barracks, triggered at 1 s. That last step holds barracks 1 and 3 from 2 s until barracks 2 frees at 70 s.
- A house start is read as its completion time (`housesDone`) minus `constructionSeconds(house time, 1)`. The walk is 0.

The five tests:
1. **Hold guard.** Asserts that step 3 is armed at 1, starts at 70 and waits 69 s on prerequisite. Asserts that the base start, 48.3833 s, falls inside the hold (more than 2, less than 70). Asserts that the spearman count is 2 at 5, 45, 50 and 65 s, so the held barracks pay nothing through that instant.
2. **Criterion 1 and 3.** The first house starts at exactly 70 s, equal to `steps[3].startedAt`. That is pass 3 of the instant the held step starts.
3. **Criterion 2.** The same build without the holding step (barracks 1 and 3 busy with paid spearmen) starts its first house at 48.383333 s (`toBeCloseTo`, 6 digits). This is the same start as at the base.
4. **A2 and A3.** `noneNegative`, and a second run deep-equals the first.
5. **Criterion 4.** Barracks 1 runs a continuous man-at-arms order (time 10) and barracks 2 trains spearman ×1 (time 1000). The step `produce spearman` at 1 s holds barracks 1 from 10 s. `productionModifier` returns 0 for man-at-arms when `ctx.time > 10`. So the bad time exists only while the order is held and never paid; man-at-arms #1 was paid at 0 s with a valid time.
   - With `autoHouses: false`: no throw, and 1 man-at-arms by 120 s.
   - With `autoHouses: true`: throws `production time for "man-at-arms" at "barracks" must be a positive finite number, got 0`.
   - This follows the gate note: the unit with the bad time is never paid.

Results:
- New tests: 5/5 pass, and the whole file passes (42 tests).
- `npm test`: 91 files passed, 1 skipped; 2863 tests passed, 15 skipped; 0 failed.

## Pinned outputs

- House starts: fixed held build 70; base held build 48.38333333333334; no-hold build 48.3833 on both the base and the fixed engine.
- Tests 1 and 3 pin 48.383333333 (the `countingHeld` constant). Test 2 pins 70.
- The base start, 48.3833, is fractional. It is the wake at which the house's wood is banked, which shows the first house pass of that instant decided it (mutation M1 below confirms this).

## Bug regression record

- Scratch checkout `regress-SGS-202` at base bd0caf970d255207d84956d29ad57f700836a6af, with the new test file copied in.
- Command: `npx vitest run lib/aoe4-build-order/simulate-busy-buildings.test.ts -t 'auto-house demand'`
- Result: 1 failed, 4 passed. The failure was "starts the first house later, at the held step start, once the new orders count": `AssertionError: expected 48.38333333333334 to be 70`.
- The scratch checkout was then removed.

## Mutation checks

Every break was undone, and the 5 tests pass on the final tree.

| Break | Where | What failed |
|---|---|---|
| M1: clear `engine.held` for the first house pass only | `runInstant`, simulate.ts:745 | Test 2: `expected 50 to be 70` |
| M2: read the hold as it stood at the instant's first pass, for all three passes (module snapshot taken in `runInstant`) | `houseDemand` | Test 2: `expected 72 to be 70` |
| M3: skip a held instance before `productionSeconds` | `houseDemand` `if` condition | Test 5: `expected function to throw an error, but it didn't` |
| M4: add 0 for every instance with an order | `houseDemand` | Test 3: `expected undefined to be close to 48.383333333` (no house at all); test 2 also failed |
| Drop `!engine.held?.instances.has(instance)` from `startProduction` | simulate.ts:659 | Test 1: `toMatchObject` on step 3 failed; tests 2 and 5 also failed |
| Add `Math.random()` to the demand rate | `houseDemand` | Test 4: `toEqual` failed (deep equality); test 2 also failed |

`noneNegative` in test 4 got no break of its own; it is the existing A2 helper.

## Pre-existing tests edited

None. The full suite passes unchanged, including the pinned prebuilt-build digests in `simulate-house-gate.test.ts`. No existing result moved.

## Doc claims

1. docs/aoe4-build-order.md: "An instance held for a waiting step (Queues) adds nothing, since its order pays nothing while held."
   - True by `simulate.ts:houseDemand`, which adds 0 when `engine.held?.instances.has(instance)`, and by `startProduction`, which skips `payOrder` for held instances.
2. docs/aoe4-build-order.md: "Each run reads the hold the latest step offer left, so in the instant the held step starts, the runs before the offer that starts it still leave the instance out, and the run after production starts counts its new order."
   - True because `houseDemand` reads `engine.held` directly, which only `offerSteps` writes.
   - `runInstant` order: house pass, `offerSteps`, events, house pass, `offerSteps`, `startProduction`, house pass.
   - Shown by test 2 and mutation M2.
3. README.md: "`startProduction` pays nothing for the order of a held instance, and `houseDemand` leaves that order's rate out of the projected population."
   - True by `simulate.ts:startProduction` and `houseDemand`.
4. Code comment in `houseDemand`: "Computed even for a held instance: it checks the production time of every unfinished order."
   - True: `productionSeconds` is called before the held test, and it throws on a bad unit time. Shown by test 5 and mutation M3.

Checked and still true, with no change:
- The Queues/reserve sentence (doc line ~188): "an instance it holds (Queues) pays nothing for its order".
- The `productionModifier` paragraph: "covers every unit an instance holds an unfinished order for, even one not yet paid".

## Codegen, build, lint

- codegen: not set.
- build (`npx next build`): succeeded.
- lint: `tsc --noEmit` reported no errors; `npm run lint:dup` found 0 clones.
- `git diff --stat origin/main` lists only the 4 files above. No tool-made changes needed reverting.

## Invariant check

- A2 (resources never negative): only the demand estimate changes; payments are untouched. Test 4 and the existing `noneNegative` tests pass.
- A3 (determinism): no new state, and the hold is read as it stands. Test 4 and the existing determinism tests pass.
- A1: no game number is hard-coded in engine code.

## Unverified assumptions added

None. The tests use the real engine; the only fakes are edited data and a `productionModifier` hook, which the tests set up for their cases.

## Out-of-scope findings

None.

## Status

`needs_review`
