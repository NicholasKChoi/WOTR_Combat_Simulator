# SGS-120 implementer report 1

- Ticket: SGS-120 (named-build store methods)
- Branch: `sgs-120-named-routes`, base `origin/main` at 45d0c72 (contains SGS-112 and SGS-119). origin/main has since moved to 156bf30 (split scroll, unrelated files); no rebase done.
- Tip SHA: a12f940d446528c61c19d749389870b760a11a1e (one commit)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-120-named-routes

## Files touched

- `lib/aoe4-build-order/build-store.ts`: exports types `ReplaceResult`, `StoredWithEtag`; four methods on `BuildStore`; unexported `TextByKey` (per-key create/read/readNow/writeNow/remove), `textEtag` (SHA-256 hex) and `buildMethods(env, text)` that maps both saved-build and named-build methods onto the per-key primitives; memory and file stores supply the primitives and keep `bumpCounter` unchanged.
- `lib/aoe4-build-order/blob-build-store.ts`: shared `putOptions` and `create(key, json)` (putBuild / createNamed); `getNamed` via `read(key, true)`; `replaceNamed` (one `put` with `allowOverwrite: true, ifMatch`); `deleteNamed` (try/catch swallowing `BlobNotFoundError`). `deleteBuild` untouched.
- `lib/aoe4-build-order/build-store.test.ts`: new `describe.each(factories)('%s named builds')` (10 cases x memory/file) and one file-layout case.
- `lib/aoe4-build-order/blob-build-store.test.ts`: new `createNamed`, `getNamed`, `replaceNamed`, `deleteNamed` blocks and a new `deleteBuild` row.
- `ARCHITECTURE.md`: AoE4 saved-build storage row names the four methods.

Business logic diff: build-store.ts +109/-35, blob-build-store.ts +38/-14.

## Tests

- `build-store.test.ts` + `blob-build-store.test.ts` + `build-store.acceptance.test.ts`: 102 passed before the comment amend; blob file 32/32 after.
- Full suite `npm test`: 71 files, 2240 passed, 13 skipped, 0 failed.

Invariants encoded: createNamed never overwrites; getNamed absent is null and present returns value + non-empty etag; replace with current etag writes and changes the etag; stale etag conflicts and keeps the first replacement; absent id conflicts and creates nothing; two concurrent replaces with one etag give exactly one winner whose value is stored (no await between compare and write); delete removes and absent delete resolves; named and saved keys are disjoint for the same id; envs share no named build; file layout `<env>/named-builds/<id>.json`. Blob: `get` with `useCache: false` on the named key; `replaceNamed` exact put options, one put, no head/get, precondition and not-found give conflict, other errors propagate; createNamed exists/rethrow paths; deleteNamed swallows only `BlobNotFoundError`; `deleteBuild` still propagates `BlobNotFoundError`.

Pre-existing tests edited: none. Every existing `BuildStore` stub (`builds-routes.test.ts` `withBroken`, `save-rate-limit.test.ts` `storeWith`) spreads `createMemoryBuildStore()`, so they gained the four methods with no edit; `tsc --noEmit` passes. `build-store.acceptance.test.ts` export list unchanged and passing.

## Doc claims

- ARCHITECTURE.md: "Besides the immutable saved builds, every store holds editable named builds under `namedBuildKey` through `createNamed`, `getNamed` (a fresh read with an opaque etag), `replaceNamed` (a compare-and-swap on that etag: a changed etag or an absent build gives `conflict`) and `deleteNamed`." True per `build-store.ts:buildMethods` (memory and file, reads uncached Map/fs) and `blob-build-store.ts` getNamed (`read(..., true)` = `useCache: false`), replaceNamed (ifMatch; precondition/not-found -> conflict).
- build-store.ts header: "Where saved builds, named builds and save-rate counters live. ... each store prefixes them with its own env through savedBuildKey, namedBuildKey and rateCounterKey." True: every key in both files is built by one of those three.
- build-store.ts `BuildStore`: "Always a fresh read, never a cached one." (getNamed) — memory reads the Map, file reads disk, Blob passes `useCache: false`. "Compare-and-swap: writes only when the key exists and its etag is still `etag`; never retries." — `buildMethods.replaceNamed`, Blob `replaceNamed` single put.
- build-store.ts `TextByKey`: "readNow and writeNow are synchronous so replaceNamed has no await between its compare and its write." — `buildMethods.replaceNamed` uses only those two between compare and write.
- blob-build-store.ts replaceNamed: "No retry: one that re-read the blob for its new etag would overwrite the concurrent writer. Which error the SDK raises for ifMatch on a deleted blob is unverified, so not-found also conflicts." — from the ticket's Scope; the code catches both.
- `docs/aoe4-build-order.md` grep for BuildStore/stores/immutable: the remaining statements ("a saved build never changes", immutable GET) are about `?b=` saved builds and stay true; no edit.

## Pinned outputs

None (no engine-returned values pinned).

## Mutation checks

All run by a scratch script that edits the file, runs the test file, and restores the original; `git status` was empty after every run.

| # | break | failing assertion(s) |
|---|-------|----------------------|
| 0 | build-store.ts `createNamed` -> unconditional `writeNow` | memory "creates a named build once and never overwrites it" (`'created'` vs `'exists'`); file variant fails on a missing directory too |
| 1 | `getNamed` etag `''` | "reads the stored value with a non-empty string etag" |
| 2 | `textEtag` hashes `''` | "replaces ... under a new etag" (`not.toBe`) |
| 3 | replaceNamed drops the etag compare | "refuses a stale etag" (`'replaced'` vs `'conflict'`), concurrency test |
| 4 | replaceNamed writes when absent | "answers conflict for an absent id and does not create it" |
| 5 | `readNow` -> `await text.read` | "lets only one of two concurrent replaces ... win" (two `'replaced'`) |
| 6 | replaceNamed skips `writeNow` | "replaces ... new value" |
| 7 | deleteNamed no-op | "deletes a named build ..." |
| 8 | createNamed uses `savedBuildKey` | "keeps named builds and saved builds under separate keys", file layout `named-builds/` |
| 9 | getNamed reads `'preview'` env always | "shares no named build between envs" (and others) |
| 22 | getNamed never returns null | "reads an absent named build as null" |
| 10 | Blob getNamed `fresh` false | "reads the value and the blob etag without the cache" |
| 11 | Blob replaceNamed drops `ifMatch` | "puts once with overwrite and the caller etag as ifMatch" |
| 12 | Blob replaceNamed catch-all conflict | row "any other error" (`rejects.toBe`) |
| 13 | Blob replaceNamed drops `BlobNotFoundError` | row "BlobNotFoundError" |
| 14 | Blob replaceNamed retries put on precondition | row "BlobPreconditionFailedError" (`toHaveBeenCalledOnce`) |
| 15 | Blob replaceNamed calls `head` on conflict | rows precondition / not-found (`head` not called) |
| 16 | Blob deleteNamed rethrows everything | "resolves when del throws BlobNotFoundError" |
| 17 | Blob deleteNamed swallows everything | "propagates any other del error" |
| 18 | Blob deleteBuild swallows `BlobNotFoundError` | "propagates BlobNotFoundError from del" |
| 19 | Blob `create` `allowOverwrite: true` | putBuild and createNamed "without overwrite" cases |
| 20 | Blob createNamed uses `savedBuildKey` | "creates the named blob ...", "reports exists ..." |
| 21 | Blob deleteNamed uses `savedBuildKey` | both "deletes the named key once" rows |

All breaks undone (script restores the original text; tree clean, commit unchanged).

## Codegen, build, lint

- codegen: not set.
- build (`link-node-modules.sh . && npx next build`): passed.
- lint (`npx tsc --noEmit && npm run lint:dup`): passed, jscpd 0 clones.
- `git diff --stat 45d0c72`: only the five files above; no tool-made changes.

## Search criteria

- `@vercel/blob` non-test imports under lib/components/pages: only `blob-build-store.ts`. Holds.
- `ifMatch` non-test matches under `lib`: `blob-build-store.ts` and also `lib/aoe4-build-order/named-builds.ts:79-80`, the `ifMatch` parameter of `parseIfMatchRevision` (HTTP header parsing, merged with SGS-119). That is not a Blob `ifMatch` use, and this ticket did not add it; the criterion as literally worded does not hold because of pre-existing code. Not changed (out of scope); the reviewer or manager should read the criterion as "Blob `ifMatch`" or reword it.

## Invariant check

No INVARIANTS.md entry covers the store (A1 to A3 are engine rules). A3 untouched (no simulation change). No regressions.

## Out-of-scope findings

- The ticket criterion "every non-test `ifMatch` match under `lib` is in `blob-build-store.ts`" collides with `named-builds.ts` `parseIfMatchRevision(ifMatch)` (above).
- Live-store check still owed (ticket's BACKLOG item): what `put` with `ifMatch` and `allowOverwrite: true` does on an absent blob, and whether `del` raises `BlobNotFoundError` at all.
- Worktree setup: `git worktree add -b` created the branch but failed to write upstream config (`.git/config.lock` exists, sandbox); the worktree was then added for the existing branch. A stale `.git/config.lock` sits in the main checkout.

## Status

`needs_review`
