# SGS-151 implementer report 1

Status: needs_review

- Ticket: SGS-151. Branch: `sgs-151-shared-blob-test-fake`. Tip: `b2aaf346027457458832ca3f1818d454de416bf4` (one commit on base f55e0aa). Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-151-shared-blob-test-fake`.
- (`git diff origin/main` now shows ARCHITECTURE.md and docs/ too because origin/main moved after the base; against f55e0aa the diff is the 5 files below.)

## Files touched
- `lib/aoe4-build-order/blob-fake-test-helpers.ts` (new): `installBlobFake(mocks, errors, {cdn})` installs the write rules onto the given `vi.fn`s; `blobFake()` returns the installed fake. No `@vercel/blob` import (type-only `vitest` import); SDK error classes are passed in.
- `lib/aoe4-build-order/blob-fake-test-helpers.test.ts` (new): the fake's own tests.
- `lib/aoe4-build-order/blob-build-store.test.ts`: `counterBlob` rebuilt on the shared fake (event log stays here).
- `lib/aoe4-build-order/blob-lost-writes.acceptance.test.ts`: the mock factory delegates to the shared fake; fault injection layered through `fake.aroundPut`.
- `lib/aoe4-build-order/named-build-store.acceptance.test.ts`: the mock factory delegates to the shared fake with `{ cdn: true }`.

## API
Fields/methods on the fake: `weakReads`, `headFailure`, `beforeRead` (returns promise or undefined; get awaits only if a promise), `aroundPut(key, body, options, write)`, `lastPutError`, accessors `body/etag/has`, `write` (rules), `store` (fresh etag, no rules), `seed(key, body, etag)`, `remove`, `reset()` (keeps `aroundPut`). Etags are `"e<n>"`; weak reads prefix `W/`. get and put each have one await (get adds one only when `beforeRead` returns a promise).

## Tests
- Full `npm test`: 82 files passed, 1 skipped; 2525 passed, 15 skipped. `npx tsc --noEmit` clean; `npm run lint:dup` 0 clones; `npx next build` succeeded. No codegen configured.
- New `blob-fake-test-helpers.test.ts`: 13 tests (create-over-existing refused unless allowOverwrite, body kept; ifMatch on absent -> BlobNotFoundError; stale ifMatch -> BlobPreconditionFailedError, body unchanged; etags pin `"e1"`, `"e2"`; lastPutError; weak reads; explicit-etag seeding; head/del absent; headFailure; beforeRead hold; aroundPut; reset keeps aroundPut; CDN serves first body/etag unless `useCache: false`).
- Existing assertions untouched: only fake setup and state access (`blobs.get(...)` -> `fake.body/etag/has`, `blobState.*` -> `fake.*`) changed.

## Pre-existing tests edited
- `blob-lost-writes.acceptance.test.ts` and `named-build-store.acceptance.test.ts`: setup and state-access lines only; no assertion or expected value changed (the `/^"e\d+"$/` assertion passes unchanged).
- `blob-build-store.test.ts`: only the `counterBlob` helper; the parallel-bump test's expected events unchanged.

## Doc claims (comments added)
- `blob-fake-test-helpers.ts` top: "must not import the SDK (the vi.mock factory that installs it runs while the SDK is being imported), so the factory passes the SDK's error classes in." True: only `import type { Mock } from 'vitest'`; error classes come via the `errors` argument.
- `cdn` option: "Serves the first body and etag seen for a key to every get, unless the caller passes useCache: false." True: `get` implementation.
- `weakReads`: "Gets return the etag prefixed `W/`..." True: `get` implementation.
- `beforeRead`: "Returning a promise holds the get until it settles; returning undefined adds no await." True: `if (hold !== undefined) await hold`.
- `aroundPut`: "Replaces the plain write of every put; call write() for the real write rules." True.
- `reset`: "Empties the store and clears everything but aroundPut." True: `reset` body (also zeroes the etag count and CDN copies).
- `store`/`seed`/`write` one-line comments match their bodies.
- Test-file comment in `blob-build-store.test.ts`: "A counter blob seeded at etag "e0" on the shared fake; events logs each get and put by count." True: `counterBlob`.

## Mutation checks (all undone; helper file restored, git status clean of mutations)
In `blob-fake-test-helpers.ts`:
- create rule `if (existing && !allowOverwrite)` -> `if (false)`: failed "refuses a create over an existing key unless allowOverwrite, and keeps the body".
- first `throw new errors.BlobNotFoundError()` (write) -> PreconditionFailed: failed "raises BlobNotFoundError for ifMatch on an absent key".
- `existing.etag !== ifMatch` -> `===`: failed "raises BlobPreconditionFailedError for a stale ifMatch..." and the seeding test; with `-> false` also failed the parallel-bump test in blob-build-store.test.ts.
- etag `"e${writes}"` -> `e${writes}`: failed the etag-form test (plus others).
- `options?.useCache !== false` -> `true`: failed "serves the first body and etag unless..." and the three named-store tests that read the latest value.
- `W/` prefix dropped: failed the weak-read test and lost-writes read-back-failure tests.
- head failure line removed: failed "fails head with headFailure" and the lost-writes head test.
- `lastPutError` assignment removed: failed "records the last put error" and the lost-writes 503 tests.
- Extra `await null` in put, and in get after the read: NOT caught by the parallel-bump test (it still passes: the two parallel bumps stay symmetric). The single-await rule is held by construction, not by a test failing; flagging this as an unpinned guarantee.

## Deviations / notes
- Criterion 2 (factory delegates in each of three files): in `blob-build-store.test.ts` the `vi.mock` factory stays bare `vi.fn()`s, because `beforeEach` does `mockReset` and every test sets its own `mockResolvedValue`; `counterBlob` installs the shared fake into those mocks for the one test that needs it. No file keeps its own blob map or write-rule logic. Say so if review wants the factory call there too.
- The two acceptance files fetch the installed fake with `blobFake()` (module-level singleton in the helper) because the hoisted factory has no other way to hand it to the test body.
- `named-build-store.acceptance.test.ts` etag form changed from `etag-N` to `"e<n>"`; no assertion pinned it.
- The lost-writes `get` hook used to `await` unconditionally; it now awaits only when `beforeRead` returns a promise. Tests pass.

## Invariants
A1-A3 matched by path only; test-only change, production untouched (diff: 3 test files edited, 2 test-support files added; no production file).

## Unverified assumptions added
None. The fake's get shape (statusCode, stream, headers, blob.etag) and error classes match what `blob-build-store.ts` reads, as before.

## Out-of-scope findings
None.
