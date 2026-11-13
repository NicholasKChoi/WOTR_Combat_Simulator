# SGS-142 implementer 1

Status: needs_review

- Ticket: SGS-142 (Bug, lane, standard)
- Branch: sgs-142-replace-named-missing-key-conflict, base origin/main 41b3ed3
- Tip: 7b0aaded80abc5d3321e73e3ea86214661ba1646
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-142-replace-named-missing-key-conflict
- Not pushed.

## Files touched

- `lib/aoe4-build-order/blob-build-store.ts`: new `headNotFound(key)` (true only when `head` rejects with `BlobNotFoundError`); `replaceNamed` returns `conflict` after the landed check and known-error check when it is true, else rethrows the put error. Comment above `replaceNamed` now states the observed behavior.
- `lib/aoe4-build-order/blob-build-store.test.ts`: in `describe('replaceNamed')` the five "any other error" rows (head never called) replaced by one `a plain BlobError` + our JSON stored -> `replaced` row; new table for unrecognized put errors with head absent (BlobError and plain Error) -> `conflict`, head present -> rethrows put error, head fails (plain Error, BlobError) -> rethrows put error (not the head error). Each asserts one `head(NAMED_KEY, { storeId })`.
- `lib/aoe4-build-order/blob-build-store.live.test.ts`: test 1 asserts `error.constructor` is `BlobError` (exact class), keeps the console.log, drops `toBeInstanceOf(Error)`.
- `ARCHITECTURE.md` line 24: sentence on `replaceNamed` edited.

## Tests

- `blob-build-store.test.ts`: 59 pass. Full `npm test`: 2505 passed, 15 skipped, 0 failed (run before a type-only test cleanup; the file was rerun after: 59 pass).
- Invariants encoded: missing key (head absent) -> conflict; key present or head outage -> original put error rethrown; landed read-back still wins (`replaced`); precondition and not-found rows still conflict without calling head.
- No pre-existing test edited except the five replaced "any other error" rows, which the ticket scope names.

## Doc claims

- ARCHITECTURE.md: "`replaceNamed` gives `conflict` for a precondition or not-found error, and for any other put error when `head` reports the key absent (`ifMatch` on a deleted blob raises a plain `BlobError`), and rethrows the put error otherwise." True per `replaceNamed` and `headNotFound` in `blob-build-store.ts`. The read-back sentence is unchanged.
- Comment above `replaceNamed`: "ifMatch on a deleted blob raises a plain BlobError ("The specified key does not exist.") on @vercel/blob 2.9.0, not BlobNotFoundError, so an unrecognized put error conflicts when head finds the key absent. exists() is not used: it reads any head failure as absent, which would turn an outage into a conflict." The observation is the owner's (ticket); the code matches the second half via `headNotFound`. The class claim is checked only by live test 1, not run here.

## Bug regression

- Regression rows: `maps an unrecognized put error when head reports the key absent ...` (two rows).
- Base check: I did not make a detached base worktree. Equivalent break: removing the `headNotFound` line from `replaceNamed` restores base behavior (head not called, plain error rethrown). Result: 5 tests failed (the two absent rows fail on the `conflict` expectation as a rejection; the other three fail on the `head` called-once assertion).

## Mutation checks (all reverted; file diffed identical to the good copy afterward)

1. Drop `if (await headNotFound(key)) return 'conflict'` (`blob-build-store.ts` in `replaceNamed`): 5 failed.
2. `headNotFound` catch returns `true` for any error: 2 failed (the head-failure rows, expected rethrow got `conflict`).
3. `headNotFound` try-path returns `true` (present key treated as absent): 1 failed (the head-present row).
4. Move `headNotFound` before `landed`: 7 failed (landed rows and head-call-count rows).
I saw failure counts, not each assertion text, for mutations 2 to 4; the failing rows match the behavior each break targets.
An earlier mutation pass failed to restore (bad backup path) and stacked breaks; I discarded it, reset the file from git, reapplied the change, and redid the checks above.

## Live test

Not run. `npm run test:blob-live` needs `BUILDS_STORE_ID` and credentials (`.env.local`); the only `.env.local` is in the main checkout, outside my worktree, and I did not copy or read it. The owner needs to run `npm run test:blob-live` with test 1 asserting `BlobError` exactly and test 2 passing. If test 1 fails on class, the observation in the ticket (plain `BlobError`) is wrong, and the ticket's assumption needs revisiting.

## Commands

- Codegen: none set. Build (`npx next build`): passed. Lint (`npx tsc --noEmit && npm run lint:dup`): passed after fixing a type error in my test (the first table no longer has Error expectations). Unit: passed.
- Diff stat vs origin/main: 4 files, +37/-14; no stray files.

## Invariants

A1-A3 not adjacent; upheld. No retry added and no etag from any read feeds a write.

## Unverified assumptions

None added beyond the ticket's two; fakes: `head` mock rejects `BlobNotFoundError`, put mock rejects `new BlobError('The specified key does not exist.')`.

## Out-of-scope findings

- `git worktree add -b` created the branch but failed to create the worktree on the first call (read-only `.git/worktrees` bind mount); a second `git worktree add` for the existing branch worked.
