# SGS-172 ticket author, re-spec 1

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-172-readme-entry-point.md

Verified at origin/main: `storeFor` reads `VERCEL` and `VERCEL_ENV` via `deploymentEnv` (saved-builds.ts) and throws when `VERCEL` is set without `VERCEL_ENV`; `playwright.config.ts` blanks `BUILDS_STORE_ID`, `VERCEL_ENV`, `VERCEL` and sets `BUILDS_LOCAL_DIR` to `test-results/builds-local`.

Changes:
- Gap 1: Scope now lists `VERCEL` with its `VERCEL_ENV` interaction and the acceptance env blanking; new criterion covers the blanking.
- Gap 2: the env-var criterion is rewritten as behavior (the store-selection rule, `BLOB_LIVE` exactly `1`, `VERCEL` without `VERCEL_ENV` is an error), with no function name quoted.
- Notes: `test:blob-live` `.env.local` loading and empty-store-id throw are in Scope and a criterion; a "re-check AoE4 design doc names at the base" line is in Scope and the links criterion, covering the SGS-171 overlap.
- Appended `## Re-spec 1 - 2026-11-15`. Tags `(respec 1)` on changed criteria.

ticket-lint: no errors. No diagrams (docs only). No open questions. No scratch checkout was made.
