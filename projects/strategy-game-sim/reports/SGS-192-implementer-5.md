# SGS-192 implementer 5 (Rework 1)

- Ticket: SGS-192, Rework 1 (review 4 blocking test finding). Test-only change.
- Branch: `sgs-192-wait-details`, tip `60eb68b5368dc0cb7f99cd56e1981276c8477f8f` (parent 7596bde).
- Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-192-wait-details`.
- `checkout.sh task` reused the checkout at 7596bde. There was no `origin/sgs-192-wait-details` ref before the call, so no own-commit check was needed, and the tip did not change.

## Files touched

- `lib/aoe4-build-order/simulate-wait-details.test.ts`: in `research details`, the missing-building table and a new busy-order test now use an edited `veteran-longbowmen.producedBy` of `['council-hall', 'archery-range']`. That order is out of code-unit order.
- Ticket: the three Rework 1 boxes are ticked.

## Tests

- `a missing building names every producing building in snapshot order` (and the `at` row, which shares the setup). The test first asserts that the edited `producedBy` equals `['council-hall', 'archery-range']` and is not equal to its sorted copy. It then expects `waitingFor` to be `building [Council Hall, Archery Range]`, `instance: null`. Invariant: the `building` detail keeps the `producedBy` order.
- `lists the busy candidates in candidate order` (new). The game starts in age 3 with an archery range, a council hall and no auto villagers. One step produces 3 longbowmen from the archery range and one produces 3 from the council hall. A research of `veteran-longbowmen` is triggered at 1 s. The test first asserts that both produce steps have `startedAt` `[0, 0]` and that the research step's `waitBreakdown.prerequisite > 0`. It then expects exactly one `waitDetails` entry: `building-busy [Council Hall, Archery Range]`, `instance: null`, `every: false`. Invariant: the busy detail lists the built candidates in candidate order.
- `research details` block: 6 passed. Full `npm test`: 89 files passed, 1 skipped; 2799 tests passed, 15 skipped, 0 failed.

## Mutation checks

| Break | Test that failed | Failing assertion | Undone |
|---|---|---|---|
| `research.ts` no-instance branch: `buildingWait(state, [...candidates].sort(), null)` | `a missing building names every producing building in snapshot order` | `simulate-wait-details.test.ts:175` `waitingFor` toEqual: received `[archery-range, council-hall]` | yes; `git diff` on research.ts is empty |
| `research.ts` busy branch: `candidates.filter(...).sort()` for `built` | `lists the busy candidates in candidate order` | `simulate-wait-details.test.ts:203` `onlyEntry(...).detail` toEqual: received `[archery-range, council-hall]` | yes; `git diff` on research.ts is empty |

The first attempt at the second mutation's Edit was denied by the permission classifier, and that run passed only because no mutation was in place. The retried Edit was allowed, and the table row above comes from that run.

## Pre-existing tests edited

- `simulate-wait-details.test.ts` "a missing building names %s": this test is in this branch's own new file, not in a pre-existing base test. Rework 1 required the change to its data and expectation.

## Doc claims

None added or changed.

## Stages

- lint (`npx tsc --noEmit && npm run lint:dup`): clean, 0 clones.
- build (`npx next build`): passed.
- codegen: not set.
- No acceptance or Playwright run (not this role's job).

## Invariant check

A1, A2 and A3 are unaffected: no production code changed.

## Unverified assumptions added

None.

## Out-of-scope findings

None new. Review 4's non-blocking notes still stand.

## Status

`needs_review`
