# SGS-120 acceptance-test 1

Verdict: PASS. Commit 3311fa4 on `sgs-120-named-routes` (on top of 2e22c75). All tests pass.

Harness: the ticket has no HTTP surface (routes come in SGS-121), so the Playwright harness does not apply. The existing `build-store.acceptance.test.ts` pattern is Vitest against `buildStoreFromEnv`, so I used that boundary. New file: `lib/aoe4-build-order/named-build-store.acceptance.test.ts`. It runs the env-built file store (`BUILDS_LOCAL_DIR`) and the env-built Blob store (`BUILDS_STORE_ID`) with a fake `@vercel/blob` that models etags, `ifMatch`, `allowOverwrite: false`, and a CDN cache that serves a stale body unless `useCache: false`.

Run: `npx vitest run` on the new file plus `build-store*` and `blob-build-store*`: 4 files, 119 tests, all passed. `npx tsc --noEmit && npm run lint:dup`: clean, 0 clones.

## Tests written (17 cases, each run for file and Blob unless noted)

- create once, second create gives `exists`, first value readable with a non-empty string etag; absent `getNamed` is null.
- replace with the current etag gives `replaced`; the next `getNamed` has the new value and a different etag. On Blob it also fails if the read is served from the stale cache.
- stale etag gives `conflict` and keeps the first replacement.
- replace on an absent id gives `conflict` and creates nothing.
- two concurrent `replaceNamed` with one etag give one `replaced` and one `conflict`, and the stored value is the winner's.
- `deleteNamed` removes the build; deleting an absent one resolves.
- same id for `putBuild` and `createNamed` creates both, each reads back its own value, and deleting the named one leaves the saved one.
- Blob: `deleteBuild` rejects with `BlobNotFoundError` on an absent blob while `deleteNamed` resolves; a wrong etag gives `conflict`.
- file: the named build is at `<env>/named-builds/<id>.json`, and a second env sees none.

## Mutation checks (each undone with `git checkout --`; `git status` clean afterwards)

| Break | Failing assertion |
|---|---|
| `build-store.ts` `replaceNamed`: drop the etag compare | stale-etag: expected 'replaced' to be 'conflict'; concurrent: got ['replaced','replaced'] |
| `build-store.ts` `replaceNamed`: `readNow` replaced by `await text.read` | concurrent: got ['replaced','replaced'] |
| `build-store.ts` `replaceNamed`: absent key returns 'replaced' | absent: expected 'replaced' to be 'conflict' |
| `build-store.ts` `textEtag` returns a constant | new etag not 'fixed'; stale-etag and concurrent conflict assertions |
| `build-store.ts` `createNamed` uses `savedBuildKey` | key separation: expected 'exists' to be 'created'; create/replace tests fail |
| `blob-build-store.ts` `getNamed` read with `fresh=false` | expected {v:1} to equal {v:2} (stale CDN) |
| `blob-build-store.ts` `replaceNamed`: drop `ifMatch` | stale-etag, absent and concurrent: 'replaced' instead of 'conflict' |
| `blob-build-store.ts` `deleteNamed`: stop swallowing not-found | promise rejected instead of resolving |
| `blob-build-store.ts` `deleteBuild`: swallow errors | expected rejection, promise resolved |
| `blob-build-store.ts` `createNamed` uses `allowOverwrite: true` | expected 'created' to be 'exists' |
| `blob-build-store.ts` `replaceNamed`: not-found no longer maps to conflict | the absent-id test failed on a thrown error (`BlobNotFoundError`), not an assertion. The behavior is pinned, but by an exception. |
| `build-store.ts` `replaceNamed`: absent key falls through to write | the absent-id test failed on ENOENT from the write, not the named assertion. The 'replaced' break above covers the assertion path. |

## Failures

None.

## Not covered by this file

- Memory store is not reachable from `buildStoreFromEnv`; its named cases remain the implementer's `build-store.test.ts` `describe.each`.
- Exact Blob `put`/`get` option shapes, one-`put` and no-`head`/`get` rules, and the export-list and grep criteria are pinned by the implementer's unit tests, the existing `build-store.acceptance.test.ts` and ticket grep checks. I did not duplicate them.
- The fake models `ifMatch` on an absent blob as `BlobNotFoundError`. The live behavior is unchecked and is the ticket's BACKLOG item.
- No Playwright run: the ticket has no browser or HTTP surface.
