# SGS-119 review 2

- Branch `sgs-119-named-build-shapes`, tip `33b9fbbfb22c9f9026b4e42fb5e5c34249122e45`, base `main`.
- Mode: delta, against tip `f2b60d55d28e753a078bbb6741531ad305c8bfbb`. That tip was bounced by review 1 with a test-only fix, so this review checks only that the Required fix landed verbatim and that the change touches nothing else.
- Verdict: **APPROVE**

## Blocking findings

None.

## Required fix check (Rework 1)

- [x] The row `['the first is a prefix of the second', 'abcde', 'abcdef', false]` was added to the `sameSecretHash` table, word for word, at `lib/aoe4-build-order/named-builds.test.ts:104`. The existing `'different lengths'` row is kept.
- `git diff f2b60d5..33b9fbb` is that one added line in one commit. `f2b60d5` is an ancestor of the new tip, and no other file or line changed.
- Mutation check, run by me in the review worktree: I deleted `if (a.length !== b.length) return false;` at `named-builds.ts:38`. The new row then failed with "expected true to be false" at test:107, and the other 51 tests passed. After I restored the guard, all 52 tests pass.
- Commit `33b9fbb`: the author is `choinickolas@gmail.com`, as Vercel requires. The message has no ticket id, no PR number and no factory pointers.

## Spec gaps

None.

## Acceptance criteria

The delta re-checks only the criterion that failed in review 1. The others pass as recorded in `reports/SGS-119-review-1.md`, and the delta does not touch them.

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 4 | `editSecretHash` and `sameSecretHash` rows (equal, one char different, different lengths, empty) | pass | The different-lengths case now includes the prefix row, which fails when the length guard is removed (mutation above). |
| 1-3, 5-11 | (unchanged) | pass | review 1. The delta touches no production code. |

## Invariants touched

None by the delta: one test row was added. A3, S1 and S3 still hold as recorded in review 1.

## Linter

`npx tsc --noEmit && npm run lint:dup` passes in the review worktree, with 0 clones.

## Review bot

`reviewBot.cli` and `rulesFile` are empty, so there was nothing to reconcile.

## Non-blocking notes

The notes from review 1 still apply. The delta does not change any of them.

## Coverage

- Reviewed: the delta diff `f2b60d5..33b9fbb`, the ticket's Rework 1 section, the implementer 2 report and the review 1 report.
- Ran: vitest on `named-builds.test.ts`, with and without the mutation, plus tsc and jscpd.
- Not run: `npx next build`. The change is test-only.
- No UI changed, so the UI inspection did not run.
- REPO.md Review checklist: "Every diff" does not apply, because no page changed. In "AoE4 build order", nothing in the delta was copied and no doc changed.
- Review worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/review2-sgs-119`. Its removal may hit EBUSY under the sandbox; if so, it is deferred cleanup.
