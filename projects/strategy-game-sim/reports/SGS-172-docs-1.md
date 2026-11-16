# SGS-172 docs report 1

- Ticket: SGS-172, branch `sgs-172-readme-entry-point`, tip `6a9d9f4a541b35c372373c8c0b26b2f4df417738`
- Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-172-readme-entry-point`
- Status: needs_review

## Docs touched

- `README.md`: rewritten (site purpose, live URL, apps table, Node requirement, npm scripts table, env var table, acceptance env note, links).

## Doc claims (source)

- "A collection of independent apps for strategy games..." : `ARCHITECTURE.md` opening paragraph.
- Apps table pages and docs: `pages/apps/{combat-simulator.js,aoe4-build-order.tsx,starcraft-helper.js}`; `docs/` holds only `combat-simulator.md`, `aoe4-build-order.md` (no split at base), `api/`; StarCraft row says "none", links nothing.
- "Node 24.x": `package.json` `engines.node`.
- Seven scripts (`dev`, `test`, `test:blob-live`, `acceptance`, `acceptance:setup`, `smoke:preview`, `lint:dup`) match `package.json` `scripts` exactly.
- test:blob-live needs: `blob-build-store.live.test.ts` (`process.loadEnvFile('.env.local')` when it exists; throws when `BUILDS_STORE_ID` empty; `describe.skipIf(BLOB_LIVE !== '1')`); script sets `BLOB_LIVE=1`.
- acceptance: `playwright.config.ts` (PORT 3100-3999 from checkout path, `ACCEPTANCE_PORT` override, own `next dev`).
- smoke:preview: `scripts/smoke-preview.mjs` (URL from argv[2], usage exit; saves, reads back, opens page, deletes; `VERCEL_AUTOMATION_BYPASS_SECRET` header; 401/403 without it prints "set VERCEL_AUTOMATION_BYPASS_SECRET").
- lint:dup: `.jscpd.json` and `.jscpd.tests.json` both exist.
- Env vars: `storeFor` and `buildStoreFromEnv` in `lib/aoe4-build-order/build-store.ts` (non-empty `BUILDS_STORE_ID` -> Blob, else file store at `BUILDS_LOCAL_DIR || '.builds-local'`; null storage env throws); `deploymentEnv` and `storageEnv` in `saved-builds.ts` (`VERCEL` without `VERCEL_ENV` -> null; production/preview kept, else development).
- "the builds API routes fail": `ARCHITECTURE.md` says `buildStoreFromEnv` rejects so builds routes answer 503; README says "fail" only.
- Acceptance blanking: `webServerEnv` in `playwright.config.ts`.
- Links: ARCHITECTURE.md, docs/, docs/api/openapi.json all exist (checked with `ls`).

## Removed claims

- Old line "Used to see what the probability of the combat outcomes" replaced by the site-wide description; the old text covered only WOTR.

## CONTEXT.md Design docs rows

None to add or change.

## Checks

- Lint: not run (docs-only; `tsc` and `jscpd` do not read README). Codegen: none configured.
- Link check: all relative links resolve. Grep of `ARCHITECTURE.md`, `docs/`, `.github/` for "readme" found only `docs/aoe4-build-order.md:133`, which points at `data/aoe4-build-order/README.md`, not the root README; no edit needed.
- Only `README.md` changed.

## Out-of-scope findings

- `REPO.md` Tooling gaps says there are no `lint`/`test`/`build` scripts in root `package.json`; `package.json` now has `test` and `lint:dup`. Stale factory note, not a repo doc.
