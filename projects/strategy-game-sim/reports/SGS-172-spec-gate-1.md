# SGS-172 spec gate 1

**Verdict: NEEDS_SPEC** (two small gaps; the rest of the ticket checks out against origin/main)

## Gaps

1. Scope "Environment variables" and the matching criterion - `VERCEL` is missing. `storeFor` in `lib/aoe4-build-order/build-store.ts` reads `env.VERCEL` together with `VERCEL_ENV`. It throws when `VERCEL` is set and `VERCEL_ENV` is not. Both API routes (`pages/api/aoe4-build-order/builds/[id].ts` and `named-builds/[id].ts`) pass `process.env.VERCEL` into `deploymentEnv`. `playwright.config.ts` also blanks `VERCEL`. An implementer who follows the four-variable list would document `VERCEL_ENV` unset as harmless and leave out the 503 rule. Fix: add `VERCEL` to the required list, with its interaction with `VERCEL_ENV` (the set-without-`VERCEL_ENV` failure). Also state that the acceptance run blanks `BUILDS_STORE_ID`, `VERCEL_ENV` and `VERCEL` and points `BUILDS_LOCAL_DIR` at `test-results/builds-local`. That is an observable behavior of `npm run acceptance`.
2. Acceptance criterion 5 quotes a current function name ("matching `buildStoreFromEnv`") instead of stating the behavior. Proposed rewrite: "documents each of `BUILDS_STORE_ID`, `BUILDS_LOCAL_DIR`, `BLOB_LIVE`, `VERCEL_ENV`, `VERCEL`: who reads it and what happens when it is unset or empty. A non-empty `BUILDS_STORE_ID` selects the Blob store; otherwise the file store is used, under `BUILDS_LOCAL_DIR` or its default. The live test runs only when `BLOB_LIVE` is exactly `1`." The behavior is in the code; no guess is involved.

## Notes (non-blocking)

- `test:blob-live` also loads `.env.local` when it exists (`vercel env pull .env.local`) and throws if `BUILDS_STORE_ID` is empty. State this in the "needs" column; Scope's example omits `.env.local`.
- Overlap with SGS-171 (not yet landed, no Depends-on): after it lands, the AoE4 design doc spans three files. The README link to `docs/aoe4-build-order.md` still resolves, but "its design doc" becomes incomplete. SGS-171 already searches `README*`, so it should update the row if it lands after this ticket. If this ticket lands after SGS-171, link whatever `docs/aoe4-build-order*.md` files exist. Consider adding an explicit "re-check the AoE4 design doc names at the base" line.
- SGS-173 also edits the storage text and may touch a README line. This ticket keeps the storage rule to one short statement, so there is no conflict.
- Verified: all three pages exist; `docs/starcraft-helper.md` does not exist; `docs/api/openapi.json` exists; `engines.node` is `24.x`; the seven scripts and their needs match the code. There is no `README.md` pointer in ARCHITECTURE.md or `.github`. The only README references are to `data/aoe4-build-order/README.md`, which stays true. Risk low, Invariants none, On merge none are appropriate for a docs-only change.
