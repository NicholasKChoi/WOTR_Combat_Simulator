# SGS-163: Pin the first-arrival time in the idle-arrival acceptance test

- **Type**: Chore
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: low
- **Risk**: low
- **Invariants**: A3 (same build order and data give the same timings; the pinned `at` must be deterministic)
- **Unverified assumptions**: none
- **LOC estimate**: 20 (one test in `acceptance/aoe4-simulate-api-depletion-engine.spec.ts`; test-only, no business logic)
- **Depends on**: none
- **On merge**: none
- **Source**: BACKLOG.md item from `reports/SGS-154-acceptance-test-1.md` (mutation 2)

## Context

`docs/aoe4-build-order.md` says an `idle-arrival` warning is emitted at most once per ref, at the first arrival, and `idleVillagers` adds up every arrival; `lib/aoe4-build-order/depletion.ts:addIdleArrival` implements it (`at` kept from the first record). The acceptance test "produced villagers rallied to it add to a single idle-arrival warning" asserts only `arrivals[0].at > 0`, so a mutation that keeps the latest arrival's `at` instead of the first still passes (found by mutation in the SGS-154 acceptance run). The sum rule is already pinned (`idleVillagers` mutation fails the test).

### What the response allows

The response has no per-villager spawn time, so the exact first-arrival time cannot be computed from it. What the code gives (`lib/aoe4-build-order/simulate.ts`):

- `unitSeries`: `unitsProduced[].counts[i]` counts spawns at times `<= times[i]`; samples are `SAMPLE_SECONDS` apart (`result.sampleSeconds`). Only `spawnUnit` records units, so starting villagers are not counted. If `t1` is the first sample time with a villager count of at least 1, the first spawn lies in `(t1 - sampleSeconds, t1]`.
- `spawnUnit`: a villager reads its producer's rally at spawn time and arrives `walkSeconds / moveSpeedMultiplier` later, where `assignGatherers` on the dry node calls `recordIdleArrival` with that time. The request researches nothing, so the multiplier is 1 (the sibling move test already pins `at` equal to its `walkSeconds` through the same `moveSpeed` modifier in `engine-common.ts:villagerWalkSeconds`).
- `produce` handler: the step writes the rally to `berry` when it starts, and `runInstant` offers steps before `startProduction`, so a villager spawned after the step's `startedAt` walks to the berry.
- The produce step's `completedAt` is the last spawn, not the first, so it cannot pin the first arrival.

So the first arrival lies in `(t1 - sampleSeconds + walkSeconds, t1 + walkSeconds]`. When the villager count at `t1` is exactly 1, the second spawn is after `t1`, so every later arrival is after `t1 + walkSeconds` and falls outside the bracket. This bracket is the strongest pin the response allows.

## Scope

- Strengthen that test in `acceptance/aoe4-simulate-api-depletion-engine.spec.ts` so the warning's `at` is pinned to the first arrival, not the latest. Replace the `at > 0` assertion with the bracket from Context: `at` lies in `(t1 - sampleSeconds + walkSeconds, t1 + walkSeconds]`, `t1` read from the response's villager `unitsProduced` series and `times`, `walkSeconds` taken from the request's produce step (the existing `produce` object), `sampleSeconds` from the response.
- Before the bracket, the test asserts the data conditions the bracket depends on, so a tuning change that breaks them fails loudly instead of passing vacuously:
  - the first sample where the villager count reaches 2 is later than `t1` (the first two spawns fall in different sample intervals, so the first and second arrivals are provably distinct);
  - the produce step started no later than `t1 - sampleSeconds`, so the first villager spawned carries the berry rally.
- Compute every bound from response fields and request inputs; no hand-computed time literal (villager train time comes from snapshot data and goes stale).
- Test-only: no change to `depletion.ts`, `simulate.ts`, or any doc.

**Out of scope:** the other idle-arrival tests (the single-move test, the run-out-itself test, the zero-time test); product code; the unreachable `drawDown` clamp noted in the SGS-154 report.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] The test passes against unchanged product code.
- [ ] (respec 1) The test asserts the warning's `at` lies in `(t1 - sampleSeconds + walkSeconds, t1 + walkSeconds]`, with `t1` the first sample time at which the produced-villager count is at least 1, and every bound computed from the response and the request.
- [ ] The test fails when `addIdleArrival` keeps the latest arrival's `at` instead of the first's. The implementer applies that mutation temporarily, confirms the failure, reverts it before commit, and records the result in the report.
- [ ] (respec 1) The test fails if the first two villagers spawn within one sample interval (its precondition asserts the count first reaches 2 at a sample later than `t1`), and fails if the produce step starts after `t1 - sampleSeconds`.
- [ ] Pre-existing assertions of the test (single warning, severity, `idleVillagers` bounds) keep their meaning, and other tests in the spec are unchanged.
- [ ] `git diff --name-only` for the PR lists only the spec file.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-15

- Underspecified: the ticket said to derive the expected first-arrival time from the response, but the response has no per-villager spawn time, so an exact value is not derivable and the comparison was left to a guess.
- Changed: Scope and criteria now give the bracket `(t1 - sampleSeconds + walkSeconds, t1 + walkSeconds]` as the strongest pin the response allows, with preconditions that the first two spawns fall in different sample intervals and that the produce step starts before the first spawn's interval; Context records the code facts behind the bracket.
- Branch work: none known on a branch; the mutation and unchanged-test criteria stand as before.
