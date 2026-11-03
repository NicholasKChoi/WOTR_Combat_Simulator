# Strategy Game Simulator: Context

## Purpose

A small site of independent apps that help with strategy games. Each app models one part of a game
with randomness, either to estimate odds or to make fair random picks. A landing page routes to each app.

- **WOTR Combat Simulator.** It estimates battle outcomes in *War of the Ring*. Combat odds depend on
  how the armies change from round to round, so they're hard to work out exactly. The app runs a battle
  N times and reports how often each outcome occurs. Status: unfinished; it runs one battle today.
- **StarCraft Helper.** (Frozen: no changes in this project.) It handles matchmaking for a small group of friends: random 1v1 pairings, and
  a map from the current pool that skips maps players have struck.
- **AoE4 Build Order Simulator.** It simulates an *Age of Empires IV* build order step by step
  (villager production, gathering, building, age-ups) to estimate macro timings. English only at first (owner, 2026-10-29: simpler than Ottomans).
  Status: new.

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
- AoE4 build checking: `lib/aoe4-build-order/schema.ts` (`checkBuildOrder`, `checkSimInputs`, `buildOrderCatalog`) and `lib/aoe4-build-order/text-to-build.ts` (`textToBuildOrder`), both zod-based.
- Routes: `/`, `/apps/combat-simulator`, `/apps/starcraft-helper`, `/apps/aoe4-build-order`.

## Design docs

| Topic | Doc | Authoritative for |
|-------|-----|-------------------|
| WOTR combat rules | `docs/combat-simulator.md` (on `main`, SGS-001) | Dice, leaders, casualties, round loop, input bounds, outcome reporting |
| StarCraft helper | `docs/starcraft-helper.md` (deferred; app frozen) | Player list, map pool source, strike limits, edge states |
| AoE4 build order | `docs/aoe4-build-order.md` (on `main`, SGS-013) | Simulation model, data source, timing outputs |

## Open questions

None.


## Decisions

None.

## Out of scope

- `golang/` (Go prototype and its create-react-app frontend). Not deployed, and no Go toolchain.
- AoE4 civilizations other than English.
- WOTR character and Nazgul leadership (a later milestone).
- StarCraft Helper: frozen. No tickets touch `pages/apps/starcraft-helper.js`. Its invariants (H1–H3) still
  apply if a shared-code change affects it.
- WOTR extensibility (owner, 2026-10-28): leave seams for later termination rules (max rounds, retreat)
  without building them. The battle splits into a per-round step and a loop with a stop check; `Battle`
  takes an options argument (empty in M1); the response and OpenAPI spec allow outcome kinds beyond
  attacker, defender, and tie. Max rounds itself is a later ticket.
