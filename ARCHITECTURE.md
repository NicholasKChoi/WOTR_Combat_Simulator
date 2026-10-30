# Architecture

This site is a collection of independent apps for strategy games. Each app models one part of a game
with randomness, either to estimate odds or to make fair random picks. A landing page links to each app.

This file says where things go. It does not list every file; use `git ls-files` for that.

## Stack

- Next.js 12, Pages Router. Deployed on Vercel from `main`; every PR gets a preview deploy.
- React 18. TypeScript 4.7 with `strict: false`. `tsconfig.json` only type-checks `.ts`/`.tsx`, so write
  new files as `.ts`/`.tsx`.
- Styling: Bootstrap 5 utility classes plus CSS modules. Combine class names with `classnames` (`cn`).
- `golang/` is a retired prototype. It is not deployed and not maintained.

## Where files go

| Kind of file | Location | Notes |
|---|---|---|
| App page | `pages/apps/<app>.tsx` | One page per app. Renders inside `Layout`. Its URL is `/apps/<app>`. |
| App UI components | `components/apps/<app>/` | Used only by that app. |
| App logic (simulation, rules, stats) | `lib/<app>/` | Plain TypeScript with no React or Next imports, so it can be tested and reused by API routes. |
| App API route | `pages/api/<app>/<action>.ts` | A thin handler: validate input, call `lib/<app>/`, return JSON. Every file under `pages/api/` becomes a public route, so put only route handlers here. |
| App static data (unit stats, map pools) | `data/<app>/` | Versioned data files. When the data comes from a game patch or season, label it with that. |
| App design doc | `docs/<app>.md` | The app's purpose, the rules it implements, and its edge cases. Reviews judge behavior against it. |
| API spec | `docs/api/openapi.json` | One OpenAPI (JSON) spec for every route under `pages/api/`. Update it in the same change as the route. |
| Shared UI | `components/` (outside `components/apps/`) | For example `layout.js`. |
| Shared helpers | `utils/` | Code used by more than one app. |
| Styles | `styles/` for global and shared modules; `<component>.module.css` next to a component. | |
| Static assets | `public/` | Served from the site root. |
| Acceptance tests | `acceptance/` | End-to-end tests that drive the running site over HTTP and through the browser. |

## Rules

- **Apps are independent.** An app never imports another app's `components/apps/<app>/`, `lib/<app>/`,
  or `data/<app>/`. Code that two apps need moves to `utils/` or shared `components/`.
- **Every app is reachable.** A new app adds a link in `pages/index.js` and wraps its page in `Layout`.
- **Every simulation is bounded.** Every numeric input and every iteration count has a maximum that is
  checked before the work starts.
- **Game rules live in the design doc.** A change to an app's rules updates `docs/<app>.md` in the same PR.

## Adding an app

1. Write `docs/<app>.md`: its purpose, the rules it models, its inputs and their limits, and what it reports.
2. Put the logic in `lib/<app>/`, the page in `pages/apps/<app>.tsx`, and the components in `components/apps/<app>/`.
3. If it needs a server route, add `pages/api/<app>/<action>.ts` and describe it in `docs/api/openapi.json`.
4. Link it from `pages/index.js`.
5. Add acceptance tests under `acceptance/`.

## Existing code that predates this layout

These files work as they are. Move them only as part of a change that already touches them.

- The WOTR combat simulator's logic and army model live in `lib/combat-simulator/`, and
  `pages/api/fight.ts` is its route handler. `pages/api/models/army.ts` only re-exports the model, but
  because it sits under `pages/api/` it is still served as `/api/models/army`. That route is not part
  of the API.
- The existing pages and components are `.js`.
