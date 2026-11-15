# SGS-163 spec gate 1

**Verdict: NEEDS_SPEC** (one gap, small, not owner-only)

## Gaps

1. Scope / Acceptance criteria - the ticket says to "derive the expected first-arrival time from response fields and the request's inputs", but the response exposes no per-villager spawn time. `unitsProduced[].counts` is a cumulative count sampled every `SAMPLE_SECONDS` (5 s, `lib/aoe4-build-order/simulate.ts`). The `produce` step's `completedAt` is the last spawn, not the first. The real arrival time is `spawn + walkSeconds / moveSpeedMultiplier` (`spawnUnit`, simulate.ts ~L362), and spawns fall between samples. An exact expected `at` cannot be computed from the response, so the implementer must guess the comparison. Examples: an exact match (flaky or impossible), a tolerance of their own choosing, or one that cannot tell the first arrival from the second when the sample step is coarse.
   Proposed fix: state the rule. The first villager is spawned in the first sample interval where the villager count rises above 0, and the next villager in the first interval where it reaches 2 or more. Arrival is spawn + `walkSeconds`; the request does not change `moveSpeed`, so the multiplier is 1.
   - Precondition: assert that the sample where the count first reaches 2 is later than the sample where it first reaches 1 (a spawn gap larger than one sample). Otherwise the arrivals are not provably distinct.
   - Pin: `at` lies in `(t1 - sampleSeconds + walkSeconds, t1 + walkSeconds]`, where `t1` is the first sample time with count >= 1. That interval lies strictly before the second arrival's interval, so a later `at` falls outside it.
   - State that the bracket is the strongest pin the response allows. The unit-level mutation (latest `at`) is then caught by the bracket, not by an exact value.
   - Keep the mutation criterion as written; the bracket and precondition make it satisfiable.

## Checks passed

- Grounding: `addIdleArrival` (depletion.ts L111, `record?.at ?? at`) and the test at spec L119-134 exist and match the ticket's quotes (`at > 0` is the current assertion).
- Mutation: the mutation can fail the test, since the persistent rally produces more than one arrival (the existing comment at L131 says so).
- Invariants: A3 is named and fine. Risk is low, the change is test-only, and no doc is made stale. Open questions: none. Unverified assumptions: none is right, because the test runs the real engine through the API.
- Test dependence: the change is to one test; no other test depends on it.

## Notes

- Do not give a hand-computed `at` literal. The villager train time comes from snapshot data and goes stale.
- The existing assertion `idleVillagers <= villagers` is unaffected.
