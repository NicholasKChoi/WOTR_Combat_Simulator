# SGS-202 review 8 (delta)

- Branch `sgs-202-house-demand-held-order`, tip c25d26efa3738f44bbc01fe80539a6945bfddebf. Delta `eaa9429..c25d26e` against the Rework 1 Required fixes from review 6.
- Verdict: **APPROVE**

## Blocking findings

None.

## Required fixes (review 6, finding 1)

| Fix | Landed | Evidence |
|---|---|---|
| `const countingHeld = simulate(busy).houseStarts[0]`, after `simulate` | yes, verbatim | `simulate-busy-buildings.test.ts:292` |
| Test 3 pins it: `expect(countingHeld).toBeCloseTo(48.383333333, 6)` | yes, verbatim | `:307` |
| Test 1 bounds: `> 2` and `< withHold.result.steps[3].startedAt!` | yes, verbatim | `:296-297` |
| (text) Test 3 renamed to `'... starts its first house at 48.383 s'` | yes, verbatim | `:306`. Kept facts: "counts producers that are not held" and "the same build with no hold". |
| Optional: README line 151 rewrap | yes | wording unchanged, now wraps before `Rules:` |

Nothing else changed in the delta. The only edit outside the fix list is the comment above `countingHeld`, which had to change because the literal is gone: "With the held orders counted, the first house starts where the no-hold build starts it." This is true. Review 6 reproduced the base engine giving the held build its first house at 48.3833, the same as the no-hold build, and test 3 now pins that value.

## Mutations I ran (each undone; `git status` clean afterwards)

- `houses.ts:51`: dropped `+ demand.populationPerSecond * horizon`. Tests 1, 2 and 3 fail. Test 3 fails with `expected undefined to be close to 48.383333333`.
- Test data: man-at-arms time changed from 70 to 40, with the `toMatchObject` line removed so the bound is checked alone. Test 1 fails with `expected 48.38333333333334 to be less than 40`. The upper bound is now tied to the run's own hold window.

## Acceptance criteria

All eight passed in review 6. The delta changes only test code and README wrapping, so no verdict changes. The criterion 1 guard concern (review 6, finding 1) is now resolved: the guard compares an engine-computed start with the run's hold end.

## Invariants touched

A1, A2 and A3 still hold. The delta changes no production code.

## Lint and suite

- `npx tsc --noEmit`: clean.
- `npm run lint:dup`: 0 clones.
- `npm test`: 91 files passed and 1 skipped; 2863 tests passed and 15 skipped; 0 failed.

## Bot reconciliation

`reviewBot.cli` is empty, so the bot did not run.

## Non-blocking notes

- The `docs/aoe4-build-order.md:348` "Each run" forward reference from review 6 is unchanged. It was optional.

## Coverage

- Reviewed: the delta in `lib/aoe4-build-order/simulate-busy-buildings.test.ts` and `lib/aoe4-build-order/README.md`, plus the surrounding describe (`:271-320`) and `houses.ts:49-53`.
- No UI change, so the UI inspection was not run. I did not rerun `next build` (the implementer recorded a pass, and the delta has no production change).
