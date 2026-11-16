# SGS-172 review 1

Verdict: REQUEST CHANGES
Branch sgs-172-readme-entry-point, tip 6a9d9f4a541b35c372373c8c0b26b2f4df417738. Type Docs: only README.md changes (verified with `git diff origin/main...HEAD --name-only`).

## Blocking findings

1. `README.md` (npm scripts table, `smoke:preview` row) - contract (text) - "What it needs" lists only the URL and the bypass secret, but the script opens the AoE4 page in Chromium (`scripts/smoke-preview.mjs`, `launch()`/`open()`); without a Playwright Chromium the `open` step fails with "could not launch Chromium ...; run npm run acceptance:setup". The ticket asks that each script's needs be stated and checked against the code. Also the row says it "deletes the build", but on a production deployment the delete step fails (`deleteStep`: 405 -> "FAIL production deployment: delete is disabled"), which the row does not say. Direction: replace the cell with: "The preview URL as the argument, and Chromium from `npm run acceptance:setup` (the open step launches it). When the preview is protected, set `VERCEL_AUTOMATION_BYPASS_SECRET`; without it a 401 or 403 exits with a request to set it. It fails on a production deployment, where deleting builds is disabled." Facts to keep: URL argument; bypass secret; 401/403 request-to-set message.
2. `README.md` (More documentation, `docs/` bullet) - contract (text) - "the design docs, one per app" contradicts the Apps table, where StarCraft has no design doc; `docs/` also holds `api/`. Direction: replace with "- [docs/](docs/): the design docs for the WOTR combat simulator and the AoE4 build order." Fact kept: `docs/` holds the design docs.

## Acceptance criteria

- Names the site and keeps the live URL: pass.
- Three app rows with page paths; WOTR and AoE4 link docs, StarCraft says none: pass. All relative links resolve (ARCHITECTURE.md, docs/, docs/api/openapi.json, the two design docs exist). Only `docs/aoe4-build-order.md` exists at the base, so the AoE4 row is complete.
- Node 24.x matches `engines.node`: pass.
- Every script listed (all 7 in `package.json`), with needs checked against code: fail for `smoke:preview` (finding 1); the others verified (`test:blob-live` `.env.local` loading and empty-id throw, `acceptance` port/override, `lint:dup` two configs, `acceptance:setup`).
- Env vars `BUILDS_STORE_ID`, `BUILDS_LOCAL_DIR`, `BLOB_LIVE`, `VERCEL_ENV`, `VERCEL`: pass; checked against `storeFor`, `deploymentEnv`, `storageEnv`, and the live test's `skipIf(BLOB_LIVE !== '1')`.
- Acceptance blanking and `test-results/builds-local`: pass (`webServerEnv` in `playwright.config.ts`).
- `test:blob-live` `.env.local` and non-empty id: pass.
- Links to ARCHITECTURE.md, docs/, openapi.json: pass.
- No other doc made untrue: pass (only reference to a README is `docs/aoe4-build-order.md:133`, which is `data/aoe4-build-order/README.md`).
- Only docs change: pass.
- INVARIANTS: none touched; hold.

## Other checks

- Doc claims list checked against code; the claims not named in findings hold, including "builds API routes fail" (ARCHITECTURE says 503).
- Lint: not run (README only). Review bot: none configured. UI inspection: not applicable.
- No shipped-artifact hygiene issues (no ticket ids or factory pointers in the README).

## Non-blocking notes

- Docs report's out-of-scope note: REPO.md Tooling gaps is stale about `test`/`lint:dup` scripts; factory file, not a repo doc.

## Coverage

README.md in full; `package.json`, `playwright.config.ts`, `scripts/smoke-preview.mjs`, `lib/aoe4-build-order/build-store.ts`, `saved-builds.ts`, the live test, `pages/index.js`, ARCHITECTURE.md opening.
