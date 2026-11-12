# SGS-127 acceptance-test 1

Verdict: PASS (2 tests written, both pass; commit 335f6a3 on sgs-127-blob-strong-etag, from tip c4d7f3b).

## Harness limit
The Playwright harness forces `BUILDS_STORE_ID=''` (playwright.config.ts), so it runs the file store and cannot reach the Blob store. The fix itself (identity read, weak-etag throw, same-response etag, no head) is only reachable by the implementer's unit tests with a mocked `@vercel/blob`. Not expressible in this harness: the weak-etag 503 against a real Blob store, and the live-Blob preview check (owner's, needs credentials). I wrote tests for the HTTP compare-and-swap contract that the fix must keep working.

## Tests written (acceptance/aoe4-named-builds-version-saves.spec.ts)
- successive version saves each succeed and a reload shows the latest content at its revision: create, then PUT with If-Match "1", "2", "3" gives 200 and ETag "2", "3", "4"; GET after each shows that revision and name. Pins repeat saves (the ticket's version-save flow) through the real route.
- two saves from the same revision: one wins with 200 and the other gets 412, and the winner is kept: concurrent PUTs with If-Match "1"; statuses are [200, 412]; GET shows revision 2 and the winner's name. Pins the compare-and-swap outcome and the unchanged 412 reply.

## Run
`npx playwright test` on the new spec plus aoe4-named-builds-api.spec.ts: 15 passed (harness ran, Chromium installed, next dev started by Playwright). tsc and lint:dup clean.

## Mutation checks (all undone; `git diff --exit-code lib` clean)
- Chain test: build-store.ts:83 `!==` to `===` in file-store replaceNamed. Failed at spec line 32 (status expected 200, received 412). Undone.
- Race test: named-builds-routes.ts revision check disabled (`if (false)`) and build-store.ts:83 compare replaced with a null check only. Failed at spec line 50 (statuses expected [200, 412], received [200, 200]). Undone. (A first attempt with a precedence error produced 412/412; it failed on the same assertion for the wrong reason and was redone.)

## Failures
None. No impl-defects or spec-gaps found.

## Notes
The two 412 log lines were observed in the dev server output during the run (`builds: named build revision mismatch`), consistent with the ticket.
