# SGS-142 acceptance-test 1

Verdict: PASS (all tests green, mutation checks done, no defects found).

Harness: vitest, `lib/aoe4-build-order/blob-lost-writes.acceptance.test.ts`. It drives `namedBuildReply` (the PUT route handler) with `@vercel/blob` faked (put, get, head). Playwright was not used: the repo's Playwright suite runs against the file store, not Blob, so a Blob fault cannot be injected there. No `.env.local` read, no `test:blob-live` run.

## Tests written (commit on sgs-142-replace-named-missing-key-conflict)
Fake extended with a `deletedPlain` fault (key deleted, put raises plain `BlobError("The specified key does not exist.")`) and a `headFailure` switch.
1. `answers 412 and recreates nothing when head finds the key absent`: plain-BlobError put on a deleted key gives the 412 "changed" reply, one put, key not recreated. Also asserts the put error is not a `BlobNotFoundError`, so the test does not pass via the old path.
2. `answers 503 with the put error when head fails for a reason other than not-found`: the same put error with a head outage gives 503, and the logged error is the put error, not the head error.

Already covered by existing rows in this file (run, pass): put outage with key present gives 503 (present key rethrows); landed writes give 200; BlobNotFoundError delete gives 412; 412 on other edit.

## Results
- Ran blob-lost-writes.acceptance, named-build-store.acceptance, blob-build-store unit: 3 files, 99 tests passed.
- `npx tsc --noEmit` and `lint:dup`: clean (0 clones).
- Commit SHA: see git log tip on the branch (printed after commit; test file only).

## Mutation checks
- Removed `if (await headNotFound(key)) return 'conflict';` (`lib/aoe4-build-order/blob-build-store.ts:130`): test 1 failed on `expected { status: 503 } to match { status: 412 }`. Undone with `git checkout`.
- Changed `headNotFound` catch to `return true` (`blob-build-store.ts:~32`): test 2 failed on `expected { status: 412 } to match { status: 503 }`. Undone; `git status` shows only the new test file.

## Not expressible
- Live behavior (that the real store raises a plain BlobError and live test 2 passes): requires the owner's credentials; left to `npm run test:blob-live`.
- The unit-level criteria (head-present rethrow, landed returns replaced) are the implementer's unit tests; the present-key path is exercised at the route by the existing outage row.
