# M6 designer report 1

**Verdict:** design written, and owner approval is pending.

**Design:** /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/design/M6.md

The design was read against origin/main 9274372, the Next 16.4.3 Pages Router docs in
`node_modules/next/dist/docs/` and the `@vercel/blob` 2.8.2 package source.

## Contracts fixed (names only)

- **C1** (`lib/aoe4-build-order/saved-builds.ts`):
  - shapes: `SAVED_BUILD_VERSION`, `savedBuildSchema`, `SavedBuild`, `SaveBuildRequest`, `SaveBuildResponse {id, path}`
  - id and keys: `SAVED_BUILD_ID_PATTERN`, `isSavedBuildId`, `savedBuildId`, `storageEnv`, `savedBuildKey`, `savedBuildPath`
  - save checks: `SAVED_BUILD_MAX_BYTES`, `SAVED_NAME_MAX_CHARS`, `checkSaveBuildRequest`
- **C2** (`lib/aoe4-build-order/build-store.ts`, `blob-build-store.ts`):
  - interface: `BuildStore`, with `putBuild`, `getBuild`, `deleteBuild` and `bumpCounter`
  - result types: `PutResult`, `CounterUpdate`
  - constructors: `createMemoryBuildStore`, `createFileBuildStore`, `createBlobBuildStore`
  - selection: `BUILDS_LOCAL_DIR_DEFAULT`, `buildStoreFromEnv`
  - env keys: `BUILDS_STORE_ID`, `BUILDS_LOCAL_DIR`, `VERCEL_ENV`
- **C3** `POST /api/aoe4-build-order/builds`: the response status table, `BuildsError`, and the reused `SimulateError`.
- **C4** `GET` and `DELETE /api/aoe4-build-order/builds/{id}`.
- **C5** (`lib/aoe4-build-order/save-rate-limit.ts`): `SAVE_RATE_LIMIT` (30 per hour), `clientKey`, `takeSaveSlot`.
- **C6** (page):
  - auto-run: `useAutoRun`, `AUTO_RUN_DEBOUNCE_MS` (500), `AutoRunStatus`
  - layout: `WORKBENCH_SPLIT_QUERY`, `useSplitLayout`
  - components and helpers: `SaveBuild`, `loadSavedBuild`, `savedBuildOption`
  - new test ids: `auto-run-status`, `results-last-good`, `duration-error`, `simulation-retry`, `save-build`, `saved-build-link`, `copy-saved-link`, `save-build-error`, `saved-build-error`
  - removed test ids: `run-simulation`, `results-stale`
- **Script:** `smoke:preview`, implemented in `scripts/smoke-preview.mjs`.

## Key decisions

- **Id.** The first 11 characters of the base64url SHA-256 of the canonical record JSON. The id is
  content-addressed and immutable, and a repeat save returns 200 with the same id.
- **Save checks, in order:**
  1. schema
  2. duration
  3. name ≤ 100 characters
  4. 64 KiB record cap (413)
  5. paste round trip
  6. rate limit
  7. store
- **Rate limit.** A fixed one-hour window counter per hashed client IP, kept in the same Blob store
  and updated with `ifMatch` compare-and-swap. It works on serverless because instances share no
  memory and the store is shared state that every instance can reach.
- **Auto-run.** It acts on the settled input and steps through five fire rules in order: invalid,
  in flight, already shown, already rejected, then send. Late responses are dropped by `seq`. A 400
  keeps the last good result, dimmed.
- **Layout and load.**
  - The page splits at 1200 px or wider, and the inner timeline split moves to 1800 px.
  - `?b=` disables the controls while it loads, then adds a `<name> (<id>)` option and runs.
- **Smoke.** It sends the `x-vercel-protection-bypass` header from `VERCEL_AUTOMATION_BYPASS_SECRET`
  and uses Playwright Chromium for the page step.

## Extension points

- A versioned saved record, which can later add raw text or more inputs.
- `BuildStore` as the seam for other backends or a listing.
- A single call site for `takeSaveSlot`, so a WAF rule can be added in front.
- The per-app saved-builds module and the key segment.

## Owner decisions (recommendation in bold)

- **OD-1.** **Store the parsed order only, so comments are lost.** The alternative is to store the raw text too.
- **OD-2.** **DELETE on preview and development only, 405 in production.** The alternatives are no DELETE, or a DELETE behind a secret.
- **OD-3.** **Reach the protected preview with the Protection Bypass for Automation secret, exported in the shell.** The alternatives are `vercel curl` or turning protection off.
- **OD-4.** **A Blob counter at 30 saves per hour.** The alternatives are a WAF rule only, or both.
- **OD-5.** **Drop `b` from the URL on the first settled edit.** The alternative is to keep it until the next save.
- **OD-6.** **On narrow screens, keep the Build tab selected; only a `?b=` load selects Results.** The alternative is to select Results on the first result.

## Risks

- **Saving an existing build.** The SDK error class for "blob already exists" could not be verified
  offline. The adapter handles it by calling `head()` after any `put` error. Verify it on the
  preview smoke.
- **Credentials.** Blob credentials in functions rely on the project's OIDC token. If OIDC is not
  enabled for the project, the adapter fails with 503.
- **Blob operations.** Each save costs about 3 Blob operations (counter get, counter put, build put).
- **`next dev` module instances.** The two routes may not share memory under `next dev`, which is
  why the local stand-in is file-based.
- **Acceptance rewrite.** About 40 Run usages across 15 specs must move to the new helpers, which
  is a large diff.
- **Fractional numbers.** A build containing fractional numbers is rejected by the save round-trip
  check, even though the simulate route accepts it.
- **jscpd.** The two builds routes share method and error handling with `simulate.ts`, so the
  duplication check may flag them. Factor shared response helpers into one place if it does.
- **Layout flash.** The split layout is decided by JavaScript after mount, so the static page first
  paints stacked and then switches.
