# SGS-093 review-2 (delta, Rework 1)

Verdict: APPROVE
Tip reviewed: 26eebf9e2942894622c1232ba60d744fa5d428cb on origin/main fcfbaf1 (merge-base = fcfbaf1).
Delta: `git range-diff b9481e3..561b667 fcfbaf1..26eebf9`, previously approved tips 6e7ebd3 (review-1) and 561b667 (acceptance-1).

## Blocking findings
None.

## Range-diff
- b2ddc5f (was 6e7ebd3): identical except it no longer carries the old hunk in `lib/aoe4-build-order/simulate-house-warnings.test.ts` (old pin `affa5ac15c88b132`). That conflict was resolved by keeping main's version.
- 6f999ef (was 561b667): identical.
- 26eebf9 (new): one line in `lib/aoe4-build-order/simulate-house-warnings.test.ts:168`, `'1cead3b6a8f33aa3'` -> `'95876b5e98214174'`. Main's SGS-092 structure is unchanged: field-set test title, `42b0afc54e5e8bf8` (ENG 1TC) and `082d524201cfafbd` (King's Palace) pins, and the `held` tuple.
- For the other 7 changed files, the +/- lines of `git diff fcfbaf1 26eebf9` match `git diff b9481e3 561b667` exactly, compared by sha1 per file. The same 8 files appear in both stats. No SGS-092 change on main is reverted, because a diff based on fcfbaf1 touches only these files.

## Digest verification
- On the branch tip, `simulate-house-warnings.test.ts` passes with `95876b5e98214174` (24/24).
- Mutation: with `data/aoe4-build-order/builds/english-spear-longbow-maa-crossbow.json` restored to fcfbaf1's version, the test fails with Expected `95876b5e98214174`, Received `1cead3b6a8f33aa3`. So the new pin is main's field-set hash of this branch's rebuilt spear build, and it differs from main's pin only because of the rally-step removal.
- The ENG 1TC and King's Palace pins still hold unchanged.

## Checks run (review worktree, tip 26eebf9)
- `npx tsc --noEmit`: clean.
- `npm run lint:dup`: exit 0.
- `npm test`: 46 files, 1361 passed / 10 skipped.
- Not run by me: the Playwright acceptance specs. The implementer reports 92 passed across the contract, spear-longbow-build, prebuilt-plans and house-lead-time specs. The acceptance-test gate should confirm this.

## Acceptance criteria
- Original ACs: unchanged by the rework. They stay ticked from review-1, and the range-diff shows no content change.
- Rework 1, rebase + conflict resolution: pass (ticked).
- Rework 1, re-pin others + checks: unit tests, tsc and lint:dup verified. No other pin needed changing. Left unticked because I did not run the acceptance specs myself.

## Invariants
The delta is a test pin only, so no invariant is touched.

## Bot reconciliation
`reviewBot.cli` is empty, so no bot ran.

## Non-blocking notes
- `simulate-house-warnings.test.ts:167` keeps main's comment "Re-pinned for the house lead-time rule ...". The spear pin now also reflects the rally-step removal. The comment is main's text and still true for the lead-time part, so no change is required.

## Coverage
Reviewed the full range-diff, commit 26eebf9, and the per-file equivalence of the other 7 files. Ran unit tests, tsc and lint:dup, plus one mutation run.
