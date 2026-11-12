# SGS-130 acceptance-test 1

**Verdict: PASS.** 21/21 new tests pass. Every new test failed under at least one production break. Commit `d2b7669` on `sgs-130-blob-landed-write-retry-cap`, on top of fc011d5.

## Harness

The Blob store cannot be reached through the Playwright harness. `next dev` builds the file store unless `BUILDS_STORE_ID` is set, and setting it would hit a real Blob store. The tests therefore use the repo's existing Vitest acceptance layer, `lib/aoe4-build-order/*.acceptance.test.ts`, in the same way as `named-build-store.acceptance.test.ts`:
- `@vercel/blob` is replaced by an in-memory fake.
- The store is built through `buildStoreFromEnv` with a Blob env.
- The real route handlers are driven: `saveBuildReply` (POST builds), `createNamedBuildReply` (POST named-builds) and `namedBuildReply` (PUT named-builds/{id}).

The fake can be told to fail the next put to a key kind in one of these ways:
- **retried**: the write lands, then the SDK's retry hits a 412 or "already exists".
- **dropped**: the write lands, then the connection drops.
- **outage**: nothing is written.
- **deleted**: the key is deleted just before the write.
- **racer**: another client writes first.

It can also make reads after the failure return a weak etag, so the read-back throws.

New file: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-130-blob-landed-write-retry-cap/lib/aoe4-build-order/blob-lost-writes.acceptance.test.ts`

## Tests written (all pass)

| # | Test | Pins |
|---|------|------|
| 1 | env: caps retries when unset | Building the Blob store from the env sets `VERCEL_BLOB_RETRIES` to `String(BLOB_SDK_RETRIES)` (C1) |
| 2 | env: when already set to 4 | A value that is already set is kept (C1) |
| 3 | PUT: response lost, SDK retry answers 412 → 200 | replaceNamed 412 + same JSON stored → replaced. Reply revision 2, stored revision 2 (C2) |
| 4 | PUT: connection drops after the write lands → 200 | Network error + same JSON stored → replaced (C2) |
| 5 | PUT: another edit landed first → 412 | 412 + different JSON → conflict (C2) |
| 6 | PUT: same data in another key order → 412 | Text equality, not deep equality (C7) |
| 7 | PUT: 412 and read-back fails (weak etag) → 412 | The put error decides the outcome when landed throws (C6) |
| 8 | PUT: store down → 503 | Network error with nothing landed rethrows. The logged cause is the put error (C2) |
| 9 | PUT: connection drops and read-back fails → 503 with the put error | The read error is swallowed and the caller sees the put error (C2, C6) |
| 10 | PUT: build deleted between read and write → 412 | BlobNotFoundError → conflict. Exactly one put, with `ifMatch` = the etag the route read. Nothing recreated (C3) |
| 11 | POST builds: SDK retry hits the landed write → 201 | create landed → created (C4 putBuild) |
| 12 | POST builds: other client stored first → 200 | create, other content + head finds → exists (C4) |
| 13 | POST builds: landed but read-back fails → 200 | create falls to the exists check when landed throws (C4, C6) |
| 14 | POST builds: store down → 503 | create, nothing stored + head misses → the original error is rethrown and logged (C4) |
| 15 | POST named-builds: SDK retry hits the landed write → 201 | createNamed landed → created (C4 createNamed) |
| 16 | POST named-builds: other client stored the id first → 500 | createNamed exists (C4) |
| 17 | POST named-builds: store down → 503 | createNamed rethrows the original error (C4) |
| 18 | counter: SDK retry hits the landed counter write | One save charged (`count` 1), exactly one counter put (C5) |
| 19 | counter: connection drops after the counter write lands | Same as 18 (C5) |
| 20 | counter: every attempt loses to a concurrent bump → 429 Retry-After 1 | Exactly 3 counter puts, then `contended`. No build stored (C5) |
| 21 | counter: write fails and nothing landed → 503 | A non-412 error rethrows. No build stored (C5) |

C1 to C7 are the ticket's acceptance criteria in order.

## Runs

- New file: 21/21 passed.
- Existing tests for the touched component, together with the new file: 7 files, 294/294 passed. The files are `blob-build-store.test.ts`, `named-build-store.acceptance.test.ts`, `build-store.acceptance.test.ts`, `build-store.test.ts`, `named-builds-routes.test.ts` and `builds-routes.test.ts`.
- `acceptance:setup` ran, followed by Playwright on the builds and named-builds specs: 76/76 passed. The specs were `aoe4-named-builds-api`, `-api-contract`, `-create`, `-version-saves`, `aoe4-builds-api`, `-refusals` and `-contract`. These use the file store. Playwright started and stopped its own server, and no port is left listening.
- Lint: `tsc --noEmit` is clean, and `npm run lint:dup` finds 0 clones in both configs.

## Mutation checks

A script made each break in `lib/aoe4-build-order/blob-build-store.ts`, ran the new file, then ran `git checkout -- lib/aoe4-build-order/blob-build-store.ts`. After the last break, `git diff --exit-code` on that file was clean. Line numbers are at fc011d5. Every failure was an assertion failure; none was a setup error or a timeout.

| Break | Location | Tests that failed, with the assertion |
|-------|----------|----------------------------------------|
| M1: drop the env cap | `:14` | #1: expected undefined to be '1' |
| M2: always overwrite the env value | `:14` | #2: expected '1' to be '4' |
| M3: `landed` always false | `:52` | #3: 412≠200. #4: 503≠200. #11: 200≠201. #15: 500≠201. #18 and #19: count 2≠1 |
| M4: `landed` always true | `:52` | #5, #6, #7: 200≠412. #8, #9: 200≠503. #10: status 200≠412. #12, #13: 201≠200. #14: 201≠503. #16: 201≠500. #17: 201≠503. #20: 201≠429. #21: 201≠503 |
| M5: deep compare in `landed` | `:53` | #6: 200≠412 |
| M6: `landed` propagates the read error | `:54-56` | #7: 503≠412. #9: console.error not called with the put error. #13: 503≠200 |
| M7: not-found no longer maps to conflict | `:118` | #10: status 503≠412 |
| M8: replaceNamed re-puts with the read-back etag | `:117` | #10: puts length 2≠1. #7 and #9 also fail |
| M9: replaceNamed swallows other errors as conflict | `:119` | #8, #9: 412≠503 |
| M10: bumpCounter skips `landed` | `:93` | #18, #19: count 2≠1 |
| M11: COUNTER_ATTEMPTS 4 | `:7` | #20: puts length 4≠3 |
| M12: bumpCounter swallows a non-412 error | `:96` | #21: 201≠503 |
| M13: create skips `landed` | `:65` | #11: 200≠201. #15: 500≠201 |
| M14: create swallows the error as exists | `:67` | #14: 200≠503. #17: 500≠503 |

## Failures

None.

## Criteria not expressed in this harness

- **C2 with "different or no stored JSON" on a network error**: the "no stored JSON" variant cannot be reached through PUT. The route reads the build before it writes, so the "nothing stored" case is the deleted race, and a network error there would need a combined fault. "Different JSON" is covered by #5 for 412 and by #8, where the old revision stays stored. The unit tests cover the remaining variant.
- **C7, whitespace**: the routes always send `JSON.stringify` output, so JSON sent with whitespace cannot be driven through them. A stored body that differs from the sent text only in whitespace is still counted as landed, because `landed` re-serializes the parsed value. That matches the Scope wording ("a value whose `JSON.stringify` equals `json`") and the ARCHITECTURE text, so it is not a defect. The criterion's wording is looser than Scope, but the unit test covers whitespace in the sent JSON.
- **C8, signatures unchanged**: this is a type and diff property, not boundary behavior. tsc is clean and the existing route tests pass unedited.
- **C9 and C10, the live test**: skipped when `BLOB_LIVE` is unset, fails in `beforeAll` without `BUILDS_STORE_ID`, and writes only `live-check-` keys. Per the launch instruction, the live test file was not run in any mode. The auto-mode classifier also refused a vitest run that only listed the file among others, so it was dropped from the run. These criteria are unverified here.
- **C11, docs**: not boundary behavior.
- **C12**: human-gated, by the owner's live run.
- **C3 "never with an etag read back by landed"**: the deleted case leaves nothing to read back. #10 pins one put with the route's etag, and M8 shows that a re-put fails it.
