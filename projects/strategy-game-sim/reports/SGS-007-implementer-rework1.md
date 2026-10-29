# SGS-007 implementer, rework 1

Status: **needs_review**

- Ticket: SGS-007 (Vitest unit runner), Rework 1
- Branch: sgs-007-unit-test-runner
- Tip: e2ce61d (new commit on top of 67ba9d8; history not rewritten). Base origin/main d54af2e.
- Worktree: /home/choin/git/WOTR_Combat_Simulator-factory/worktrees/sgs-007-unit-test-runner
- Author: Nick Choi <choinickolas@gmail.com>. Not pushed, no PR.

## Files touched (this commit)

- `utils/utils.test.ts`: duplicates test and no-mutation test now use the unsorted input `[3, 1, 4, 1, 5, 9, 2, 6]`; the no-mutation test compares against a literal; the multiset comparison uses a numeric comparator.
- `package-lock.json`: line 2 top-level `"name"` restored to `"WOTR_Combat_Simulator"`. `packages[""]` has no `name` field (same as base), so nothing else changed.

## Required fixes

- [x] Unsorted inputs, input asserted unchanged after the call. Both sort-in-place mutations re-applied to `utils/utils.ts` and verified failing, then restored.
- [x] Lockfile name restored; `npm ci` rc=0, `lockfileVersion` 2.

## Commands run (all observed)

- `npm ci`: rc=0 (run twice, after the lockfile edit).
- `npm test` (`vitest run` v1.6.1): 1 file, 4 tests passed, rc=0.
- Temporary mutations of `utils/utils.ts` (each reverted with `git checkout`), `npx vitest run` rc:
  - `const clone = [...array.sort()]`: rc=1
  - `array.sort(); return clone;`: rc=1
  - `return clone.slice(1)` (drop): rc=1
  - `return [...clone.slice(1), clone[1]]` (drop + duplicate): rc=1
  - `const clone = array` (shuffle in place): rc=1
- After restoring: `git diff --quiet d54af2e -- utils/utils.ts` clean (byte-identical to base); `npm test` rc=0.
- `npx tsc --noEmit`: rc=0 (this is also REPO.md lint).
- `npx next build`: rc=0, route table unchanged.
- Codegen: none configured.

## Invariants

S1, S2, S3, H3 upheld: no app code changed; `utils/utils.ts` byte-identical to base; test makes no randomness/order assertion.

## Notes

- The no-mutation test against an in-place shuffle has a ~1/20160 chance of passing by luck (random permutation equal to the input); acceptable for a smoke test, no stubbing per ticket.
- Playwright `--list` criterion still not runnable (SGS-002 not merged).
- Writes to the factory worktree required running outside the sandbox (read-only filesystem otherwise).

## Out-of-scope findings

None.
