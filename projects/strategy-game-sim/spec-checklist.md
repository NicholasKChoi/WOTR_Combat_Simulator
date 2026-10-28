# Strategy Game Simulator: Spec-review checklist

The review gate holds every diff to this list in addition to INVARIANTS.md. Apply a section only when
the diff touches its paths (see INVARIANTS.md).

## Contracts

- [ ] Field, API, and metric names match the Key surfaces section of CONTEXT.md exactly.

## Scope

- [ ] Nothing listed under Out of scope in CONTEXT.md is implemented. No diff touches `golang/`.
- [ ] No open question from CONTEXT.md is answered with an invented constant.

## Naming

- [ ] Names state intent, not the one mode that is true today. No dead or aspirational enum values.

## Site-wide (S1–S3)

- [ ] S1: no import path from one `pages/apps/*` or `components/apps/<x>/` into another app's files.
- [ ] S2: every page added under `pages/apps/` has a link in `pages/index.js` and renders inside `Layout`.
- [ ] S3: every new numeric input or iteration count has an explicit cap checked before the loop runs.

## WOTR Combat Simulator (W1–W2)

- [ ] W1: any change to dice, leader, casualty, or round logic cites the matching rule in
      `docs/combat-simulator.md`, or updates the doc in the same diff.
- [ ] W2: each simulated battle builds fresh army objects from the request; nothing mutated in one
      iteration is read in the next.

## StarCraft Helper (H1–H3)

- [ ] H1: every retry loop that avoids repeating the last result has an exit when only one result is possible.
- [ ] H2: map selection filters struck maps first, and the all-struck case renders a user-facing message.
- [ ] H3: selection uses `utils/shuffle` or an equivalent uniform pick, with no index bias.

## AoE4 Build Order Simulator (A1–A3)

- [ ] A1: no cost, time, or rate literal in simulation code; every one comes from `data/aoe4/**` with a patch label.
- [ ] A2: every spend checks affordability first, and waiting time feeds into the reported timings.
- [ ] A3: no `Math.random`, `Date.now`, or timer-dependent value in the simulation path.
