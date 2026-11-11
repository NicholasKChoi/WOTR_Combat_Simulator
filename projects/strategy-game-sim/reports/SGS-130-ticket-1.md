# SGS-130 ticket report 1

File: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-130-blob-landed-write-retry-cap.md`
Lint: `ticket-lint.py` printed no errors.

## Summary

Title: "Blob store: cap SDK retries, treat a landed write as success, verify the missing-key rule live". Component aoe4-build-order, Task, risk high (the Blob create and compare-and-swap writes decide whether a save is reported as stored, conflicting or failed), about 60 business-logic lines. Depends on SGS-127 and SGS-128. It was read against the SGS-127 end state, since that is not integrated. SGS-128 had no ticket file when I wrote this, so the helper and gate names come from design C12 and C13.

Scope covers:
- `BLOB_SDK_RETRIES` and the env set only when unset.
- `landed(key, json)` with text equality; any throw gives false and is never propagated.
- Its use in `create`, `replaceNamed` and `bumpCounter`, per the design's Blob store rules table.
- `blob-build-store.live.test.ts` and the `test:blob-live` script, gated by `describe.skipIf(BLOB_LIVE !== '1')`, with credentials from `.env.local` and a failing `beforeAll` when `BUILDS_STORE_ID` is missing.
- The `ARCHITECTURE.md` storage row and the seam comments.
- A rule for existing tests.

Acceptance criteria:
- Env cap set and not overwritten.
- `replaceNamed` outcomes, including `BlobNotFoundError` and `ifMatch` never taken from a read-back.
- `create` and `bumpCounter` cases.
- `landed` throw handling and text-not-deep equality.
- Live test skipped without `BLOB_LIVE`, failing without credentials, and cleaning up its keys.
- Docs.
- A human-gated live criterion for the owner's run (decision 5A).

On merge: delete two BACKLOG bullets (the SDK-retry multiplication and the "verify ifMatch on a missing key" ones). The third BACKLOG bullet, the lost-response one, is mixed with an unrelated memory-store item, so I left it and named it out of scope.

Diagram: one flowchart of the write path (read, act, record).

Verification: I read the SDK source in `node_modules`. `getRetries()` reads `process.env.VERCEL_BLOB_RETRIES` per request, and 5xx errors are retried while other error codes bail. I did not run any command-based criterion, because none names a runnable command beyond `npm test`. That criterion depends on the live test file, which does not exist yet.

## Open questions

none. The design settles the questions the plan raised about the live test's exclusion, `landed`'s comparison and `landed`'s own failure. The owner's live run is a human-gated criterion, not a question.

## Notes for the manager

- Overlap: none with open tickets. SGS-127 edits `read`; this ticket builds on it.
- Weak-etag interaction: SGS-127's `read` throws on a weak etag, and `landed` reads through it. The ticket requires `landed` to keep the uncompressed request so a compressed read does not make it false. A throw still gives false, as the design says.
- The `replaceNamed` "unverified" comment can only be rewritten after the owner's live run. The ticket allows a follow-up commit on the same PR (per the plan's spec gap).
- The ticket says SGS-128 gates new tests. The graph row for SGS-130 was not added, as instructed.
