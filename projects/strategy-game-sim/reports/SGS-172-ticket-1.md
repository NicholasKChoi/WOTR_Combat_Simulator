# SGS-172 ticket author report

Ticket: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-172-readme-entry-point.md`

Title: Rewrite README.md as the repo's entry point. Type Docs, component site, Milestone none, Risk low (CONTEXT.md names no README authority), no dependencies, LOC 0 (docs only), On merge none. Lint passed with no output.

Explored at origin/main: README.md (4 lines), package.json scripts, scripts/smoke-preview.mjs (reads VERCEL_AUTOMATION_BYPASS_SECRET), playwright.config.ts (ACCEPTANCE_PORT, blanks the store env), lib/aoe4-build-order/build-store.ts `buildStoreFromEnv`, the live test (`BLOB_LIVE`, `BUILDS_STORE_ID`), ARCHITECTURE.md, pages/index.js, docs/ listing.

Criteria cover: what the site is and live URL; the three apps with page paths; links to the design docs; the Node version; every package.json script with its needs; the four env vars and their unset behavior; links to ARCHITECTURE.md, docs/, and docs/api/openapi.json; no other doc made untrue; docs-only change.

Findings that shaped the ticket:
- `docs/starcraft-helper.md` does not exist (CONTEXT.md marks it deferred, and the app is frozen). The ticket tells the README to say the app has no design doc and not to link a missing file.
- `VERCEL_AUTOMATION_BYPASS_SECRET` and `ACCEPTANCE_PORT` are also read, so the ticket lets the implementer add them to the env table.
- No doc points at the root README. The only hit is `data/aoe4-build-order/README.md`, which is a different file.

Diagrams: none. Open questions: none (no decision needed beyond what the code states). Overlap: the BACKLOG item for the `docs/aoe4-build-order.md` split changes the doc's links but not the README's link to `docs/aoe4-build-order.md`, which stays valid. The backlog item that moves the storage essay out of ARCHITECTURE.md is independent, since the README only states the env rule briefly. BACKLOG.md and the graph were not edited.
