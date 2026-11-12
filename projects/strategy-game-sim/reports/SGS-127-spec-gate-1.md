# SGS-127 spec gate 1

Verdict: NEEDS_SPEC

Read at origin/main: blob-build-store.ts, named-builds-routes.ts, blob-build-store.test.ts, builds-routes.ts (storageUnavailable), ARCHITECTURE.md, docs/aoe4-build-order.md, @vercel/blob 2.9.0 dist, SGS-130 ticket, TASK-GRAPH.

## Gaps

1. **Unverified assumptions (check 15)** - The ticket has no `Unverified assumptions` field. The fix's happy path rests on behavior the unit mocks can only fake: (a) with `accept-encoding: identity` the Vercel Blob CDN returns the strong etag `"<hash>"`, not `W/"<hash>"`; (b) that strong etag is accepted by the Blob API's `ifMatch` on `put`; (c) `get()` forwards `options.headers` to the delivery fetch (confirmed in SDK 2.9.0 dist/index.js, `...options.headers` spread into the request headers) and Node fetch lets the caller set `accept-encoding`; (d) the delivery etag hash equals the put-side etag. The RCA evidence shows only the `br` case (weak get etag, strong head etag with the same hash), not an identity read. An implementer cannot tell which of these the owner has confirmed. Fix: add `Unverified assumptions:` listing (a)-(d), noting the PR-preview criterion is the only check. Also say what to do if (a) fails on the preview (the weak-etag guard turns it into a 503, so the fix would need a different etag source; name that as the stop condition rather than leaving it implicit).
2. **Weak-etag guard scope (check 2/3)** - Scope says the guard applies "when a read made for a compare-and-swap returns a weak etag" and that `getBuild` "may stay as it is", but `read(key, fresh)` serves `getBuild` (fresh=false) too and the ticket does not say whether the guard and the identity header are conditional on `fresh`, on the caller, or unconditional. Two implementers would differ; an unconditional guard could make `getBuild` (public GET of an immutable build, etag unused) answer 503 on a weak etag, which is a regression. Fix: state the rule, for example "the identity header and the weak-etag throw apply to the reads whose etag feeds `ifMatch` (`getNamed`, `bumpCounter`); `getBuild` neither sends the header nor throws, and a test shows `getBuild` still returns a value when its `get` mock returns a weak etag". Note SGS-130 `landed` calls `read` and expects the throw, so the rule must keep one shared `read` path for CAS reads.

## Checks that passed

- Grounded: `read`, `getNamed`, `bumpCounter`, `replaceNamed`, `updateNamedBuild`, `changed()`, `storageUnavailable` (logs `builds: storage failed`, 503) all exist; the 412 sources at lines 111 and 115 match the ticket. A thrown error from `read` inside `getNamed` and `refusedSaveSlot` is inside the route `try`, so it reaches the 503 path as claimed.
- Existing tests: the `getNamed` and `bumpCounter` `get` expectations (test lines 102, 147) add the new headers option; the `getBuild` expectation (line 81) stays. Scope's rule for existing tests is stated as a rule, which is acceptable.
- Docs: ARCHITECTURE.md row quoted ("a fresh read with an opaque etag") matches the base. `docs/aoe4-build-order.md` has only the revision-ETag statement (line 736), which stays true.
- Invariants: none of S/W/H/A touch the Blob store behavior; "none" is correct. A1-A3 are simulation rules.
- Risk high matches strongModelTriggers (CAS ordering). On merge field format is valid.
- No overlap: SGS-130 builds on this ticket's end state and declares the dependency; nothing removes this code.
- Size ~40 LOC business logic: fine. No input validation, diagrams not required.
- Criteria can fail before the fix: weak-etag test, headers test, and head-not-called test (`head` is mocked, currently not called, so the head criterion is a guard rather than a red-before test; acceptable).

## Notes

- Criterion 6 asks that the two 412 cases "produce different log lines" without quoting text; good. Say the lines must not include the edit secret (only the id) to keep secrets out of logs.
- The weak-etag error should carry the key and the etag form in its message (not the body) so the `builds: storage failed` log is diagnosable; state "the message names the key" as the required content.
- The criterion-1 mock must put the weak etag where `read` reads it (`blob.etag`); the existing `found()` helper takes an etag argument, so reuse it.
