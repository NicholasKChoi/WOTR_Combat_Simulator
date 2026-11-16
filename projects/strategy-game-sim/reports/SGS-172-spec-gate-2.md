# SGS-172 spec gate 2

**Verdict: READY**

Both gate-1 gaps are closed. I re-checked the ticket against origin/main.

- `VERCEL` is now in Scope and in the criteria. The failure rule is correct: `storeFor` in `lib/aoe4-build-order/build-store.ts` throws "VERCEL is set but VERCEL_ENV is not", and `deploymentEnv` in `saved-builds.ts` returns null when `VERCEL` is set and `VERCEL_ENV` is not.
- The store-selection rule is stated as behavior. A non-empty `BUILDS_STORE_ID` selects the Blob store. Otherwise the file store uses `BUILDS_LOCAL_DIR`, defaulting to `.builds-local`. This matches the code.
- `playwright.config.ts` blanks `BUILDS_STORE_ID`, `VERCEL_ENV` and `VERCEL`. It sets `BUILDS_LOCAL_DIR` to `test-results/builds-local`. `ACCEPTANCE_PORT` overrides the port. All of this matches the ticket.
- `test:blob-live` matches the ticket. It runs only when `BLOB_LIVE === '1'`. It loads `.env.local` when it exists. It throws when `BUILDS_STORE_ID` is empty.
- `package.json` has seven scripts and `engines.node` is `24.x`. The ticket says the README lists the scripts present when the implementer writes it, so a changed script list will not go stale.
- Only `docs/aoe4-build-order.md` and `docs/combat-simulator.md` exist at the base, plus `docs/api/openapi.json`. `docs/starcraft-helper.md` is absent, as the ticket says. The AoE4 row tells the implementer to re-check the doc names, which covers SGS-171 (needs_review, splits the doc) landing first.
- No doc in `ARCHITECTURE.md`, `docs/` or `.github/` points at the README, apart from `data/aoe4-build-order/README.md`, which stays true.
- Risk low, Invariants none and On merge none fit a docs-only change. The criteria hold no pinned counts or quoted function names.

## Notes (non-blocking)

- SGS-173 (needs_spec, depends on SGS-171) edits the storage text. The README keeps the storage rule to one short statement, so there is no conflict.
- The `VERCEL_ENV` unset behavior is left to the implementer to read from `storageEnv`. The ticket only says what `VERCEL_ENV` selects, but the code is unambiguous.
