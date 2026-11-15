# SGS-163 spec gate 2

**Verdict: READY**

The gate-1 gap (no per-villager spawn time in the response) is closed by the bracket rule and its two preconditions. I read the code at origin/main.

## Checks

- Grounding: the test (`acceptance/aoe4-simulate-api-depletion-engine.spec.ts`, "produced villagers rallied to it...") and `addIdleArrival` (`depletion.ts`, `record?.at ?? at`) match the ticket. `SAMPLE_SECONDS = 5`, `sampleSeconds` in the result, and the `Result.steps[].startedAt` field all exist.
- Bracket is sound, read from `simulate.ts`:
  - `unitSeries` counts changes with `time <= t`, and only `spawnUnit` records units.
  - `spawnUnit` schedules arrival at `time + walkSeconds / moveSpeed`. The rally walk comes from the produce step's `walkSeconds`, written by the `produce` handler when the step starts. The request has no research, so the multiplier is 1.
  - `assignGatherers` on a dry node calls `recordIdleArrival` with that time.
  - First spawn is in `(t1 - 5, t1]`, so the first arrival is in `(t1 - 5 + walk, t1 + walk]`.
  - Precondition "count first reaches 2 after t1" implies the count at t1 is exactly 1. Every later spawn is then after t1, so every later arrival is after `t1 + walk`, outside the bracket. The latest-`at` mutation therefore fails the test.
  - The strict lower bound holds because the count at `t1 - 5` is 0.
- Testable criteria: no hand-computed literals, no stale lists. Existing tests are unaffected; only one test changes.
- Invariants A3, risk low, no docs made stale, open questions none, unverified assumptions none (real engine through the API): all fine.
- Size, diagrams, On merge, input validation: fine for a test-only change.

## Notes

- Compare `at` with the open lower bound (`toBeGreaterThan`) and the closed upper bound (`toBeLessThanOrEqual`). Float addition in the engine can put `at` a ulp from an edge only at a boundary that the two-interval preconditions already keep away from in practice, so no tolerance is needed.
- Fail loudly if the villager series lookup is undefined (the existing test already uses `!`).
