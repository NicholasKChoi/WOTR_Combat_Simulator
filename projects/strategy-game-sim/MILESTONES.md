# Strategy Game Simulator: Milestones

## M1: Foundations, plus a working WOTR Monte Carlo simulator

**Outcome:** The WOTR simulator has a design doc reviewers judge against, enforces the game's caps,
reports outcome frequencies over N battles, and is covered by an acceptance harness. The StarCraft
helper is frozen and out of this milestone.

### Exit criteria

| id | criterion | kind | covered by | status |
|----|-----------|------|------------|--------|
| M1.1 | `docs/combat-simulator.md` states the WOTR combat rules the simulator implements, input bounds, and outcome reporting | code | SGS-001 | done |
| M1.2 | `docs/starcraft-helper.md` (dropped: StarCraft helper frozen) | code | | dropped |
| M1.3 | An acceptance harness drives `/api/fight` over HTTP and the WOTR page and landing page with clicks, runnable by one command | code | SGS-002 | done |
| M1.4 | REPO.md `acceptanceHarness` and `commands.acceptance` point at the harness | ops | human (after SGS-002) | done |
| M1.5 | `/api/fight` accepts only POST, caps an army at 10 units, rejects 0-unit armies, and never returns NaN (S3) | code | SGS-003 | done |
| M1.6 | `/api/fight` runs N independent battles (default 1000, max 100,000) and returns outcome frequencies, round counts, and surviving units; the page shows them (W2) | code | SGS-005 | done |
| M1.7 | The API surface is documented and reviewable: request and response shapes written down and listed in CONTEXT.md Key surfaces | code | SGS-006 + human (CONTEXT Key surfaces) | done |
| M1.8 | StarCraft helper H1/H2 fixes (dropped: StarCraft helper frozen) | code | | dropped |
| M1.9 | Combat applies the published caps: at most 5 combat dice and the leadership-reroll cap, as written in `docs/combat-simulator.md` (W1) | code | SGS-004 | done |
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

## M2: AoE4 Build Order Simulator (English)

**Outcome:** A new app simulates an English build order and reports macro timings.

### Exit criteria

Confirmed by the owner 2026-10-30.

| id | criterion | kind | covered by | status |
|----|-----------|------|------------|--------|
| M2.1 | `docs/aoe4-build-order.md` defines the model, data sources, per-civ `CivRules` hooks, and outputs | code | SGS-013, SGS-025 | done |
| M2.2 | `data/aoe4-build-order/` holds an English-filtered aoe4world snapshot with its source commit and patch, plus a per-civ overlay whose hand-entered values each carry a source and an "unverified" label (A1) | code | SGS-014 | done |
| M2.3 | `lib/aoe4-build-order/` simulates a build order covering the v1 list in CONTEXT.md, including veterancy upgrades (they occupy the building's queue; units produced afterwards are the upgraded tier); unit tests cover A2 (no negative resources, waits in timings), A3 (determinism), builder scaling 3/(N+2), the gather trip model, a calculator cross-check of effective rates, and an upgrade delaying production and changing the produced tier | code | SGS-027, SGS-030, SGS-031, SGS-032 | open |
| M2.4 | The build-order input is a JSON model with tagged triggers (time = "not before", villager count) plus a line-based paste format that parses into it; unknown trigger kinds and unsupported techs are rejected with clear errors | code | SGS-026, SGS-028, SGS-029 | open |
| M2.5 | At least one prebuilt English build order in `data/aoe4-build-order/builds/` loads in the app | code | SGS-034 | done |
| M2.6 | `pages/apps/aoe4-build-order` graphs units produced (by unit and tier), gather rates, and floating resources over time, and is linked from `pages/index.js` | code | SGS-015, SGS-034 | done |
| M2.7 | If the design adds an API route, it is in `docs/api/openapi.json` and passes the contract check | code | SGS-033 | done |
| M2.8 | Playwright acceptance tests: paste a build order, run it, and see all three graphs | code | SGS-034 | done |
| M2.9 | CONTEXT.md Key surfaces and Design docs row, and INVARIANTS.md AoE4 Paths, updated from proposed to actual | code | manager On-merge | open |
| M2.10 | Precursor: the repo's npm dependencies (next, react, react-dom, typescript, @types/*, bootstrap, vitest, @playwright/test, ajv, classnames) are upgraded to current stable majors, with build, typecheck, unit and acceptance suites green and the WOTR and StarCraft pages unchanged in behavior | code | SGS-012 | done |
