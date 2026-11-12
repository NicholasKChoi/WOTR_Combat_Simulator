# SGS-130 implementer 3 (Re-spec 1 rework)

- Ticket: SGS-130 (Re-spec 1)
- Branch: `sgs-130-blob-landed-write-retry-cap`
- Tip: `2d7f34e` (on top of 73693ef)
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-130-blob-landed-write-retry-cap`

## Files touched (this commit)
- `lib/aoe4-build-order/blob-build-store.ts`: removed the `landed` call from the `bumpCounter` catch and restored the inline `JSON.stringify(update)`. Added a comment at the catch saying why there is no read-back. Narrowed the `landed` comment ("For build writes only") and the retry-cap comment (dropped "during an outage").
- `lib/aoe4-build-order/build-store.ts`: `replaceNamed` seam comment changed from "never retries" to "never re-reads the etag to try again", because the SDK does retry the HTTP put once.
- `ARCHITECTURE.md`: storage row. The read-back sentence now names the build writes only (`create`, behind `putBuild`/`createNamed`, and `replaceNamed`). Added a separate `bumpCounter` sentence: no read-back, with the reason; a 412 or a created-meanwhile counter starts the next attempt with a fresh read and a new `put`; any other error rethrows; `contended` after the third attempt. The retry-cap sentence is unchanged (it covers `put`/`head`/`del`, and `get` makes a single request). I did not copy Rework 1's superseded sentence.
- `lib/aoe4-build-order/blob-build-store.test.ts`: new `counterBlob` stateful fake; counter tests reworked (listed below).
- `lib/aoe4-build-order/blob-lost-writes.acceptance.test.ts`: changed the first-save counter cases and added a case for a dropped response on a counter update.

## Tests
- Targeted: `blob-build-store.test.ts` and `blob-lost-writes.acceptance.test.ts`, 78 passed, 0 failed.
- `npm test`: 75 files passed, 1 skipped (the live test); 2400 tests passed, 15 skipped, 0 failed.

New and changed tests, with the behavior each one checks:
- `bumpCounter > starts a new attempt after %s even when the stored value is the JSON it sent` (rows: an update rejected with 412, and a create rejected as already existing). It replaces "returns the update after one put for %s when the read-back shows the JSON it sent". After the failed put, the store holds exactly the JSON that was sent. The next attempt does a fresh read and a new put with that read's etag (`etag-2`). The result is the next count, and `get` is called twice: once per attempt, never between the failed put and the next read. (Criterion 5.)
- `bumpCounter > rethrows a network error on an update after one put even when the stored value is the JSON it sent`. It replaces the "network error" row of the old table. One put, one get, and the original error. (Criterion 7.)
- `bumpCounter > gives two parallel bumps over %s different updates, the loser re-reading before its second put` (rows: an existing counter at 4, and an absent counter). It uses `counterBlob`, whose put honors `ifMatch` and `allowOverwrite: false`. Both runs give two different updates (before+1 and before+2), the stored count rises by two, and the event log is exactly `get, get, put N, put N failed, get N, put N+1`. That log shows the loser re-reads before its second put. (Criterion 6, plus the spec-gate note.)
- `bumpCounter > reports contended after three changed etags`: edited (see below).
- Unchanged tests that still cover criterion 7: `retries a create that lost to another writer` (create, key present, next attempt) and `propagates any other put error on %s after one attempt` (update, and create with the key absent).
- `the save rate counter ... > answers 201 on a first save and stores a count at most one above the accepted saves when %s` (retried and dropped). It first checks that the counter is absent. Then it expects 201, one build put, and a stored count of 1 or 2. (Criterion 8.)
- `the save rate counter ... > answers 503 and stores no build when the connection drops after a counter update lands` (new). A first save sets the count to 1. On the second save, the dropped counter update answers 503 with the storage-down body and the logged put error, after one counter put and no build put. (Criterion 8.)
- The 429 contended route test and the 503 outage route test are unchanged and pass.

## Pre-existing tests edited
All are allowed by Scope's rule for existing tests: a test of a changed behavior gets the new expected value, and the counter tests that pin a read-back are named there.
- `blob-build-store.test.ts: bumpCounter > returns the update after one put for %s when the read-back shows the JSON it sent`: replaced by the two tests above. Its expectations pinned the read-back (return the update after one put, 2 gets).
- `blob-build-store.test.ts: bumpCounter > reports contended after three changed etags whose read-backs differ`: renamed to "reports contended after three changed etags". The `get` mock now queues one value per attempt instead of two, and the expected `get` count went from 6 to 3. The expected `ifMatch` list (`etag-1, etag-2, etag-3`) and `contended` are unchanged.
- `blob-build-store.test.ts`: deleted the note "Each failed put is followed by a read-back; these show a counter other writers moved past ours." The test under it (`retries a changed etag with the etag of the new read`) is unchanged.
- `blob-lost-writes.acceptance.test.ts: the save rate counter ... > charges one save, with one counter put, when %s`: renamed and re-expected as described above. The old version pinned count 1 and one counter put, both of which came from the read-back.

## Doc claims
- `ARCHITECTURE.md`: "When the `put` of a build write (`create`, behind `putBuild` and `createNamed`, or `replaceNamed`) throws, the store makes a fresh read of the key and counts the write as done when the stored value, serialized with `JSON.stringify`, is the exact text it sent, ...". Backed by `blob-build-store.ts:create` and `replaceNamed`, which call `landed`, and `landed`, which does `read(key, true)` and a `JSON.stringify` text compare.
- `ARCHITECTURE.md`: "`bumpCounter` makes no such read-back, because parallel saves from one client write identical counter JSON: after a 412, or when the counter it was creating now exists, it starts its next attempt with a fresh read and a new `put`; it rethrows any other error and gives `contended` after its third attempt." Backed by `blob-build-store.ts:bumpCounter` (the catch has no `landed`; `continue` on `BlobPreconditionFailedError` or on `current === null && exists`; otherwise `throw`; `COUNTER_ATTEMPTS = 3`, then `'contended'`). Each loop iteration starts with `read(key, true)`.
- `blob-build-store.ts` retry-cap comment: "@vercel/blob reads VERCEL_BLOB_RETRIES from process.env on every put, head and del call (default 10; get is not retried), and bumpCounter's attempts multiply those retries." The SDK half is the ticket's listed unverified assumption. The multiply half: each of up to 3 attempts can issue a `put` (and a `head`), each retried by the SDK.
- `blob-build-store.ts` `landed` comment: "For build writes only. ..." Backed by the callers of `landed`, which are `create` and `replaceNamed` only.
- `blob-build-store.ts` `bumpCounter` catch comment: "No landed read-back: parallel saves from one client write identical counter JSON, so it would count every losing writer as landed and let them all pass the limit." Backed by `nextCounter`, which gives the same `{windowStart, count}` for the same read. The parallel test fails with `[5, 5]` / `[1, 1]` when the read-back is restored.
- `build-store.ts` `replaceNamed` comment: "Compare-and-swap: writes only when the key exists and its etag is still `etag`; never re-reads the etag to try again." The memory, file and Blob `replaceNamed` make a single compare-and-swap attempt. The Blob read-back compares content only and never feeds its etag into a write.
- I grepped `docs/aoe4-build-order.md` for conflict, retry and limit statements; nothing needed to change. "the stored count never passes the limit" still holds, because `nextCounter` refuses at the limit.

## Pinned outputs
None.

## Mutation checks
Every break below was undone; the final diff contains none of them.
1. In the `bumpCounter` catch (`blob-build-store.ts` ~line 92), re-added `if (await landed(key, JSON.stringify(update))) return update;`. Failures:
   - contended test: "expected to be called 3 times, but got 6".
   - 412 row: got count 2, expected 3.
   - create row: got count 1, expected 2.
   - network-error test: "promise resolved ... instead of rejecting".
   - Both parallel rows: `[5,5]` vs `[5,6]` and `[1,1]` vs `[1,2]`.
   - Route dropped-update test: 201, expected 503.
2. Changed the 412 `continue` to `throw error`. Failures: retries-changed-etag, contended, the 412 row, parallel existing-counter (rejected with ETag mismatch), and the route 429 test (503 vs 429).
3. Changed the created-meanwhile `continue` to `throw error`. Failures: retries-a-create-that-lost, the create row, parallel absent-counter (rejected "already exists"), both first-save route rows (503 vs 201), and the route 429 test.

The first-save route rows (count 1 or 2) do not tell the read-back apart from no read-back, since the criterion allows either count. The unit tests and the dropped-update route test do.

## Gates
- codegen: not set.
- build (`link-node-modules.sh . && npx next build`): pass.
- lint (`npx tsc --noEmit && npm run lint:dup`): exit 0, 0 clones.
- unit (`npm test`): pass (see above).
- `git status` is clean after the commit. Only the 5 files above changed in this commit.

## Invariant check
- Ticket invariants: none. The `BuildStore` signatures, `PutResult`, `ReplaceResult`, `nextCounter`, the counter shape and the route statuses are unchanged.
- Save limit: with no counter read-back, parallel bumps each claim a distinct count, so parallel saves can no longer all pass `SAVE_RATE_LIMIT` on one increment.

## Unverified assumptions added
None. The ticket already lists the "already exists" / 412 SDK-retry behavior that sends `bumpCounter` to its next attempt.

## Out-of-scope findings
None.

## Status
`needs_review`
