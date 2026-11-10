# SGS-100 implementer 2 (rework 1)

- Ticket: SGS-100 auto-run controller, rework pass 1 (review 1 Required fixes)
- Branch: sgs-100-auto-run-controller
- Tip: f07e3dce807637f9f17c9a51ca7182447968e842 (previous 77f1a6c)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-100-auto-run-controller
- Base: origin/main 1e6d6c2

## Files touched

- `components/apps/aoe4-build-order/auto-run.test.ts`: added the `withFailure()` helper (a first request answered 500 leaves the controller `failed`), imported the `AutoRunController` type, and replaced `dispose > ignores every later call` with the 4-row `it.each` `dispose > ignores a later %s`.

Production code is unchanged.

## Required fixes

- [x] Table rows: `input` and `flush` start from `withResult()`, `release` from `setup(live(), true)` (held), and `retry` from `withFailure()`. Each row records the POST count, `getState()` and `history.length`, disposes, makes the call, advances `AUTO_RUN_DEBOUNCE_MS`, then asserts that all three are unchanged (`toBe` for the state reference).
- [x] Mutations confirmed (see below).

## Tests

- `npx vitest run components/apps/aoe4-build-order/auto-run.test.ts`: 74 passed. That is 71 minus the 1 test that was removed, plus the 4 new rows.
- `npm test` (full suite): 50 files, 1598 passed, 10 skipped, 0 failed.
- Invariant encoded: after `dispose()`, no public call posts, changes state, or notifies, even from a state where that call would otherwise post.

## Mutation checks

Each break was made in `auto-run.ts`, run, then reverted with `git checkout`. The tree was clean before the commit.

- Removed `disposed ||` from `release`: only `dispose > ignores a later release` failed (1 failed, 73 passed).
- Removed `disposed ||` from `retry`: only `dispose > ignores a later retry` failed.
- Removed `if (disposed) return` from `input`: only `dispose > ignores a later input` failed.
- Removed `if (disposed) return` from `flush`: only `dispose > ignores a later flush` failed.

## Pre-existing tests edited

- `auto-run.test.ts:dispose > ignores every later call` was replaced by the table, as the Rework 1 Required fixes call for. This test was added on this branch and is not on main.

## Doc claims

None added or changed.

## Pinned outputs

None.

## Stages

- Codegen: not set.
- Build (`npm ci && npx next build`): passed.
- Lint (`npx tsc --noEmit && npm run lint:dup`): 0 errors, 0 clones.
- `git diff --stat 1e6d6c2` shows only the 5 files from the first pass. There are no tool side-effect files.

## Invariant check

No production change, so no invariant was affected.

## Out-of-scope findings

None.

## Status

needs_review
