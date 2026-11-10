# SGS-101 acceptance-test, pass 1

Verdict: PASS. Branch tip: 380e77861a19ad98892f56a2b2280e7ae341592b (was 513283a).

## Harness
The ticket adds library modules only. The Playwright harness (`acceptance/`) has no entry point for them (no route or page yet), so none was invented. The repo's lib-level `*.acceptance.test.ts` Vitest convention was used instead, and the criteria that need a real boundary are pinned through the real file store.

`npm ci` ran with 0 vulnerabilities. `npm test` passed (52 files, 1635 passed, 10 skipped, `git status` clean afterwards). `tsc --noEmit` and `lint:dup` pass.

## Tests written
File: `lib/aoe4-build-order/build-store.acceptance.test.ts` (5 tests, all pass)
- `build-store` exports exactly `BUILDS_LOCAL_DIR_DEFAULT`, `buildStoreFromEnv`, `createFileBuildStore`, `createMemoryBuildStore`.
- `save-rate-limit` exports exactly `SAVE_RATE_LIMIT`, `clientKey`, `takeSaveSlot`.
- End to end: `buildStoreFromEnv` (explicit env, real file store, a fresh store per call) with `clientKey` and `takeSaveSlot`. Calls 1 to 30 are ok, call 31 is refused with `retryAfterSeconds` 1800 at half a window, a second client has its own budget, and the next window is ok again.
- A saved build persists across env-built store instances. A second put returns `'exists'` and the first value survives. Delete then get returns null. The files land under `<dir>/preview/`.
- An unknown `VERCEL_ENV` (`staging`) maps to the `development` namespace and shares nothing with `preview`.

## Mutation checks (each failed, then undone with `git checkout`, `git diff --exit-code` clean)
- `<=` changed to `<` in `takeSaveSlot`: the 30-saves test failed.
- `flag: 'wx'` changed to `'w'` in the file `putBuild`: the persist/exists test failed.
- `storageEnv(...)` replaced by a raw `VERCEL_ENV` read: the staging-namespace test failed.
- Added extra exports (`WINDOW_MS`, `nextCounter`): both surface tests failed.

## Criteria coverage
The implementer's tests (`build-store.test.ts`, `blob-build-store.test.ts`, `save-rate-limit.test.ts`) cover the shared store table, the Blob adapter table, the `takeSaveSlot` table and the `clientKey` table. They pass and I did not duplicate them.

Dependencies criterion (checked by hand):
- `package.json` has `@vercel/blob` `^2.8.2` and `overrides` `"zod": "$zod"`.
- The lockfile has a single `node_modules/zod` entry.
- `.gitignore` has `.builds-local/`.
- `npm ci` succeeded and `npm test` left the tree clean.
- `npm audit` for zod was not run separately. `npm ci` reported "found 0 vulnerabilities". The PR body still needs that output recorded.

## Not expressible
- The Blob adapter against the real Vercel Blob SDK. There is no network or store, so only the mocked adapter tests exist (the implementer's).
- Cross-process file-store behavior, which the ticket accepts as non-atomic.

## Failures
None.
