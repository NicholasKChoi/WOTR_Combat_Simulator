# Strategy Game Simulator: Milestones

## M1: Foundations, plus a working WOTR Monte Carlo simulator

**Outcome:** The WOTR simulator has a design doc reviewers judge against, enforces the game's caps,
reports outcome frequencies over N battles, and is covered by an acceptance harness. The StarCraft
helper is frozen and out of this milestone.

### Exit criteria

| id | criterion | kind | covered by | status |
|----|-----------|------|------------|--------|
| M1.1 | `docs/combat-simulator.md` states the WOTR combat rules the simulator implements, input bounds, and outcome reporting | code | SGS-001 | open |
| M1.2 | `docs/starcraft-helper.md` (dropped: StarCraft helper frozen) | code | | dropped |
| M1.3 | An acceptance harness drives `/api/fight` over HTTP and the WOTR page and landing page with clicks, runnable by one command | code | SGS-002 | open |
| M1.4 | REPO.md `acceptanceHarness` and `commands.acceptance` point at the harness | ops | human (after SGS-002) | open |
| M1.5 | `/api/fight` accepts only POST, caps an army at 10 units, rejects 0-unit armies, and never returns NaN (S3) | code | SGS-003 | open |
| M1.6 | `/api/fight` runs N independent battles (default 1000, max 100,000) and returns outcome frequencies, round counts, and surviving units; the page shows them (W2) | code | SGS-005 | open |
| M1.7 | The API surface is documented and reviewable: request and response shapes written down and listed in CONTEXT.md Key surfaces | code | SGS-006 + human (CONTEXT Key surfaces) | open |
| M1.8 | StarCraft helper H1/H2 fixes (dropped: StarCraft helper frozen) | code | | dropped |
| M1.9 | Combat applies the published caps: at most 5 combat dice and the leadership-reroll cap, as written in `docs/combat-simulator.md` (W1) | code | SGS-004 | open |
| M1.10 | A unit test runner runs with one npm script (`npm test`), and REPO.md `commands.unit` points at it | code | SGS-007 + human (REPO.md) | done |

### Delivery sequence

1. WOTR design doc (M1.1), acceptance harness (M1.3) and unit test runner (M1.10), in parallel. Then point REPO.md at the harness (M1.4).
2. `/api/fight` input hardening (M1.5).
3. Combat caps (M1.9).
4. Monte Carlo over N battles (M1.6).
5. Follow-up: document the API surface (M1.7).

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
