---
# Project profile for code-factory. Created by /code-factory:new-project.

slug: strategy-game-sim
title: Strategy Game Simulator
idPrefix: SGS                     # ticket ids are <idPrefix>-<NNN>
branchPrefix: sgs                 # task branches are <branchPrefix>-<nnn>-<slug>
owner: "Nick Choi (NicholasKChoi)"
components:                       # bounded list of components tickets may name
  - site                          # landing page, Layout, shared utils and styles
  - wotr-combat-simulator
  - starcraft-helper
  - aoe4-build-order

stackMarker: cf-stack
reworkCap: 3
respecThreshold: 2
questionBoard: true               # unattended modes file owner questions on QUESTIONS.md (Discord bot)
driveOnAnswer: true               # an owner answer starts scripts/drive-loop.sh

strongModelTriggers:                # docs, data snapshots, dependency/config upgrades, dead-code deletion, UI styling, test-only: not triggers alone
  - changes combat or simulation rules, dice, casualties, RNG, or battle/series loop behavior (what a run computes)
  - changes shared or mutable state, or the order of operations a result depends on (W2, A3)
  - changes an existing public schema, API request/response, or cross-component contract that current callers depend on (/api/fight, shared types); a new contract the design already specifies with exact names does not count
  - changes a bound or cap that enforces S3, H1, or A2
  - estimated over 250 lines of business logic (UI components, tests, OpenAPI/schema JSON, and data excluded)
---

# Project notes

- The whole repo is in scope except `golang/` (legacy prototype, not deployed).
- Each app owns its purpose and rules in its own design doc under `docs/`. CONTEXT.md lists them.


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
