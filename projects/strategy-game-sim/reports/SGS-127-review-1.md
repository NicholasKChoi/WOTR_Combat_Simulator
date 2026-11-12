# SGS-127 review 1

- Branch: `sgs-127-blob-strong-etag`, tip c4d7f3b, base `main` @ cdc51b1 (one commit). Full review.
- Verdict: **APPROVE**

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | Weak etag `W/"abc"` + `content-encoding: br` makes `getNamed` and `bumpCounter` reject, no weak `ifMatch` reaches `put`; fails before the fix | pass | `blob-build-store.test.ts` `%s with a compressed response > rejects a weak etag before any put...` (both rows). I put back `main`'s `blob-build-store.ts` and `named-builds-routes.ts` and reran: both rows fail (getNamed resolved; bumpCounter called `put` with the weak ifMatch and resolved). `expect(put).not.toHaveBeenCalled()` catches a `W/` reaching `put`. |
| 2 | Error message names the key, says the etag was weak, and has no body | pass | `blob-build-store.ts:36` builds the message from `key` and `etag` only, and throws before the stream is read. The same test asserts `toContain(key)`, `toContain('weak etag')`, and `not.toContain('Body-Marker-q7Z')`. |
| 3 | `get` from `getNamed` and `bumpCounter` carries `accept-encoding: identity`; fails before the fix | pass | `getNamed > reads the value...` and `bumpCounter > creates an absent counter...` now expect `FRESH_GET_OPTIONS`. Both fail on base code (confirmed). |
| 4 | `getBuild` unaffected: weak etag still returns the value, no headers option | pass | `getBuild > returns the stored value for a weak etag and sends no headers option`. Strict equality on the options object fails if `headers` is added. Calling `getBuild` with a weak etag would reject if the throw dropped the `fresh` guard. |
| 5 | Strong etag passed unchanged as `ifMatch` by `replaceNamed` and `bumpCounter` | pass | `a strong etag from get > is the ifMatch of replaceNamed after getNamed` and `> is the ifMatch of the bumpCounter put`. Each asserts the exact `"abc"` in the put options. |
| 6 | Etag and body from the same `get`; no `head()` on the CAS path | pass | `blob-build-store.ts:35-37` takes both from one `result`. `getNamed > takes the strong etag from the get response and makes no head call` has `head` return `"other"` and asserts the returned etag and `head` not called. |
| 7 | Route: a weak-etag failure answers 503, not 412, and is logged | pass | `named-builds-routes.test.ts` `answers 503, not 412, and logs it when %s rejects a weak etag` (getNamed and bumpCounter rows) asserts `STORAGE_DOWN` and exactly one `builds: storage failed` log with the error. Traced: `getNamed` (via `readStored`) and `bumpCounter` (via `refusedSaveSlot` -> `takeSaveSlot`, no catch) both run inside the `try` at `named-builds-routes.ts:104-129`, and the `catch` returns `storageUnavailable`. |
| 8 | Route: each 412 source keeps 412, logs a different line, and neither line has the secret | pass | `answers 412 for a stale revision and for a store conflict...` asserts `CHANGED`, one log call, the id present, no secret or secret hash (`loggedStrings`), and different first arguments. Fails on base code (no log; confirmed). |
| 9 | Docs naming the etag form match | pass | The `ARCHITECTURE.md` storage row checks out against the code (Doc claims below). I grepped `docs/aoe4-build-order.md`: its only ETag mention (line 736) is the HTTP revision ETag, which this change leaves alone. The `build-store.ts:35` seam comment is still true. |
| 10 | Owner preview check (live Blob) | unverified | Owner-only on the PR preview. It needs `BUILDS_STORE_ID` and live CDN behaviour, which the agents do not have. Stop condition: a version save that answers 503 with `returned a weak etag` in the log. |
| 11 | No INVARIANTS.md regressions | pass | See Invariants. |

## Invariants touched

The diff touches `lib/aoe4-build-order/**`, so A1-A3 are in scope.
- A1 (game numbers from data files): holds. No simulation code changed.
- A2 (resources never go negative): holds. No spend logic changed.
- A3 (deterministic timings): holds. No simulation path changed, and the new `Date` use is pre-existing route code.
- Site-wide S1-S3: these paths are not touched. No new numeric input.

## spec-checklist

- Contracts: no route, field, or operation name changed. Replies are unchanged, so `docs/api/openapi.json` needs no change.
- Scope: no `golang/` change, and nothing from Out of scope (memory/file stores, `landed`, retries, reply changes) is implemented.
- Naming: no new enums. `FRESH_GET_OPTIONS`, `WEAK_ETAG` and `STRONG_ETAG` state intent.
- A1-A3: as above.

## Doc claims checked

- `ARCHITECTURE.md` storage row: "fresh reads (`getNamed` and the counter read) request the blob uncompressed (`accept-encoding: identity`)". Matches `blob-build-store.ts:32`. `read(..., true)` is called only at lines 67 (`bumpCounter`) and 86 (`getNamed`).
- "a fresh read that still gets a weak `W/` etag throws, which the routes answer as 503". Matches `:36`. Every caller sits in a `try` that ends in `storageUnavailable`: `saveBuildReply` (builds-routes.ts), `createNamedBuildReply`, `updateNamedBuild`, and the named GET.
- "so the etag is the strong form `ifMatch` compares against": an RCA claim that the ticket lists under Unverified assumptions. Criterion 10 is what verifies it.
- The code comment at `blob-build-store.ts:23-26` matches the code. The etag is `result.blob.etag` from the single `get`, and no `head` is called.
- SDK side: in @vercel/blob 2.9.0, `dist/index.js:141-145` spreads `options.headers` last into the delivery request headers, and `useCache: false` adds `?cache=0`. So the header reaches the request.

## Linter, build, tests

- `npx tsc --noEmit`: clean. `npm run lint:dup` (jscpd): 0 clones.
- `npx next build`: succeeds.
- `npm test`: 72 files, 2349 passed, 13 skipped.
- Fail-first check: with `main`'s two production files on top of the branch tests, 5 tests fail: the 2 updated option expectations, the 2 compressed-response rows, and the 412 log test. Restored afterwards; the worktree is clean.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so there are no bot findings.

## Conventions

- Log lines follow the `console.error('builds: <what>', <detail>)` shape of `named-builds-routes.ts:62,76` and `builds-routes.ts:12`.
- Tests reuse the existing helpers `found`, `counterPuts`, `PUT_OPTIONS`, `silenceErrors`, `withBroken`, `created`, `put` and `loggedStrings`. They use `describe.each` / `it.each` for the per-method rows, which matches the file's style (4-space indent, no semicolons).
- The error is a plain `Error`, as elsewhere in this module. There is no shared helper the diff reimplements.

## Non-blocking notes

1. `blob-build-store.ts:36`: on the weak-etag throw, `result.stream` is never read or cancelled. Undici then holds the response body (and its socket) until GC. This only happens on the failure path, so the impact is small. `await result.stream.cancel()` before the throw would release it.
2. `named-builds-routes.test.ts:389` and `:397`: the existing 412 tests now write the new `console.error` lines to stderr because they do not call `silenceErrors()`. That is noise only; nearby tests that log do silence.
3. `named-builds-routes.test.ts` 503 rows build the weak-etag `Error` with a copy of the store's message text. The route does not inspect the message, so the test stays correct, but the copied string can drift from `blob-build-store.ts:36` without anything failing.
4. Blast radius worth knowing for the preview check: the named-build GET also uses `getNamed`, and every save uses `bumpCounter`. If the identity read still returns a weak etag in production, loading a named build and every save (including plain "Save") answer 503, not just "Save a new version". The ticket's preview steps (save, reload) exercise both paths, so the stop condition catches this.
5. `ARCHITECTURE.md` storage row: the inserted clause ends with a full stop. The next sentence, "`buildStoreFromEnv` loads it through a dynamic `import()`", now has "it" pointing back past the new sentence, so the antecedent (`blob-build-store.ts`) is less clear. Optional wording: "`buildStoreFromEnv` loads `blob-build-store.ts` through a dynamic `import()`".

## Coverage

- Reviewed: all 5 changed files in full context: `lib/aoe4-build-order/blob-build-store.ts`, `named-builds-routes.ts`, `blob-build-store.test.ts`, `named-builds-routes.test.ts`, and `ARCHITECTURE.md`. Read for tracing: `builds-routes.ts`, `save-rate-limit.ts`, `build-store.ts`, and @vercel/blob 2.9.0 `get`. Also read `docs/aoe4-build-order.md` (grep) and `design/M9.md` (Blob rows).
- UI inspection: not run. The diff changes no UI.
- REPO.md "Every diff" step to load each touched page with `npm run dev`: not done. No page changed, and locally the file store is used, so the Blob path cannot be exercised; criterion 10 covers that. The AoE4 checklist's UI and layout items do not apply. Its copy-helper rule found nothing: no helper or constant was copied.
- LESSONS.md: its one entry is scoped to `acceptance/**`, which the diff does not touch.
- LSP: not used. `read` is module-private and has two call sites in the file. `getNamed` and `bumpCounter` callers were traced by grep through the routes.
