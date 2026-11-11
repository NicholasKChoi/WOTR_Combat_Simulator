# SGS-127: Read Blob etags uncompressed so named-build version saves stop answering 412

- **Type**: Bug
- **Component**: aoe4-build-order
- **Milestone / criteria**: M9 / none yet (M9 is not written into MILESTONES.md)
- **Priority**: blocker
- **Risk**: high
  <!-- strongModelTriggers: changes shared mutable state and the order of operations a result depends on: the Blob compare-and-swap (read etag, then put with ifMatch) decides whether a concurrent writer's version is kept or overwritten. No criticalPaths symbol applies. -->
- **Invariants**: none
- **LOC estimate**: ~40 (blob-build-store.ts: read headers option plus a weak-etag guard; named-builds-routes.ts: two distinct log lines; business logic only, tests excluded)
- **Depends on**: none
- **On merge**: delete remote branch `debug/named-build-412-diagnostics` (local and origin; it was never to be merged); BACKLOG.md: delete the bullet beginning `AoE4 "Save a new version" fails in production`
- **Source**: `reports/SGS-127-rca-1.md` (owner RCA with production and preview evidence); BACKLOG.md bullet on the production 412, which this ticket supersedes

## Context

In production "Save a new version" on a named build answers 412 `the build has changed since that revision` for every non-trivial build, although no other writer exists. The Blob store takes its compare-and-swap etag from `get()`, which returns the CDN delivery response's etag; the CDN Brotli-compresses the JSON and weakens it to `W/"<hash>"`, while the Blob API's `ifMatch` compares against the strong `"<hash>"`, so every replace reports `conflict`. Root cause, evidence and ruled-out alternatives are established by the RCA and are taken as given here.

### Cause (from the RCA)

- `lib/aoe4-build-order/blob-build-store.ts` `read()` takes the etag from `get(key, {access:'private', useCache:false})`.
- @vercel/blob 2.9.0 `get()` returns the delivery response's `etag` header. Node fetch sends `Accept-Encoding: gzip, deflate, br`; the CDN compresses and weakens the etag to `W/"<hash>"`.
- `replaceNamed` passes that weak etag as `put(..., {ifMatch})`; the Blob API compares against the strong form and raises `BlobPreconditionFailedError`, mapped to `conflict`, then to the 412 at the `store.replaceNamed` call in `named-builds-routes.ts` `updateNamedBuild`.
- `bumpCounter` reads its etag the same way; it works today only because the small counter blob is not compressed. Same latent defect.

### Evidence (from the RCA)

- Production request log 2026-11-11 19:58Z: GET named build 200, then PUT 412; the build stayed at revision 1.
- Diagnostic preview (branch `debug/named-build-412-diagnostics`): `get` etag `W/"824c5bc3..."` with `contentEncoding: br`, `head` etag the same hash strong-quoted; `replaceNamed` failed with "Vercel Blob: Precondition failed: ETag mismatch."; no `revision mismatch` line, so the If-Match revision check passed.

### Ruled out (from the RCA)

- Client revision bookkeeping (If-Match revision equals the stored revision).
- Wrong edit secret (would answer 403 before the revision check).
- Concurrent writer (head etag equals the get etag's hash).

## Scope

- `lib/aoe4-build-order/blob-build-store.ts` `read` (used by `getNamed` and `bumpCounter`, the reads whose etag feeds `ifMatch`): request the blob uncompressed by passing `headers: {'accept-encoding': 'identity'}` through `get()` options, so the CDN returns the strong etag. Read the etag and the body from the same `get` response; do not take the etag from a separate `head()` (a write between the two calls would pair stale content with a fresh etag and lose an update). `getBuild`, whose etag is unused, may stay as it is.
- Same function: when a read made for a compare-and-swap returns a weak etag (`W/` prefix), throw an error instead of returning it. The error reaches the routes' existing storage-unavailable path (503, logged) rather than a misleading 412; `bumpCounter` surfaces it the same way through the save-slot check.
- `lib/aoe4-build-order/named-builds-routes.ts` `updateNamedBuild`: log the two 412 sources distinctly, the If-Match revision not matching the stored revision, and `replaceNamed` returning `conflict`. Follow the existing `console.error('builds: ...')` line style in that file. Replies are unchanged.
- Tests: `lib/aoe4-build-order/blob-build-store.test.ts` (mocks `@vercel/blob`) and the routes test for the log lines.
- Docs: `ARCHITECTURE.md` AoE4 saved-build storage row describes `getNamed` as "a fresh read with an opaque etag"; add that the Blob store reads uncompressed so the etag is strong and rejects a weak one. Grep `docs/aoe4-build-order.md` and comments at the seam for statements about etag form that this makes untrue.
- Existing tests: a test of the changed `get` call options gets the new expected options; any other test keeps its expected value. The implementer lists every test it edits.
- Cleanup (`On merge`): the branch `debug/named-build-412-diagnostics` is never merged; delete it from local and origin after this fix merges.

**Out of scope:** an integration test against a real Blob store (unit gates cannot reach one; the preview check below covers it; the process gap is engine issue NicholasKChoi/code-factory#16); retry of a conditional `put` after a lost response (separate BACKLOG item); changes to `memory`/`file` stores; any change to reply bodies or statuses.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] A Blob store unit test whose `get` mock returns etag `W/"abc"` with `content-encoding: br` fails before the fix and passes after: `getNamed` and `bumpCounter` reject, and `put` is never called with a weak `ifMatch` (a test fails if a `W/` etag reaches `put`).
- [ ] A Blob store unit test asserts the `get` call made by `getNamed` and by `bumpCounter` carries `accept-encoding: identity` in its headers option; it fails before the fix.
- [ ] A strong etag from `get` is passed unchanged as `ifMatch` by `replaceNamed` and `bumpCounter`; a test covers both.
- [ ] The etag and body used for a compare-and-swap come from the same `get` response; no `head()` call is made on the compare-and-swap path (a test fails if `head` is called by `getNamed`).
- [ ] A route test shows a weak-etag failure from the store answers the existing storage-unavailable reply (503), not 412, and is logged.
- [ ] A route test for each 412 source (If-Match revision differs from stored; `replaceNamed` returns `conflict`) asserts the reply is still 412 and that the two cases produce different log lines.
- [ ] Docs naming the etag form (`ARCHITECTURE.md` storage row and any other doc or seam comment found by grep) match the new behavior.
- [ ] Live-infrastructure behaviour the unit gates cannot exercise (owner verifies on the PR preview deployment, which has `BUILDS_STORE_ID`): save a build, Save as copy, edit the copy, Save a new version; it succeeds and the panel shows revision 2, and a reload shows the edited content at revision 2.
- [ ] No INVARIANTS.md regressions

## Open questions

none
