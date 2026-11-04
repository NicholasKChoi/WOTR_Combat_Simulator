## Summary
A deer pack in the AoE4 build order simulator now starts with 2450 food instead of 1750. The old figure came from 7 deer x 250 food, which was the wrong basis. The value is still marked unverified in the rules data. A run with no `nodeAmounts` override now reports a `deer` depletion entry with `amount` 2450. An explicit `nodeAmounts.deer` override still wins. None of the three shipped builds gathers deer, so no run-out time or step timing moves.

Out of scope: the other nodes' amounts, the deer gather rate and carry capacity, the engine code, and adding deer gathering to the shipped builds.

## Merge risk
**medium** - changes a default value that `/api/simulate` returns (a public surface). The response shape stays the same and a revert fully undoes the change.

## Review focus
No hotspots: this is one data value. `data.test.ts` (`node amounts`) and the new `aoe4-simulate-api-deer-pack.spec.ts` both fail if the value goes back to 1750. The engine reads the amount through unchanged code.

## Reviewer guide
Reviewable change: +4/-4 LoC (unit and acceptance tests excluded)
- [`data/aoe4-build-order/rules/base.json`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/101/files#diff-57c063ad02c25825837b4d01a351af60f2068f6e8da700349862ea718aab2242) - `gatherNodes.deer.amount` changes from 1750 to 2450 and gets a new source label. Check that no other field changed.
- [`docs/api/openapi.json`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/101/files#diff-fabc7f5cc7402ca31f120efff6f669fd4e6ec85cb6fb3cba7e4ddc6a225eb860) - both `/api/simulate` response examples now show deer `amount` 2450. Their `depletedAt` stays `null`.
- [`lib/aoe4-build-order/simulate-house-warnings.test.ts`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/101/files#diff-3422ebb3b129325d418f94e8115a00615d28a20b23f3bf28a1f9084c053238f8) - four timeline digests are re-pinned. Each digest hashes the depletions list, which includes the deer amount. Re-running the same runs with `nodeAmounts.deer` set to 1750 gives back the old digests, so the deer amount is the only thing that changed.

## Invariants and scope
Invariants touched: none. The amount still comes from the versioned rules data, and the engine code is unchanged.

<!-- cf-stack -->
### Stack

Merge bottom-up (this PR marked `->`):

- -> #101

🤖 Generated with [Claude Code](https://claude.com/claude-code)
