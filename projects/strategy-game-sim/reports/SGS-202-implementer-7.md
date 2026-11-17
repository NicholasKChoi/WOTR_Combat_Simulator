# SGS-202 implementer 7 (Rework 1)

- Ticket: SGS-202-house-demand-held-order (Bug, risk high), corrective pass for Rework 1 (review report SGS-202-review-6.md)
- Branch: sgs-202-house-demand-held-order
- Tip: c25d26efa3738f44bbc01fe80539a6945bfddebf (parent eaa9429)
- Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-202-house-demand-held-order
- Own-commit check: skipped. The checkout had no `origin/sgs-202-house-demand-held-order` ref, and `checkout.sh task` reused it with the tip unchanged (eaa9429).

## Required fixes (all ticked in the ticket)

- [x] `countingHeld` is now `simulate(busy).houseStarts[0]`, computed after `simulate`. Test 3 pins it with `toBeCloseTo(48.383333333, 6)`. Test 1 bounds it below by 2 and above by `withHold.result.steps[3].startedAt!`.
- [x] Test 3 is renamed to `'still counts producers that are not held, so the same build with no hold starts its first house at 48.383 s'`.
- [x] Optional: the `lib/aoe4-build-order/README.md` line at 151 now wraps before `Rules:` (110 characters).

## Files touched

- `lib/aoe4-build-order/simulate-busy-buildings.test.ts`: `countingHeld` is now computed by the engine, with a new upper bound in test 1 and the rename and pin in test 3.
- `lib/aoe4-build-order/README.md`: line wrap only, no change to the wording.

## Tests

- `simulate-busy-buildings.test.ts`: 42 passed.
- `npm test`: 91 files passed and 1 skipped; 2863 tests passed and 15 skipped.
- Invariants these tests encode are unchanged from implementer-5: a held instance's order is left out of the demand rate, a no-hold build is unchanged, A2 holds (no resource goes negative), and A3 holds (the same result on a re-run).

## Pre-existing tests edited

- `simulate-busy-buildings.test.ts`: "holds barracks 1 and 3 ..." and the no-hold test (renamed). Both were added on this branch, not pre-existing on main. The Rework 1 required fixes called for these edits.

## Doc claims

- Test comment: "With the held orders counted, the first house starts where the no-hold build starts it."
  - Support: implementer-5 recorded these base-engine starts: held build 48.38333333333334, no-hold build 48.3833.
  - Test 3 pins the no-hold value at 48.383333333.
- The README sentence is unchanged; only the line wrap moved.

## Pinned outputs

- `countingHeld` = 48.383333333, to 6 digits. Test: "still counts producers that are not held, so the same build with no hold starts its first house at 48.383 s". Input: the `busy` steps with the describe's game and start.

## Mutation checks

Every break was undone. Checked with `git diff` before the commit.

| # | Break | Result | Undone |
|---|-------|--------|--------|
| 1 | `simulate.ts:679`, `rate` changed to `rate * 0` | Test 3 failed on `expected undefined to be close to 48.383333333`. Test 1 failed at `:296` (TypeError: undefined was compared, because no house starts). | yes |
| 2 | Test data: man-at-arms time 70 changed to 40, with the `toMatchObject` line removed to isolate the bound | Test 1 failed at `:296` on `expected 48.38333333333334 to be less than 40`, which shows the upper bound is live. | yes |

Notes:
- Mutation 2 is a data break, not a production break. Weaker production breaks (`rate * 0.3`, `rate * 0.05`) left the no-hold start at 48.383, so no `houseDemand` change short of a zero rate moves it past the hold.
- The upper bound is therefore the data guard criterion 1 asks for: it fails loudly when the data changes.

## Codegen, build, lint

- Codegen: not set.
- Build (`next build`): passed.
- Lint (`tsc --noEmit` plus `lint:dup`): 0 issues, 0 clones.
- The working tree was clean after the commit; no tool made changes of its own.

## Invariant check

- A2 and A3 are upheld: the test "keeps every floating resource at or above zero and gives the same result twice" passes.
- No production code changed in this pass.

## Unverified assumptions added

None.

## Out-of-scope findings

None.

## Status

`needs_review`
