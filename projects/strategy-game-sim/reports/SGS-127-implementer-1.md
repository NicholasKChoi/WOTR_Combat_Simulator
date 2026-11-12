# SGS-127 implementer 1

- Ticket: SGS-127 (Read Blob etags uncompressed so named-build version saves stop answering 412)
- Branch: `sgs-127-blob-strong-etag` (base `origin/main` @ cdc51b1)
- Tip SHA: c4d7f3b
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-127-blob-strong-etag
- Status: **needs_review**

Worktree note: `git worktree add -b` created the branch but failed to write its upstream config (`.git/config.lock` already existed in the main checkout, which I left alone), so it did not create the worktree. I then ran `git worktree add` on the existing branch. The branch has no upstream set, which does not matter because the push uses an explicit refspec.

## Files touched

- `lib/aoe4-build-order/blob-build-store.ts`: in `read`, fresh reads send `headers: {'accept-encoding': 'identity'}`. If a fresh read still gets a `W/` etag, it throws an error that names the key and the etag. The etag comes from the same `get` response as the body. Non-fresh reads are unchanged.
- `lib/aoe4-build-order/named-builds-routes.ts`: in `updateNamedBuild`, each 412 source now has its own `console.error` line (`builds: named build revision mismatch` and `builds: named build store etag conflict`). Both lines carry the build id and neither carries the secret. Replies are unchanged.
- `lib/aoe4-build-order/blob-build-store.test.ts`: new tests, plus the two fresh-read option expectations updated (listed below).
- `lib/aoe4-build-order/named-builds-routes.test.ts`: new route tests for the 503 and the two 412 log lines.
- `ARCHITECTURE.md`: one sentence added to the AoE4 saved-build storage row.

## Tests

- Touched files: `blob-build-store.test.ts` (38 tests) and `named-builds-routes.test.ts` (85 tests), all pass. `named-build-store.acceptance.test.ts` (an existing vitest file with a fake Blob service) also passes unchanged.
- Full suite `npm test`: 72 files, 2349 passed, 13 skipped, 0 failed.

New tests and the invariant each one encodes:
- `getBuild > returns the stored value for a weak etag and sends no headers option`: a non-fresh read neither sends the header nor throws.
- `getNamed > takes the strong etag from the get response and makes no head call`: the compare-and-swap etag and the body come from one `get` response, and no `head()` call is made.
- `%s with a compressed response > rejects a weak etag before any put, naming the key but not the body`: runs for `getNamed` and `bumpCounter`. The `get` mock returns `W/"abc"` with `content-encoding: br`. It checks that the call rejects with an Error, that the message contains the key and "weak etag" but not a body marker, and that `put` is never called.
- `a strong etag from get > is the ifMatch of replaceNamed after getNamed`, and `> is the ifMatch of the bumpCounter put`: a strong `"abc"` is passed to `put` unchanged.
- Route: `answers 503, not 412, and logs it when %s rejects a weak etag`, run for `getNamed` and `bumpCounter`. A weak-etag error goes to `storageUnavailable`: the reply is 503, logged once as `builds: storage failed` with the error.
- Route: `answers 412 for a stale revision and for a store conflict, logging each with its own line, the id and no secret`. Both cases reply CHANGED (412), each logs exactly one line, both lines contain the id, neither contains the secret or its hash, and the two first arguments differ.

## Pre-existing tests edited

- `blob-build-store.test.ts: getNamed > reads the value and the blob etag without the cache`: the expected `get` options went from `{access, storeId, useCache: false}` to `FRESH_GET_OPTIONS`, which adds `headers: {'accept-encoding': 'identity'}`. Allowed by the ticket's Scope rule on existing tests: fresh-read `get` option expectations for `getNamed` get the new expected options. This test also covers the acceptance check that `getNamed`'s `get` call carries the identity header.
- `blob-build-store.test.ts: bumpCounter > creates an absent counter without overwrite or ifMatch`: the same change to the expected `get` options, under the same rule for the `bumpCounter` expectation.
- The `getBuild` options expectation (`parses a present build`) is unchanged.
- Existing 412 route tests are unchanged. They now print the new `console.error` lines to stderr, but no assertion changed.

## Doc claims

- `ARCHITECTURE.md` storage row: "its fresh reads (`getNamed` and the counter read) request the blob uncompressed (`accept-encoding: identity`) so the etag is the strong form `ifMatch` compares against, and a fresh read that still gets a weak `W/` etag throws, which the routes answer as 503."
  - The header and the throw are in `blob-build-store.ts` `read` (`fresh ? {useCache:false, headers:{'accept-encoding':'identity'}}` and `if (fresh && etag.startsWith('W/')) throw`). `read(…, true)` is called only by `getNamed` and `bumpCounter`.
  - The 503: every call to `getNamed` (`readStored`) and to `bumpCounter` (`takeSaveSlot` via `refusedSaveSlot`) sits inside a `try` whose `catch` returns `storageUnavailable` (`builds-routes.ts` saveBuild; `named-builds-routes.ts` createNamedBuildReply, updateNamedBuild, namedBuildReply GET). `takeSaveSlot` has no catch.
  - "the strong form `ifMatch` compares against" is the ticket's RCA claim, listed under Unverified assumptions, not something code proves.
- Comment in `blob-build-store.ts` above `read`: "A fresh read's etag feeds put's ifMatch, which compares against the strong etag. The CDN weakens the etag (W/"...") of a compressed response, so a fresh read asks for the body uncompressed. The etag comes from this same response, not a separate head(): a write between the two would pair stale content with a fresh etag and lose that write."
  - The first two sentences repeat the RCA evidence (the CDN behaviour is unverified for identity reads).
  - "this same response" is true of the code: the etag is `result.blob.etag` from the single `get` call.
  - The third sentence is a rejected alternative, which meets the comment bar.
- Weak-etag error message: "Blob read of ${key} returned a weak etag ${etag}, which ifMatch cannot use". It is built from the key and the etag only, and is thrown before the stream is read.
- Log lines: `builds: named build revision mismatch` `{id, ifMatch, stored}` and `builds: named build store etag conflict` `{id, revision}`. Neither has the secret or the hash in scope.
- Grep: `docs/aoe4-build-order.md` and `docs/api/openapi.json` mention ETag only as the HTTP revision ETag, which this change does not affect. The `build-store.ts` seam comment ("writes only when the key exists and its etag is still `etag`") stays true. No other statement about the etag form was found.

## Pinned outputs

None.

## Mutation checks

Each break was undone afterwards. The final diff was re-read, and the full suite passes on the tip.

1. `blob-build-store.ts` read: removed the identity header from the fresh options. Failed: `getNamed > reads the value…` and `bumpCounter > creates an absent counter…` (`toHaveBeenCalledExactlyOnceWith` options). Undone.
2. Same line: applied the header to every read. Failed: `getBuild > parses a present build` and `getBuild > returns the stored value for a weak etag and sends no headers option` (options assertion). Undone.
3. Throw guard: changed `'W/'` to `'X/'`, so the throw never fires. Failed: both `with a compressed response` rows with "expected null to be an instance of Error". Undone.
4. Throw guard: dropped `fresh &&`. Failed: `getBuild > returns the stored value for a weak etag…` because getBuild rejected with the weak-etag error. Undone.
5. Error message: dropped `${key}`. Failed: both compressed rows with "expected '...' to contain 'preview/…'". Undone.
6. Error message: appended the body text. Failed: both compressed rows with "not to contain 'Body-Marker-q7Z'". Undone.
7. read: took the fresh etag from `head(key)`. Failed (on the expected test among others): `getNamed > takes the strong etag from the get response and makes no head call`, where the returned etag differed (head gave `"other"`). The `a strong etag from get` tests and existing counter tests also failed. Undone.
8. `replaceNamed` and `bumpCounter` ifMatch: stripped the quotes (`etag.replaceAll('"','')`). Failed: `a strong etag from get > is the ifMatch of replaceNamed after getNamed` (put args) and `> is the ifMatch of the bumpCounter put` ("expected [ 'abc' ] to strictly equal [ '"abc"' ]"). Each test exercises only its own call site. Undone.
9. `named-builds-routes.ts` updateNamedBuild: removed the revision-mismatch log. Failed: the 412 log test with "expected "error" to be called once, but got 0 times". Undone.
10. Same file: gave the revision-mismatch log the same text as the conflict line. Failed: the 412 log test, `expect(stale).not.toBe(conflict)`. Undone.
11. Same file: added `secret` to the conflict log object. Failed: the 412 log test's no-secret filter ("expected [ Array(1) ] to strictly equal []"). Undone.
12. Same file, updateNamedBuild catch: mapped a "weak etag" error to `changed()`. Failed: both `answers 503, not 412…` rows ("expected { status: 412… } to strictly equal { status: 503… }"). Undone.

## Codegen, build, lint

- codegen: not set in REPO.md.
- build (`link-node-modules.sh . && npx next build`): succeeds.
- lint (`npx tsc --noEmit && npm run lint:dup`): tsc clean; jscpd found 0 clones.
- unit (`npm test`): passes (counts above).
- `git diff --stat origin/main`: only the five files listed above. No lockfile or unrelated changes.
- Preview check (the live acceptance criterion): owner-only, not run here.

## Invariant check

- The A1-A3 rules (AoE4 data, resources, determinism) are not affected because no simulation code changed.
- S3 is not affected.
- The compare-and-swap order is kept: a single `get` supplies both the etag and the body, `replaceNamed` still never retries, and a weak etag never reaches `put`.

## Unverified assumptions added

None. The tests fake `get` returning `W/"abc"` with `content-encoding: br` and `"abc"` as a strong etag. Both stand in for assumptions the ticket already lists: identity reads yield a strong etag, and `put` accepts the strong delivery etag.

## Out-of-scope findings

- `.git/config.lock` exists in the main checkout `/home/choin/git/WOTR_Combat_Simulator/.git/`, either stale or held by another session. It made `git worktree add -b` fail to write upstream config. I did not remove it.

## For the manager

- On merge, per the ticket: delete `debug/named-build-412-diagnostics` locally and on origin. The main checkout currently has that branch checked out, so the local delete needs a different checkout there first. Also delete the BACKLOG bullet.
- Preview stop condition: if the identity read on the preview still returns a weak etag, the version save answers 503 and the log shows "returned a weak etag". In that case do not merge; the ticket goes back to needs_spec.
