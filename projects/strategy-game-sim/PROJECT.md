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

strongModelTriggers:
  - touches an invariant in INVARIANTS.md
  - changes a core control loop or state machine
  - changes a public schema, API, or cross-component contract
  - concurrency or ordering
  - estimated over 150 lines of business logic
---

# Project notes

- The whole repo is in scope except `golang/` (legacy prototype, not deployed).
- Each app owns its purpose and rules in its own design doc under `docs/`. CONTEXT.md lists them.
