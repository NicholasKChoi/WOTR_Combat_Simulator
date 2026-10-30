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
| aoe4-build-order | TODO: proposed `pages/apps/aoe4-build-order.*`, `components/apps/aoe4-build-order/**`, `lib/aoe4-build-order/**`, `pages/api/aoe4-build-order/**`, `data/aoe4-build-order/**` | Build order input, simulation, timing report, versioned game data |

The apps don't depend on each other. The only shared code is the site component.

## Key surfaces

The request and response contract for every route under `pages/api/` lives in `docs/api/openapi.json`
on `main` (SGS-006), with shared types in `lib/combat-simulator/fight-api.ts`. That spec is authoritative;
this list only names the surfaces.

- `POST /api/fight`: WOTR combat simulator (`operationId: runFight`).
- Routes: `/`, `/apps/combat-simulator`, `/apps/starcraft-helper`.

## Design docs

| Topic | Doc | Authoritative for |
|-------|-----|-------------------|
| WOTR combat rules | `docs/combat-simulator.md` (on `main`, SGS-001) | Dice, leaders, casualties, round loop, input bounds, outcome reporting |
| StarCraft helper | `docs/starcraft-helper.md` (deferred; app frozen) | Player list, map pool source, strike limits, edge states |
| AoE4 build order | `docs/aoe4-build-order.md` (TODO, M2) | Simulation model, data source, timing outputs |

## Open questions

None.


## Decisions

- AoE4 model scope (owner, 2026-10-29): town centers and landmarks are ordinary buildings. Villager producers
  (town center, King's Palace) are production buildings, and "optimal villagers" means each one produces villagers
  continuously by default. Age-ups are landmark builds. Every construction pulls its assigned villagers off their
  resource for the build time, and build time depends on the builder count. Houses are auto-built when supply
  requires one. Resources are infinite (no depletion) for v1.
- AoE4 simulation (owner, 2026-10-29): fixed for v1 (one deterministic result per build order and data), with two
  requirements so a spread can be added later without a rewrite: (1) every quantity that could vary (walk time,
  idle time, distance to each resource) is an explicit named input to the simulator, never a constant inside the
  step logic; (2) the result and any API response are additive: v1 returns timings, and a later spread is a new
  field beside them, not a change to existing fields. A3 stays (deterministic; with a seed once spread exists).
- AoE4 game data (owner, 2026-10-29): costs, build times and technology modifiers come from a pinned
  aoe4world data snapshot (data.aoe4world.com, github.com/aoe4world/data), committed under `data/aoe4-build-order/`
  with its source commit and game patch recorded.
- AoE4 base villager gather rates (owner, 2026-10-29): use the values in SichYuriy/aoe4-production-calculator
  `src/data/BaseGatheringRates.ts` (resources/min) as provisional data, labeled in the data file as unverified,
  patch unknown, source repo has no license; replace them once measured or otherwise sourced.
- WOTR N: default 1000 battles, maximum 100,000 (owner, 2026-10-28).
- WOTR rules: the published game's combat-dice cap (5) and leadership-reroll cap are genuine rules and
  must be implemented. The fixed casualty order is intentional: it stands in for the human player's
  choice of losses.
- WOTR inputs: an army is capped at 10 units in total. A side starting with 0 units is invalid.
- WOTR caps: regulars + elites <= 10 per side; leaders do not count toward it and are capped at 5.
  Leader rerolls = min(misses, leaders, 5), so a side scores at most 5 hits per round.
- WOTR casualties: with more than 5 units and 0 regulars, a hit downgrades an elite to a regular.
- WOTR outcomes: attacker win / defender win / tie (both eliminated) frequencies; rounds mean, median,
  p10, p90; surviving units as the winning side's distribution of (regulars, elites) combinations, kept
  separate; hits per round as each side's distribution of hit counts 0-5 (share of all rounds with each count).
- `/api/fight` response carries results only, not the submitted armies; the page shows its own form values.
- JSON field names for the response are set by the Monte Carlo ticket; the design doc describes the
  statistics' meaning without naming fields, and the OpenAPI spec copies the names from the code.
- Malformed JSON keeps Next's plain-text 400 for now; the OpenAPI spec notes the exception.
- WOTR departures confirmed (owner, 2026-10-28): fight to elimination, no combat cards, no sieges or
  sorties, attacker labeled Shadow and defender Free.
- WOTR survivor shares: each (regulars, elites) combination's frequency is out of that side's wins
  (owner, 2026-10-28).
- Testing: WOTR battle logic moves to `lib/combat-simulator/` (per ARCHITECTURE.md) and is unit-tested
  directly with a new unit test runner. The runner is its own ticket; tickets that unit-test logic depend on it.
- WOTR time budget: N = 100,000 completes within 10 seconds.
- Error responses: `{ error: string }` with 400 or 405, accepted for now.
- API documentation: an OpenAPI (Swagger) JSON spec in the repo that agents can read with `jq`.
- Superseded PRs #11 (input validation) and #12 (Jest suite) were closed.

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
