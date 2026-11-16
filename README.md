# WOTR_Combat_Simulator

A collection of independent apps for strategy games. Each app models one part of a game with randomness,
either to estimate odds or to make fair random picks. A landing page links to each app.

**Live site:** https://wotr-combat-simulator-gamma.vercel.app/

## Apps

| App | Page | Design doc |
|---|---|---|
| WOTR combat simulator | `/apps/combat-simulator` | [docs/combat-simulator.md](docs/combat-simulator.md) |
| AoE4 build order | `/apps/aoe4-build-order` | [docs/aoe4-build-order.md](docs/aoe4-build-order.md) |
| StarCraft helper | `/apps/starcraft-helper` | none |

## Getting started

Node 24.x is required (`engines.node` in `package.json`). Install dependencies with `npm install`, then
start the dev server with `npm run dev`.

## npm scripts

| Script | What it does | What it needs |
|---|---|---|
| `npm run dev` | Starts `next dev`. | Nothing. |
| `npm test` | Runs the Vitest unit tests once. | Nothing. The live Blob test is skipped unless `BLOB_LIVE` is `1`. |
| `npm run test:blob-live` | Runs the AoE4 Blob store test against a real Vercel Blob store. | `BUILDS_STORE_ID` set to a real store id. The test loads `.env.local` when it exists (`vercel env pull .env.local` writes it) and throws when `BUILDS_STORE_ID` is still empty. The script sets `BLOB_LIVE=1` itself. |
| `npm run acceptance` | Runs the Playwright acceptance tests in `acceptance/`. | Chromium, from `npm run acceptance:setup`. It starts its own `next dev` on a port derived from the checkout path (3100-3999); `ACCEPTANCE_PORT` overrides the port. |
| `npm run acceptance:setup` | Installs the Chromium that Playwright uses. | Network access. |
| `npm run smoke:preview -- <url>` | Saves a build to a deployed preview, reads it back, opens the AoE4 page, and deletes the build. Prints `PASS` or `FAIL` per step. | The preview URL as the argument, and Chromium from `npm run acceptance:setup` (the open step launches it). When the preview is protected, set `VERCEL_AUTOMATION_BYPASS_SECRET`; without it a 401 or 403 exits with a request to set it. It fails on a production deployment, where deleting builds is disabled. |
| `npm run lint:dup` | Runs the `jscpd` duplication check twice: once with `.jscpd.json` and once with `.jscpd.tests.json`. | Nothing. |

## Environment variables

The AoE4 saved-build routes choose where builds are stored from the environment.

| Variable | Read by | When unset or empty |
|---|---|---|
| `BUILDS_STORE_ID` | The AoE4 build store, and `npm run test:blob-live`. | The file store is used. A non-empty value selects the Vercel Blob store with that id. |
| `BUILDS_LOCAL_DIR` | The file store. | Builds go under `.builds-local/`. A non-empty value points the file store at that directory. It has no effect when the Blob store is selected. |
| `VERCEL_ENV` | The AoE4 build store. | Outside Vercel it counts as `development`. `production` and `preview` are used as they are; any other value counts as `development`. It is the first segment of every stored key. |
| `VERCEL` | The AoE4 build store. | Treated as not on Vercel. When it is set and `VERCEL_ENV` is not, the store cannot be built and the builds API routes fail. |
| `BLOB_LIVE` | The live Blob store test. | The test is skipped. It runs only when the value is exactly `1`. |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | `npm run smoke:preview`. | Requests carry no bypass header, which a protected preview rejects. |
| `ACCEPTANCE_PORT` | `playwright.config.ts`. | The port is derived from the checkout path. |

`npm run acceptance` blanks `BUILDS_STORE_ID`, `VERCEL_ENV`, and `VERCEL` for the server it starts and points
`BUILDS_LOCAL_DIR` at `test-results/builds-local`, whatever your shell or `.env.local` holds. Acceptance runs
never reach Vercel Blob.

## More documentation

- [ARCHITECTURE.md](ARCHITECTURE.md): where files go and the rules the code follows.
- [docs/](docs/): the design docs for the WOTR combat simulator and the AoE4 build order.
- [docs/api/openapi.json](docs/api/openapi.json): the API spec.
