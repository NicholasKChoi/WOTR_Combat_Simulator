# Strategy Game Simulator: Milestones

## M1: Foundations, plus a working WOTR Monte Carlo simulator

**Outcome:** Both existing apps have design docs that reviewers judge against, the repo has an
acceptance harness, the WOTR simulator reports outcome frequencies over N battles, and the StarCraft
helper's edge cases behave as its doc says.

### Exit criteria

| id | criterion | kind | covered by | status |
|----|-----------|------|------------|--------|
| M1.1 | `docs/combat-simulator.md` states the WOTR combat rules the simulator implements, input bounds, and outcome reporting | code | | open |
| M1.2 | `docs/starcraft-helper.md` states the helper's purpose, player list, map pool source, strike limits, and edge states | code | | open |
| M1.3 | An acceptance harness drives `/api/fight` over HTTP and renders app pages with clicks, runnable by one command | code | | open |
| M1.4 | REPO.md `acceptanceHarness` and `commands.acceptance` point at the harness | ops | | open |
| M1.5 | `/api/fight` validates and caps inputs, rejects bad methods, and never returns NaN (S3) | code | | open |
| M1.6 | `/api/fight` runs N independent battles and returns outcome frequencies; the page shows them (W2) | code | | open |
| M1.7 | The API surface is documented and reviewable: request and response shapes written down and listed in CONTEXT.md Key surfaces | code | | open |
| M1.8 | StarCraft helper meets H1 and H2: bounded re-roll, plain message when all maps are struck | code | | open |

### Delivery sequence

1. Design docs (M1.1, M1.2). Owner supplies the rules; everything else is judged against these.
2. Acceptance harness (M1.3), then point REPO.md at it (M1.4).
3. `/api/fight` input hardening (M1.5).
4. Monte Carlo over N battles (M1.6).
5. StarCraft helper edge cases (M1.8). Can run in parallel with steps 3–4.
6. Follow-up: document the API surface (M1.7).

### Safety and contracts

- The site is deployed on Vercel from `main`. Every PR gets a preview deploy; check it before merging.
- `/api/fight` response shape changes in M1.6. The only consumer is `components/apps/combat-simulator/results.js`.

## M2: AoE4 Build Order Simulator (Ottomans)

**Outcome:** A new app simulates an Ottoman build order and reports macro timings.

### Exit criteria

TODO: write after the AoE4 open questions in CONTEXT.md are decided and `docs/aoe4-build-order.md` exists.

| id | criterion | kind | covered by | status |
|----|-----------|------|------------|--------|
| M2.1 | `docs/aoe4-build-order.md` defines the model, data source, and outputs | code | | open |
