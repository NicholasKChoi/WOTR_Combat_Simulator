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
  (villager production, gathering, building, age-ups) to estimate macro timings. Ottomans only at first.
  Status: new.

## Component model

| Component | Paths | Owns |
|-----------|-------|------|
| site | `pages/index.js`, `pages/_app.js`, `components/layout.*`, `utils/**`, `styles/**` | Landing page and routing, shared Layout, shared helpers and styles |
| wotr-combat-simulator | `pages/apps/combat-simulator.js`, `components/apps/combat-simulator/**`, `pages/api/fight.ts`, `pages/api/models/army.ts` | Army input form, `/api/fight` battle simulation, results view |
| starcraft-helper | `pages/apps/starcraft-helper.js` | Partner pairing, map strike and map pick, all client-side |
| aoe4-build-order | TODO: proposed `pages/apps/aoe4-build-order.*`, `components/apps/aoe4-build-order/**`, `lib/aoe4-build-order/**`, `pages/api/aoe4-build-order/**`, `data/aoe4-build-order/**` | Build order input, simulation, timing report, versioned game data |

The apps don't depend on each other. The only shared code is the site component.

## Key surfaces

TODO: these have not been declared stable. Making the API surface reviewable is a follow-up ticket (M1.7).
The current surfaces are:

- `POST /api/fight`: form fields `attack-regs`, `attack-elts`, `attack-ldrs`, `defend-regs`,
  `defend-elts`, `defend-ldrs`. The response is the `BattleStats` returned by `getStats()` in `pages/api/fight.ts`.
- Routes: `/`, `/apps/combat-simulator`, `/apps/starcraft-helper`.

## Design docs

| Topic | Doc | Authoritative for |
|-------|-----|-------------------|
| WOTR combat rules | `docs/combat-simulator.md` (TODO, M1.1) | Dice, leaders, casualties, round loop, input bounds, outcome reporting |
| StarCraft helper | `docs/starcraft-helper.md` (deferred; app frozen) | Player list, map pool source, strike limits, edge states |
| AoE4 build order | `docs/aoe4-build-order.md` (TODO, M2) | Simulation model, data source, timing outputs |

## Open questions

- AoE4: where do game numbers (costs, build times, gather rates) come from, a community data set
  such as aoe4world or hand-entered values? TODO
- AoE4: should the simulation be fixed (one answer per build order), or vary walking time and idle
  villagers and report a spread of results? TODO

## Decisions

- WOTR N: default 1000 battles, maximum 100,000 (owner, 2026-10-28).
- WOTR rules: the published game's combat-dice cap (5) and leadership-reroll cap are genuine rules and
  must be implemented. The fixed casualty order is intentional: it stands in for the human player's
  choice of losses.
- WOTR inputs: an army is capped at 10 units in total. A side starting with 0 units is invalid.
- WOTR outcome frequencies: should include round counts and surviving units as well as who wins. The
  design doc (SGS-001) proposes the exact statistics for the owner to confirm.
- WOTR caps: regulars + elites <= 10 per side; leaders do not count toward it and are capped at 5.
  Leader rerolls = min(misses, leaders, 5), so a side scores at most 5 hits per round.
- WOTR casualties: with more than 5 units and 0 regulars, a hit downgrades an elite to a regular.
- WOTR outcomes: attacker win / defender win / tie (both eliminated) frequencies; rounds mean, median,
  p10, p90; surviving-unit distribution; hits per round.
- WOTR time budget: N = 100,000 completes within 10 seconds.
- Error responses: `{ error: string }` with 400 or 405, accepted for now.
- `/api/models/army`: stays where it is, documented as not part of the API.
- API documentation: an OpenAPI (Swagger) JSON spec in the repo that agents can read with `jq`.
- Superseded PRs #11 (input validation) and #12 (Jest suite) were closed.

## Out of scope

- `golang/` (Go prototype and its create-react-app frontend). Not deployed, and no Go toolchain.
- AoE4 civilizations other than Ottomans.
- WOTR character and Nazgul leadership (a later milestone).
- StarCraft Helper: frozen. No tickets touch `pages/apps/starcraft-helper.js`. Its invariants (H1–H3) still
  apply if a shared-code change affects it.
