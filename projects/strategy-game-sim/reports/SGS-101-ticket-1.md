# SGS-101 ticket author report 1

File: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-101-build-store-and-rate-limit.md`

Summary: Add `build-store.ts` (BuildStore seam, memory and file stores, `buildStoreFromEnv`), `blob-build-store.ts` (the only `@vercel/blob` importer), and `save-rate-limit.ts` (fixed window 30/hour per client). Component aoe4-build-order, ~280 logic lines, risk high, depends on SGS-099, criteria M6.4 (rate limit) and M6.6. Covers dependency add, zod override, `.gitignore`, ARCHITECTURE.md, shared store behavior table, Blob mock tests, `takeSaveSlot` 30/31 and Retry-After boundaries. Diagram: one Mermaid flowchart of the module paths. No overlap with other tickets found.

## Shared symbols defined
- `build-store.ts`: `PutResult`, `CounterUpdate`, `BuildStore` (`putBuild`, `getBuild`, `deleteBuild`, `bumpCounter`), `BUILDS_LOCAL_DIR_DEFAULT`, `createMemoryBuildStore(env = 'development')`, `createFileBuildStore(dir, env)`, `buildStoreFromEnv(env = process.env)`.
- `blob-build-store.ts`: `createBlobBuildStore(storeId, env)`.
- `save-rate-limit.ts`: `SAVE_RATE_LIMIT`, `clientKey(req)`, `takeSaveSlot(store, clientKey, nowMs)`.
- Uses from SGS-099 (unchanged): `savedBuildKey`, `rateCounterKey`, `storageEnv`.

## Test injection for the route ticket
Route functions take `store: () => Promise<BuildStore>`. Tests pass `() => Promise.resolve(createMemoryBuildStore())` (rejecting function for the 503 row) with a fixed `nowMs`; production passes `buildStoreFromEnv`.

## Decisions and findings
- Hash helper: `clientKey` keeps a private SHA-256 to base64url helper in `save-rate-limit.ts`. SGS-099 does not export its helper, so `saved-builds.ts` stays untouched. Fallback to a shared export only if `lint:dup` flags it.
- Verified in a scratch worktree: the design's `"overrides": { "zod": "^4.6.6" }` fails with `EOVERRIDE` because `package.json` has the direct dependency `"zod": "^4.6.7"`. `"zod": "$zod"` works; `npm install --package-lock-only` succeeds and `npm audit` reports 0 vulnerabilities (`@vercel/blob` resolved to 2.9.0). The ticket specifies `$zod`.
- `buildStoreFromEnv` memoizes only the no-argument call so tests with an explicit env stay independent.
- `getBuild` handles both a `null` result and `BlobNotFoundError`; the implementer records the installed SDK option names (`ifMatch`, `useCache`, etag shape) since I could not run them offline.
- File store: rejects keys resolving outside its dir; `bumpCounter` atomicity left to the implementer with a concurrency test.

## Open questions (all `designer`, non-blocking)
1. zod override: `$zod` instead of `^4.6.6` (above). Confirm.
2. File store `bumpCounter` atomicity mechanism, and whether a plain read-modify-write would do for dev.
3. Narrowing "memoized per module instance" to the no-argument call.

No owner questions. Scratch worktree removed.
