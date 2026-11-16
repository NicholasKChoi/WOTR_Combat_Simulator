# SGS-172: Rewrite README.md as the repo's entry point

- **Type**: Docs
- **Component**: site
- **Milestone**: none
- **Priority**: low
- **Risk**: low
  <!-- CONTEXT.md's Design docs table does not name README.md authoritative for any contract; it only links to the docs that are. -->
- **Invariants**: none
- **Unverified assumptions**: none
- **LOC estimate**: 0 (docs only; `README.md` grows from 4 lines to roughly 60-100 lines of prose and tables)
- **Depends on**: none
- **On merge**: none
- **Source**: BACKLOG.md item "(docs) Rewrite `README.md` as the repo's entry point" (owner docs review in chat, 2026-11-15)

## Context

At `origin/main`, `README.md` is 4 lines: a title, one sentence about the WOTR simulator, and the live URL
(`https://wotr-combat-simulator-gamma.vercel.app/`). The site now holds three apps and several scripts and
environment variables that only `ARCHITECTURE.md`, `package.json`, and the code describe, so a newcomer has no entry point.

## Scope

Rewrite `README.md` only. Each fact below is read from the code at the base; the implementer re-verifies each one
and writes the prose.

- **What the site is**: a collection of independent apps for strategy games, with the live URL kept (it is in the current README). `pages/index.js` and the opening of `ARCHITECTURE.md` state the purpose.
- **Apps**: one row per app with its page path and its design doc.
  - WOTR combat simulator: `/apps/combat-simulator` (`pages/apps/combat-simulator.js`), `docs/combat-simulator.md`.
  - AoE4 build order: `/apps/aoe4-build-order` (`pages/apps/aoe4-build-order.tsx`), `docs/aoe4-build-order.md`.
  - StarCraft helper: `/apps/starcraft-helper` (`pages/apps/starcraft-helper.js`). It has no design doc: `docs/starcraft-helper.md` does not exist (CONTEXT.md lists it as deferred, the app is frozen), so the row says there is none and links no file. Do not link a missing file.
- **Prerequisites**: Node 24.x (`engines.node` in `package.json`), and `npm install`.
- **npm scripts**: every script in `package.json` `scripts`, with what it does and what it needs. Examples of the needs to state, read from the code: `acceptance` starts its own `next dev` on a per-checkout port (`playwright.config.ts`; `ACCEPTANCE_PORT` overrides) and needs `acceptance:setup` (installs Chromium) first; `smoke:preview` takes a preview URL argument and reads `VERCEL_AUTOMATION_BYPASS_SECRET` when the preview is protected (`scripts/smoke-preview.mjs`); `test:blob-live` needs `BLOB_LIVE=1` (the script sets it) and a real `BUILDS_STORE_ID`, loads `.env.local` when it exists (`vercel env pull .env.local`), and throws when `BUILDS_STORE_ID` is empty (`lib/aoe4-build-order/blob-build-store.live.test.ts`); `lint:dup` runs the two jscpd configs. The README lists the scripts present in `package.json` at the time the implementer writes it, which may differ from these examples.
- **Environment variables**: `BUILDS_STORE_ID`, `BUILDS_LOCAL_DIR`, `BLOB_LIVE`, `VERCEL_ENV`, and `VERCEL`, plus `VERCEL_AUTOMATION_BYPASS_SECRET` and `ACCEPTANCE_PORT` if the implementer finds they belong in the same table, each with who reads it and what happens when it is unset. The authoritative behavior is `storeFor` and `buildStoreFromEnv` in `lib/aoe4-build-order/build-store.ts` and `deploymentEnv` in `lib/aoe4-build-order/saved-builds.ts`; the README states the rule briefly and does not copy the storage essay from `ARCHITECTURE.md`. The rules to state: a non-empty `BUILDS_STORE_ID` selects the Blob store, otherwise the file store is used under `BUILDS_LOCAL_DIR` or its default; `VERCEL` set without `VERCEL_ENV` is a configuration error (the store cannot be built, so the build API routes, which pass `process.env.VERCEL` and `VERCEL_ENV` through `deploymentEnv`, fail); `VERCEL_ENV` selects the storage environment. Also state that `npm run acceptance` blanks `BUILDS_STORE_ID`, `VERCEL_ENV`, and `VERCEL` and points `BUILDS_LOCAL_DIR` at `test-results/builds-local` (`playwright.config.ts`), whatever the developer's shell holds.
- **Links**: `ARCHITECTURE.md` (where files go and the rules), `docs/` (the design docs), and `docs/api/openapi.json` (the API spec). Relative links that resolve on GitHub.
- **Design doc names**: re-check at the base which `docs/aoe4-build-order*.md` files exist (another open ticket may split the AoE4 doc) and link all of them in the AoE4 row.
- Keep README statements to behavior and rules: no measured results (timings, counts) and no ticket ids or factory-file pointers.
- Re-grep `ARCHITECTURE.md`, `docs/`, and `.github/` for any sentence that points at the README or says what it holds, and fix any that the rewrite makes untrue (the search at the base found none that the implementer must trust; re-run it).

**Out of scope:** any code change; `ARCHITECTURE.md` and `docs/` edits other than a sentence the rewrite makes untrue; writing `docs/starcraft-helper.md`; splitting `docs/aoe4-build-order.md`; adding or renaming npm scripts.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `README.md` names what the site is and keeps the live URL.
- [ ] `README.md` has an entry for each of the three apps with its page path, and the WOTR and AoE4 entries link their design doc; the StarCraft entry links no doc and says none exists. Every relative link in `README.md` resolves to a file in the repo.
- [ ] `README.md` states the Node version requirement matching `package.json` `engines.node`.
- [ ] Every script in `package.json` `scripts` appears in `README.md` with a description and what it needs; a script whose needs the README states (a Chromium install, a URL argument, a real store id) is checked against the code that reads them.
- [ ] `README.md` documents each of `BUILDS_STORE_ID`, `BUILDS_LOCAL_DIR`, `BLOB_LIVE`, `VERCEL_ENV`, and `VERCEL`: who reads it and what happens when it is unset or empty. A non-empty `BUILDS_STORE_ID` selects the Blob store; otherwise the file store is used, under `BUILDS_LOCAL_DIR` or its default. The live test runs only when `BLOB_LIVE` is exactly `1`. `VERCEL` set without `VERCEL_ENV` is stated as an error. (respec 1)
- [ ] `README.md` states that the acceptance run blanks the store and deployment variables and uses a local builds directory under `test-results/`. (respec 1)
- [ ] The `test:blob-live` entry states its `.env.local` loading and its need for a non-empty `BUILDS_STORE_ID`. (respec 1)
- [ ] `README.md` links `ARCHITECTURE.md`, `docs/`, and `docs/api/openapi.json`; the AoE4 row links every AoE4 design doc file present at the base. (respec 1)
- [ ] No other doc contains a statement the rewrite makes untrue.
- [ ] Only docs change: no file under `lib/`, `components/`, `pages/`, `acceptance/`, `scripts/`, or `package.json` is modified, so existing tests keep their assertions.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-15

- Underspecified: `VERCEL` and its set-without-`VERCEL_ENV` failure, the acceptance run's env blanking, and `.env.local` loading for `test:blob-live`; one criterion quoted a function name.
- Changed: Scope and criteria now cover those, state the store-selection rule as behavior, and tell the implementer to re-check AoE4 design doc names at the base.
- No branch work existed; nothing to keep.

## Rework 1 - 2026-11-15 (review, text)

Review tip 6a9d9f4a541b35c372373c8c0b26b2f4df417738 bounced; no earlier gate beyond spec-gate.

Findings (README.md, both `(text)`):
1. `smoke:preview` row, "What it needs" omits Chromium and the production-delete failure.
2. `docs/` bullet says "one per app", contradicting the Apps table (StarCraft has no design doc) and ignoring `api/`.

Required fixes:
- [x] Replace the `smoke:preview` "What it needs" cell with: "The preview URL as the argument, and Chromium from `npm run acceptance:setup` (the open step launches it). When the preview is protected, set `VERCEL_AUTOMATION_BYPASS_SECRET`; without it a 401 or 403 exits with a request to set it. It fails on a production deployment, where deleting builds is disabled."
- [x] Replace the `docs/` bullet with: "- [docs/](docs/): the design docs for the WOTR combat simulator and the AoE4 build order."
