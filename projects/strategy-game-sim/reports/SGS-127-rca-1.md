# RCA: "Save a new version" answers 412 in production (2026-11-11)

## Symptom
Owner report: copy a build ("Save as copy"), edit it, "Save a new version" -> `PUT /api/aoe4-build-order/named-builds/<id>` answers 412 `{"error":"the build has changed since that revision"}`. No other writer involved. Every version save of a non-trivial build fails; the feature from #137 is broken for all users.

## Evidence
- Production request log 2026-11-11 19:58Z (dpl_9ebm8ZZ2EGWw3rxZLqSM3cbYs4BC): GET named-builds/7yr4zFK1eyeB4Y021UFaHw 200 at 19:58:24, PUT 412 at 19:58:32 (requestId v6lmf-1794427112655-2031fd344988). The build is still `revision: 1`, never updated.
- Diagnostic preview (branch `debug/named-build-412-diagnostics`, commit c1d337f, deployment dpl_FKWvmXua52h6xPPmKXQiQfFKNGSd), owner repro 21:23Z, requestId 7g27w-1794432216267-8108c6a14e2b:
  - `getNamed etags {"key":"preview/named-builds/hh5xDh9rCnli09zUT_l8uA.json","getEtag":"W/\"824c5bc39a290b8039a19bb3e43dc7f6\"","headEtag":"\"824c5bc39a290b8039a19bb3e43dc7f6\"","same":false,"contentEncoding":"br","contentLength":null,"cache":"MISS"}`
  - `replaceNamed conflict {"ifMatch":"W/\"824c5bc39a290b8039a19bb3e43dc7f6\"","error":"Error","message":"Vercel Blob: Precondition failed: ETag mismatch."}`
  - No `revision mismatch` line: the If-Match revision check passed.

## Cause
- `lib/aoe4-build-order/blob-build-store.ts` `read()` takes the compare-and-swap etag from `get(key, {access:'private', useCache:false})`.
- @vercel/blob 2.9.0 `get()` returns `response.headers.get("etag")` of the CDN delivery response (`node_modules/@vercel/blob/dist/index.js:208`). Node fetch sends `Accept-Encoding: gzip, deflate, br`; the CDN Brotli-compresses the JSON and weakens the etag to `W/"<hash>"`.
- `replaceNamed` passes that weak etag as `put(..., {ifMatch})` (`x-if-match`); the Blob API compares against the strong `"<hash>"` and raises BlobPreconditionFailedError -> 'conflict' -> `changed()` 412 at `lib/aoe4-build-order/named-builds-routes.ts:115`.
- `bumpCounter` (same file) reads its etag the same way; it works today only because the small counter blob is not compressed. Same latent defect.

## Ruled out
- Client revision bookkeeping: If-Match revision equals stored revision (no revision-mismatch log; route line :111 not hit).
- Wrong edit secret: would answer 403 before the revision check.
- Concurrent writer: none; the head etag equals the get etag's hash.

## Repro
Preview of the debug branch above (or any deploy with `BUILDS_STORE_ID`): save a build, Save as copy, edit, Save a new version -> 412. Unit tests cannot reproduce it: they mock `@vercel/blob` or use the memory/file stores.

## Fix direction
- Request the blob uncompressed on every read whose etag feeds an `ifMatch` (getNamed, bumpCounter): `get()` forwards `options.headers`, so `headers: {'accept-encoding': 'identity'}` makes the CDN return the strong etag. Do not take the etag from a separate `head()`: a write between get and head would pair stale content with a fresh etag and lose an update.
- Fail loudly if a weak (`W/`) etag ever reaches a compare-and-swap (throw -> 503 storage-unavailable with a log), rather than a misleading 412.
- Log the two 412 sources distinctly (revision mismatch vs replace conflict).

## Tests that must fail before the fix
- Blob store unit test: `get` mock returns etag `W/"abc"` with `content-encoding: br` -> `replaceNamed`/`bumpCounter` must not send a weak `ifMatch`; and `get` is called with `accept-encoding: identity`.
- Owner/manual check on the PR preview: copy -> edit -> Save a new version succeeds and shows revision 2 (live Blob behaviour the gates cannot exercise).

## Gate that missed it
SGS-120 marked the Blob `ifMatch` behaviour "could not be checked without a live store"; review and acceptance ran only the memory/file stores and mocked `@vercel/blob`, so the CDN etag form was an unverified assumption with no follow-up. Engine issue: NicholasKChoi/code-factory#16.

## Cleanup
Delete branch `debug/named-build-412-diagnostics` (local and origin) once the fix merges; never merge it.
