# Context

## Component model

| Component | Paths | Owns |
|-----------|-------|------|
| site | `pages/index.js`, `pages/_app.js`, `components/layout.*`, `utils/**`, `styles/**` | Landing page and routing, shared Layout, shared helpers and styles |
| wotr-combat-simulator | `pages/apps/combat-simulator.js`, `components/apps/combat-simulator/**`, `lib/combat-simulator/**`, `pages/api/fight.ts` | Army input form, `/api/fight` battle simulation, results view |
| starcraft-helper | `pages/apps/starcraft-helper.js` | Partner pairing, map strike and map pick, all client-side |
| aoe4-build-order | `pages/apps/aoe4-build-order.*`, `components/apps/aoe4-build-order/**`, `lib/aoe4-build-order/**`, `pages/api/aoe4-build-order/**`, `data/aoe4-build-order/**` | Build order input, simulation, timing report, versioned game data |

The apps don't depend on each other. The only shared code is the site component.

## Key surfaces

The request and response contract for every route under `pages/api/` lives in `docs/api/openapi.json`
on `main` (SGS-006), with shared types in `lib/combat-simulator/fight-api.ts`. That spec is authoritative;
this list only names the surfaces.

- `POST /api/fight`: WOTR combat simulator (`operationId: runFight`).
- `POST /api/aoe4-build-order/simulate` (`operationId: simulateBuildOrder`).
- `POST /api/aoe4-build-order/builds` (`operationId: saveBuild`), and `GET` and `DELETE /api/aoe4-build-order/builds/{id}` (`getSavedBuild`, `deleteSavedBuild`); handlers in `lib/aoe4-build-order/api-route.ts` and `lib/aoe4-build-order/builds-routes.ts`.
- `POST /api/aoe4-build-order/named-builds` (`createNamedBuild`) and `GET`, `PUT`, `DELETE /api/aoe4-build-order/named-builds/{id}` (`getNamedBuild`, `updateNamedBuild`, `deleteNamedBuild`); handlers in `lib/aoe4-build-order/named-builds-routes.ts`.
- AoE4 build checking: `lib/aoe4-build-order/schema.ts` (`checkBuildOrder`, `checkSimInputs`, `buildOrderCatalog`) and `lib/aoe4-build-order/text-to-build.ts` (`textToBuildOrder`), both zod-based.
- Routes: `/`, `/apps/combat-simulator`, `/apps/starcraft-helper`, `/apps/aoe4-build-order`.
- AoE4 build library list merges (SGS-124, beside design/M8.md C6): `withMyBuilds(list, mine)` and `withLoadedEntry(list, entry)` in `components/apps/aoe4-build-order/build-library.ts`; acceptance helper `acceptBeforeUnload(page)` in `acceptance/helpers.ts`.

## Design docs

| Topic | Doc | Authoritative for |
|-------|-----|-------------------|
| WOTR combat rules | `docs/combat-simulator.md` (on `main`, SGS-001) | Dice, leaders, casualties, round loop, input bounds, outcome reporting |
| StarCraft helper | `docs/starcraft-helper.md` (deferred; app frozen) | Player list, map pool source, strike limits, edge states |
| AoE4 build order | `docs/aoe4-build-order.md` (on `main`, SGS-013) | Simulation model, data source, timing outputs |

## Out of scope

Repo-wide: no project's tickets touch these.

- `golang/` (Go prototype and its create-react-app frontend). Not deployed, and no Go toolchain.
- StarCraft Helper: frozen. No tickets touch `pages/apps/starcraft-helper.js`. Its invariants (H1–H3) still
  apply if a shared-code change affects it.
