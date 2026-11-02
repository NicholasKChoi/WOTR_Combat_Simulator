# SGS-037 tech-lead gate 1

## Decision

NO BLOCKERS. Opened draft PR.

- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/46 - base `main`, head `sgs-037-aoe4-node-refs-warnings-depletion-module` @ d4c7cf175166400ef7092da9439bfbc5f5d02e38 (pushed; no new commits)

### Merge risk
**medium** - adds two required fields to the public `POST /api/aoe4-build-order/simulate` response and touches the critical-path `simulateBuildOrder`, but the change is additive, backward-compatible, and a revert undoes it.

### Review focus
No hotspots: the only runtime change is two constant empty arrays in the response, which the contract spec pins against the OpenAPI example. `depletion.ts` has no runtime caller yet, so a defect in it cannot reach a result in this PR.

## What was reviewed

- Range: 2049e95 (origin/main)...d4c7cf1, 3 commits (7db2324, 279bcf9, d4c7cf1), all authored by choinickolas@gmail.com. No ticket ids or PR numbers in the commit messages.
- 13 files, +922/-8. Reviewable business logic: +216/-0 (`depletion.ts` +167, `model.ts` +46, `simulate.ts` +3). Excluded: tests, `docs/api/openapi.json` (+255/-2) and docs prose (+10).
- Single task on main, so the stack check is trivial: the diff holds only this task. Stacking is `footer`, and a single PR needs no footer.

## Checks

- Invariants A1, A2, A3, S1, S3: no violations. No node amounts in code. `drawDown` clamps and snaps values within `RESOURCE_TOLERANCE` to 0. The module is pure with no clock or randomness. It imports only within the aoe4 app. `MAX_DEPOSITS` bounds deposits.
- Critical path: `git diff -W` shows that only `simulateBuildOrder` changed, and only its return literal (`depletions: []`, `warnings: sortWarnings([])`). The loop, payment and wake-time code are untouched.
- Contract: additive fields only. Existing consumers (`results.tsx`, `result-series.ts`, `api.ts`) read named fields and are unaffected. The OpenAPI `SimulationResult` is closed and now lists both fields as required, and the 200 example is updated.
- Import cycle: simulate -> depletion -> engine-common -> simulate is a type-only import (`import type { EngineState }`), so there is no runtime cycle.
- Irreversibility, concurrency, security: none.
- Open questions: CONTEXT.md has none, and the ticket answers none on its own authority.

## Non-blocking notes

- `recordRunOut` and `recordIdleArrival` call `stock.get(ref)` and then use `entry` without a null check. This is safe only because `isDepleted` returns false for an absent ref. If `strictNullChecks` is off, tsc will not catch a future reorder of that guard.
- `simulate.ts` returns `sortWarnings([])`, a sort of a constant empty list. It is kept on purpose as the single merge point for later warning sources.
