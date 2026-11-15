## Summary
The acceptance test "produced villagers rallied to it add to a single idle-arrival warning" only asserted `at > 0`, so an implementation that kept the latest arrival's time instead of the first still passed. The test now pins `at` to the first arrival: it must lie in `(t1 - sampleSeconds + walkSeconds, t1 + walkSeconds]`, where `t1` is the first sample time with a produced-villager count of at least 1, taken from the response, and `walkSeconds` comes from the request. Preconditions assert the data the bracket depends on (exactly one villager at `t1`, the second villager lands in a later sample, the produce step starts before the first spawn's interval) so a tuning change fails loudly. Test-only; no product code or docs change.

## Merge risk
**low** - test-only change in one acceptance spec; no public surface or `criticalPaths` symbol touched, and a revert fully undoes it.

## Review focus
No hotspots: test-only change; mutating `addIdleArrival` to keep the latest `at` makes the new assertion fail.

## Reviewer guide
Reviewable change: +13/-2 LoC (one test body, no generated code)
- [`acceptance/aoe4-simulate-api-depletion-engine.spec.ts`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/171/files#diff-febe0ff3f2ed5eae031c542b0c07369cc57c91f43f9b17652800475e1985f4da) - the bracket assertion replaces `at > 0`; verify the three preconditions and that bounds use only response fields and `produce.walkSeconds`.

## Invariants and scope
Invariants touched: none. Does not change the other idle-arrival tests or any product code.

<!-- cf-stack -->
### Stack

Merge bottom-up (this PR marked `->`):

- -> #171
