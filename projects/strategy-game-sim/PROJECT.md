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

strongModelTriggers:                # docs, data snapshots, dependency/config upgrades, dead-code deletion, UI styling, test-only: not triggers alone
  - changes combat or simulation rules, dice, casualties, RNG, or battle/series loop behavior (what a run computes)
  - changes shared or mutable state, or the order of operations a result depends on (W2, A3)
  - changes a public schema, API request/response, or cross-component contract (/api/fight, shared types)
  - changes a bound or cap that enforces S3, H1, or A2
  - estimated over 150 lines of business logic
---

# Project notes

- The whole repo is in scope except `golang/` (legacy prototype, not deployed).
- Each app owns its purpose and rules in its own design doc under `docs/`. CONTEXT.md lists them.
