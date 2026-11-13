# Architecture

This site is a collection of independent apps for strategy games. Each app models one part of a game
with randomness, either to estimate odds or to make fair random picks. A landing page links to each app.

This file says where things go. It does not list every file; use `git ls-files` for that.

## Stack

- Next.js 16, Pages Router. Deployed on Vercel from `main`; every PR gets a preview deploy.
- React 19. TypeScript 7, `strict: true`. `tsconfig.json` only type-checks
  `.ts`/`.tsx`, so write new files as `.ts`/`.tsx`.
- Node 24.x (`engines.node` in `package.json`).
- Styling: Bootstrap 5 utility classes plus CSS modules. Combine class names with `classnames` (`cn`).
  The site root font size is 18px (`styles/global.css`), so 1rem is 18px: convert rem figures at 18.
- `golang/` is a retired prototype. It is not deployed and not maintained.

## Where files go

| Kind of file | Location | Notes |
|---|---|---|
| App page | `pages/apps/<app>.tsx` | One page per app. Renders inside `Layout`. Its URL is `/apps/<app>`. |
| App UI components | `components/apps/<app>/` | Used only by that app. |
| App logic (simulation, rules, stats) | `lib/<app>/` | Plain TypeScript with no React or Next imports, so it can be tested and reused by API routes. |
| AoE4 saved-build storage | `lib/aoe4-build-order/build-store.ts`, `blob-build-store.ts`, `save-rate-limit.ts` | `build-store.ts` owns the `BuildStore` seam, its memory and file stores, and `buildStoreFromEnv`, which picks the store from the environment. Besides the immutable saved builds, every store holds editable named builds under `namedBuildKey` through `createNamed`, `getNamed` (a fresh read with an opaque etag), `replaceNamed` (a compare-and-swap on that etag: a changed etag or an absent build gives `conflict`, except that the Blob store gives `replaced` when its read-back shows the JSON it sent) and `deleteNamed`. `blob-build-store.ts` is the Vercel Blob store and the only non-test source file that imports `@vercel/blob` (its tests and the live and acceptance harnesses import it too); its fresh reads (`getNamed` and the counter read) request the blob uncompressed (`accept-encoding: identity`) so the etag is the strong form `ifMatch` compares against, and a fresh read that still gets a weak `W/` etag throws, which the routes answer as 503. When the `put` of a build write (`create`, behind `putBuild` and `createNamed`, or `replaceNamed`) throws, the store makes a fresh read of the key and counts the write as done when the stored value, serialized with `JSON.stringify`, is the exact text it sent, since a write whose response was lost may have landed before the SDK's retry failed. Otherwise `create` gives `exists` when `head` finds the key and rethrows the put error when it does not; `replaceNamed` gives `conflict` for a precondition or not-found error, and for any other put error when `head` reports the key absent (`ifMatch` on a deleted blob raises a plain `BlobError`), and rethrows the put error otherwise. `bumpCounter` makes no such read-back, because parallel saves from one client write identical counter JSON: after a 412, or when the counter it was creating now exists, it starts its next attempt with a fresh read and a new `put`; it rethrows any other error and gives `contended` after its third attempt. Creating the store sets `VERCEL_BLOB_RETRIES` to `BLOB_SDK_RETRIES` (1) when that variable is unset or empty (`@vercel/blob` reads it as the retry count of each `put`, `head` and `del` call, default 10; `get` makes a single request); a value already set is kept. `blob-build-store.live.test.ts` checks a real store and is skipped unless `BLOB_LIVE=1` (`npm run test:blob-live`). `buildStoreFromEnv` loads it through a dynamic `import()`, and only when `BUILDS_STORE_ID` is set and non-empty; when it is unset or empty the file store is used. `save-rate-limit.ts` owns the per-client save limit, whose counter lives in the store; `nextCounter` in `build-store.ts` is the one counter step every store calls, and a refused save writes nothing. `VERCEL_ENV` (`production`, `preview`, anything else is `development`) is the first segment of every stored key. When `VERCEL` is set without `VERCEL_ENV`, `buildStoreFromEnv` rejects, so every builds route answers 503. |
| AoE4 route logic | `lib/aoe4-build-order/api-route.ts`, `builds-routes.ts`, `named-builds.ts`, `named-builds-routes.ts` | `api-route.ts` holds what every AoE4 route shares (the generic `RouteReply<Body>` and `sendReply`, whose body type each route handler's response type must include; `issuesError`, the one cap on reported issues; the 405 and not-an-object answers) and imports no server-only module, because browser-safe `saved-builds.ts` imports it. `builds-routes.ts` is the builds route logic as plain functions that return a reply, and holds the shared reply helpers `errorReply`, `storageUnavailable` and `idFailure`. `named-builds.ts` is browser-safe and holds the named-build ids, edit secrets, shapes and header parsers; `named-builds-routes.ts` is the named-builds route logic, in the same style. The builds route files under `pages/api/aoe4-build-order/builds/` and the named route files under `pages/api/aoe4-build-order/named-builds/` only adapt `req` and `res`: they call these functions and `sendReply`. |
| Local saved builds | `.builds-local/` | Git-ignored. The file store writes here when `BUILDS_STORE_ID` is unset or empty; a non-empty `BUILDS_LOCAL_DIR` points it at another directory. |
| App API route | `pages/api/<app>/<action>.ts` | A thin handler: validate input, call `lib/<app>/`, return JSON. Every file under `pages/api/` becomes a public route, so put only route handlers here. |
| App static data (unit stats, map pools) | `data/<app>/` | Versioned data files. When the data comes from a game patch or season, label it with that. |
| App design doc | `docs/<app>.md` | The app's purpose, the rules it implements, and its edge cases. Reviews judge behavior against it. |
| API spec | `docs/api/openapi.json` | One OpenAPI (JSON) spec for every route under `pages/api/`. Update it in the same change as the route. |
| Shared UI | `components/` (outside `components/apps/`) | For example `layout.js`. |
| Shared helpers | `utils/` | Code used by more than one app. |
| Styles | `styles/` for global and shared modules; `<component>.module.css` next to a component. | |
| Static assets | `public/` | Served from the site root. |
| Acceptance tests | `acceptance/` | End-to-end tests that drive the running site over HTTP and through the browser. |
| Scripts | `scripts/` | Node scripts run by hand or through an npm script (for example `npm run smoke:preview`). Not deployed and not imported by the app. A script is a plain `.mjs` run by Node, which `tsconfig.json` does not type-check, so it imports nothing from `lib/`, `components/` or `pages/`; a script that needs app code is written as a `.ts` file and gets its own ticket for how it runs. |

## Rules

- **Apps are independent.** An app never imports another app's `components/apps/<app>/`, `lib/<app>/`,
  or `data/<app>/`. Code that two apps need moves to `utils/` or shared `components/`.
- **Every app is reachable.** A new app adds a link in `pages/index.js` and wraps its page in `Layout`.
- **Every simulation is bounded.** Every numeric input and every iteration count has a maximum that is
  checked before the work starts.
- **Game rules live in the design doc.** A change to an app's rules updates `docs/<app>.md` in the same PR.
- **The AoE4 build order is checked for copied code.** `npm run lint:dup` runs two jscpd configs and fails
  if either finds a clone. `.jscpd.json` checks the AoE4 lib, components, API route and `acceptance/` for
  blocks of at least 8 lines and 70 tokens. `.jscpd.tests.json` checks the same paths, limited to test files
  and test helpers, for blocks of at least 5 lines and 70 tokens. Shared test helpers live in
  `lib/aoe4-build-order/test-helpers.ts`, `components/apps/aoe4-build-order/storage-test-helpers.ts`,
  `components/apps/aoe4-build-order/fetch-test-helpers.ts` and `acceptance/helpers.ts`.

## Adding an app

1. Write `docs/<app>.md`: its purpose, the rules it models, its inputs and their limits, and what it reports.
2. Put the logic in `lib/<app>/`, the page in `pages/apps/<app>.tsx`, and the components in `components/apps/<app>/`.
3. If it needs a server route, add `pages/api/<app>/<action>.ts` and describe it in `docs/api/openapi.json`.
4. Link it from `pages/index.js`.
5. Add acceptance tests under `acceptance/`.

## Existing code that predates this layout

These files work as they are. Move them only as part of a change that already touches them.

- The WOTR combat simulator's logic and army model live in `lib/combat-simulator/`, and
  `pages/api/fight.ts` is its route handler.
- The existing pages and components are `.js`.
