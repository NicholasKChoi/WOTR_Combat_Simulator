# SGS-127 spec gate 2

Verdict: READY

Read at origin/main (after `git fetch origin`): blob-build-store.ts, blob-build-store.test.ts, named-builds-routes.ts, ARCHITECTURE.md storage row, docs grep for etag, BACKLOG.md, TASK-GRAPH rows for SGS-127/128/130, SGS-130 ticket.

## Gate 1 gaps

1. Unverified assumptions: closed. The field is present and lists identity read gives a strong etag, `put({ifMatch})` accepts the strong delivery etag, the hash matches the put-side etag, undici sends a caller-set `accept-encoding`, and the CDN keeps the small counter blob uncompressed. The preview criterion is named as the only check, and Scope has the stop condition (503 plus weak-etag log line means do not merge, back to `needs_spec`).
2. Guard scope: closed. Header and throw are keyed on `read`'s existing `fresh` flag (true for `getNamed` and `bumpCounter`, false for `getBuild`). One shared `read` path is kept for SGS-130's `landed`. A criterion tests `getBuild` with a weak etag still returning its value and sending no headers option.

Gate 1 notes are also folded in: error message names the key and the weak form, never the body; log lines name the id and not the edit secret; the weak etag is placed in `blob.etag` via the existing `found(value, etag)` helper.

## Checks on the new text

- Grounded: `read(key, fresh)`, `found`, `getNamed`, `bumpCounter`, `replaceNamed`, `updateNamedBuild` and its two `changed()` sources (lines 111 and 115), `storageUnavailable` (`builds: storage failed`, 503) all exist. The ARCHITECTURE.md phrase "a fresh read with an opaque etag" matches the base. docs/aoe4-build-order.md only mentions the revision ETag, which stays true.
- Existing-test rule is stated as a rule (fresh-read `get` option expectations change; `getBuild` expectation stays), not a list. The `get` expectations at test lines 102 and 147 and the `getBuild` one at line 81 match the rule.
- Criteria carry no stale numbers; inputs like `W/"abc"` are fine. The head-not-called criterion already holds today (test line 123), so it is a guard, not red-before; accepted, as in gate 1.
- Open questions: none; none decide main-path behavior.
- Invariants none: correct. Contracts: no new names. Dependencies none; SGS-130 builds on this ticket and declares it. SGS-128 does not touch this code, so no throwaway overlap.
- Size ~40 LOC. No diagram trigger. No input validation. Risk high matches the CAS strongModelTriggers.
- On merge: `; `-separated, valid. The BACKLOG bullet (line 56) and the remote branch `debug/named-build-412-diagnostics` both exist.

## Notes (non-blocking)

- The route test for the weak-etag 503 can use a fake store whose `getNamed` rejects; it exercises the existing `storageUnavailable` path, so it only guards that the weak-etag error is not mapped to 412. The real red-before coverage is in the store unit test.
- SGS-128 may move the `found` helper; SGS-130 already accounts for shared helpers, and SGS-127 merges first, so no action.
