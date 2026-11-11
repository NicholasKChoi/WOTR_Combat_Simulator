# SGS-120 implementer 2 (Rework 1)

- Ticket: SGS-120 (rework pass for "Rework 1 - 2026-11-10 (review)")
- Branch: `sgs-120-named-routes`, tip `2e22c75` (one commit on top of a12f940, no rebase)
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-120-named-routes`
- Status: **needs_review**

## Files touched

- `lib/aoe4-build-order/blob-build-store.test.ts`: copied `createNamed`/`getNamed` create and read tests folded into two `describe.each` tables (+23/-55).

No production code changed in this pass.

## Required fixes

- [x] Created/exists/rethrow: the old `describe('putBuild')` and the copied `describe('createNamed')` blocks are now one `describe.each([['putBuild', ID, BUILD_KEY], ['createNamed', NAMED_ID, NAMED_KEY]] as const)('%s', ...)` with three cases: created with `{ ...PUT_OPTIONS, allowOverwrite: false }` exactly once on `key`; `'exists'` with `head` called exactly once on `key`; rethrow of the `put` error when `head` rejects.
- [x] Absent-as-null/propagation: the shared cases of `getBuild` and `getNamed` are now one `describe.each([['getBuild', ID], ['getNamed', NAMED_ID]] as const)('%s', ...)` holding the `it.each` null / `BlobNotFoundError` rows and "propagates any other get error". The method-specific cases stay separate: `describe('getBuild')` "parses a present build" (no `useCache`) and `describe('getNamed')` "reads the value and the blob etag without the cache" (`useCache: false`, etag returned).

Ticket boxes ticked in the Rework 1 checklist.

## Tests

- `npx vitest run lib/aoe4-build-order/blob-build-store.test.ts`: 32 passed (was 32 before: the table generates the same number of cases as the copies did).
- `npm test` (full suite): 71 files, 2240 passed, 13 skipped, 0 failed.

Invariants encoded (unchanged from pass 1): both create paths never overwrite and tell `'exists'` from an outage via `head`; both read paths treat null and `BlobNotFoundError` as absent and propagate any other error.

## Pre-existing tests edited

- `blob-build-store.test.ts:putBuild` (3 tests): moved into the `describe.each` table; assertions unchanged in meaning. The created case's options literal is now `{ ...PUT_OPTIONS, allowOverwrite: false }` (same five keys and values); the test title now reads "creates the blob privately, without a suffix, overwrite or ifMatch". Allowed by Rework 1 Required fixes and acceptance criterion "no copied create/read tests ... one `describe.each` over `putBuild` and `createNamed`".
- `blob-build-store.test.ts:getBuild` "reads an absent build as null when %s" and "propagates any other get error": moved into the `describe.each` table (title "reads an absent blob as null when %s"); assertions unchanged. Same rule.

## Doc claims

None added or changed.

## Pinned outputs

None.

## Mutation checks (each undone with `git checkout lib/aoe4-build-order/blob-build-store.ts`; working tree clean before commit)

| Break | Failed |
|---|---|
| `blob-build-store.ts:36` `allowOverwrite: false` -> `true` | `putBuild` and `createNamed` "creates the blob privately..." (toHaveBeenCalledExactlyOnceWith) |
| `blob-build-store.ts:39` removed `if (await exists(key)) return 'exists';` | `putBuild` and `createNamed` "reports exists when put fails..." |
| `blob-build-store.ts:40` `throw error` -> `return 'exists'` | `putBuild` and `createNamed` "rethrows the put error..." |
| `blob-build-store.ts:29` removed the `BlobNotFoundError` -> null branch | `getBuild` and `getNamed` "reads an absent blob as null when get throws BlobNotFoundError" |
| `blob-build-store.ts:26` null result -> `{ value: {}, etag: '' }` | `getBuild` and `getNamed` "... when get returns null" (plus two `bumpCounter` tests) |
| `blob-build-store.ts:30` `throw error` -> `return null` | `getBuild` and `getNamed` "propagates any other get error" |

The review's two named checks (line 36 overwrite flip, line 29 not-found branch) each fail both table rows.

## Build, lint, codegen

- codegen: not set in REPO.md.
- build (`link-node-modules.sh . && npx next build`): passes.
- lint (`npx tsc --noEmit && npm run lint:dup`): tsc clean; jscpd 0 clones across 148 files.
- `git diff --stat origin/main...HEAD`: the same five files as pass 1; no tool-made changes to revert.

## Invariant check

Test-only change; production code identical to a12f940, which review passed on A1-A3 and S3.

## Out-of-scope findings

None new. Review non-blocking notes 1-6 remain as the review listed them.
