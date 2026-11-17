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
| AoE4 saved-build storage | `lib/aoe4-build-order/build-store.ts`, `blob-build-store.ts`, `save-rate-limit.ts` | `build-store.ts` is the `BuildStore` seam with its memory and file stores, `blob-build-store.ts` is the Vercel Blob store and the only non-test source file that imports `@vercel/blob`, and `save-rate-limit.ts` is the per-client save limit. Behavior is in the [Storage section](docs/aoe4-build-order-format.md#storage) of the format doc. |
| AoE4 route logic | `lib/aoe4-build-order/api-route.ts`, `builds-routes.ts`, `named-builds.ts`, `named-builds-routes.ts` | `api-route.ts` holds what every AoE4 route shares (`RouteReply<Body>` and `sendReply`, whose body type each route handler's response type must include; `issuesError`; the 405 and not-an-object answers) and imports no server-only module, because browser-safe `saved-builds.ts` imports it. `builds-routes.ts` and `named-builds-routes.ts` are the builds and named-builds route logic as plain functions that return a reply, and `builds-routes.ts` also holds the shared reply helpers `errorReply`, `storageUnavailable` and `idFailure`. `named-builds.ts` is browser-safe and holds the named-build ids, edit secrets, shapes and header parsers. The route files under `pages/api/aoe4-build-order/` only adapt `req` and `res`: they call these functions and `sendReply`. |
| AoE4 wait wording | `lib/aoe4-build-order/wait-detail.ts` | The one home of what a step waits for: the detail builders the handlers call, a detail's breakdown reason and target key, and `waitDetailText`, its words. Browser-safe, because the page imports it for the step annotations: it imports only types from `simulate.ts` and takes values only from `model.ts`, `engine-common.ts` and `landmarks.ts`. Behavior is in the [Wait details section](docs/aoe4-build-order-format.md#wait-details) of the format doc. |
| AoE4 chart markers and zoom | `components/apps/aoe4-build-order/chart-markers.ts`, `chart-zoom.ts` | `chart-markers.ts` is the one home of every chart marker rule: the colours, the kind labels, which kinds are drawn and labelled, and where labels go. No other module defines a marker colour, label or kind list. `chart-zoom.ts` is the pure time-window math (zoom, clamp, pan, the time at a pointer position, the rows in a window): no React, and no import but types. Behavior is in the [UI doc](docs/aoe4-build-order-ui.md). |
| Local saved builds | `.builds-local/` | Git-ignored. The file store writes here; see the [Storage section](docs/aoe4-build-order-format.md#storage) for when and how to override it. |
| App API route | `pages/api/<app>/<action>.ts` | A thin handler: validate input, call `lib/<app>/`, return JSON. Every file under `pages/api/` becomes a public route, so put only route handlers here. |
| App static data (unit stats, map pools) | `data/<app>/` | Versioned data files. When the data comes from a game patch or season, label it with that. |
| App design doc | `docs/<app>.md`, or `docs/<app>-<topic>.md` files beside it when one file is too long | The app's purpose, the rules it implements, and its edge cases. Reviews judge behavior against it. |
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
- **Game rules live in the design doc.** A change to an app's rules updates the `docs/<app>*.md` file that states the rule in the same PR.
- **The AoE4 build order is checked for copied code.** `npm run lint:dup` runs two jscpd configs and fails
  if either finds a clone. `.jscpd.json` checks the AoE4 lib, components, API route and `acceptance/` for
  blocks of at least 8 lines and 70 tokens. `.jscpd.tests.json` checks the same paths, limited to test files
  and test helpers, for blocks of at least 5 lines and 70 tokens. Shared test helpers live in
  `lib/aoe4-build-order/test-helpers.ts`, `components/apps/aoe4-build-order/storage-test-helpers.ts`,
  `components/apps/aoe4-build-order/fetch-test-helpers.ts` and `acceptance/helpers.ts`.
- **Acceptance tests scroll hover and focus targets into view instantly.** Playwright `hover()` and `focus()`
  scroll the page when the target is out of view, and the Bootstrap stylesheet makes that scroll smooth. Rows
  then slide under the still pointer and fire late `pointerenter` events that change state after an assertion
  passed. A test scrolls its targets into view with `scrollIntoView({ behavior: 'instant' })` on the element
  before the hover and focus sequence, as `acceptance/aoe4-build-order-step-band.spec.ts` does, so no step
  scrolls. `scrollInstantly` in `acceptance/helpers.ts` is different: it scrolls the window to a y offset,
  not to a target.
- **The AoE4 build-order page is desktop-only.** It is supported from 1200 px wide. Below that the page keeps
  its 1200 px layout and the document scrolls sideways, with no notice. Its CSS has no viewport media queries or
  container queries, and its acceptance specs use viewports 1200 px wide or wider, except the one spec that checks
  the below-minimum behavior, `acceptance/aoe4-min-width.spec.ts`.

## Adding an app

1. Write `docs/<app>.md` (split it into `docs/<app>-<topic>.md` files if it grows too long): its purpose, the rules it models, its inputs and their limits, and what it reports.
2. Put the logic in `lib/<app>/`, the page in `pages/apps/<app>.tsx`, and the components in `components/apps/<app>/`.
3. If it needs a server route, add `pages/api/<app>/<action>.ts` and describe it in `docs/api/openapi.json`.
4. Link it from `pages/index.js`.
5. Add acceptance tests under `acceptance/`.

## Existing code that predates this layout

These files work as they are. Move them only as part of a change that already touches them.

- The WOTR combat simulator's logic and army model live in `lib/combat-simulator/`, and
  `pages/api/fight.ts` is its route handler.
- The existing pages and components are `.js`.
