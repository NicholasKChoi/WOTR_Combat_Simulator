# SGS-154 spec gate 5

Verdict: NEEDS_SPEC (one gap, item 6(b)). Risk `low` stays correct (test-only, no critical path, no strongModelTrigger).

Method: `git fetch origin`; base origin/main 41b3ed3 (same as gate 4). Ran a throwaway vitest probe (`run` from `lib/aoe4-build-order/test-helpers.ts`, same engine and `resolveSimInputs` the route uses) in a detached worktree, now removed, at durations 1200 and 3600 for every `(respec 4)` rule. Items 2 to 5 and the Dropped list are unchanged since gate 4, which verified them at this same SHA; not re-run.

## Gaps

1. Item 6(b) (depletion-engine, idle-arrival) - "its `idleVillagers` is at least the produce `count` (use a count above 1)" is false for any count above 3 at the base. The `order` helper sets `autoHouses: false`, so the population cap limits villagers: start 6 sheep, `produce villager` with `rally: 'berry'`, `walkSeconds: 5`, `nodeAmounts: { berry: 0 }` gives the same result for count 2 and count 5: one `idle-arrival` row, `at` 25, `idleVillagers` 3, villager series last count 3 (probe, both horizons). With count 5 the rule "idleVillagers >= count" fails (3 < 5). An implementer told "a count above 1" may pick 5 or 10 and get a failing test, or read the cap as an engine bug. Count 2 (the deleted test's value) and 3 pass. Fix: state the produce `count` as 2 (an input, the deleted test's value) and make the precondition "the villager series' last count is at least the count", so a cap change fails with a message; keep `idleVillagers` between the count and the series' last count. Alternatively assert `idleVillagers` equals the villager series' last count (every villager produced after the rally is set walks to the dry node) and drop the count bound. Restate the Item 6 acceptance (b) clause the same way.

## Verified and holding at origin/main (probe results at 1200 s and 3600 s, identical)

- Item 1: one `villager` series in `unitsProduced`; start 6 sheep plus `produce villager x3` ends at 23 (at or above 3), never decreases; `times` length 241 at 1200 and 721 at 3600 equals `durationSeconds / sampleSeconds + 1`; `times[0]` 0, last equals `durationSeconds`; every `gatherRates` and `unitsProduced` series has `times` length; steps `['completed']`.
- Item 6(a): berry 601, `[PAUSE]`, villagers berry 3 and wood 3: `depletedAt` 365.0625 (not null, 0.0625 past a 5 s multiple); `gathered.food` rise 601 equals the stock; `floating.food` rise 501 plus `spent.villagers` rise 100 equals 601.
- Item 6(c): both-finite `gold#2` `depletedAt` 121.59999999999997, deposit-1-infinite 121.59999999999995 (difference far below 1e-6); `node` and `amount` equal; deposit 1 row `{ node: 'gold', amount: null, depletedAt: null }`.
- Item 7: villager series last count 43 (at least 40) at both horizons; `spent.villagers` 2150 = 43 x 50 (a whole multiple of the snapshot cost 50, equal to last count times cost so "at least" holds); `spent.buildings` 200 (positive, 4 x the house cost 50); `spent.military` 0, `spent.research` 0.

## Notes

- Item 7: the cost of a house is a data-snapshot `costs.total` (50) and villager 50; the spec-side helper (the existing `costOf` in the spend-population spec sums the four resources) gives the same values.
- The probe called the engine, not the HTTP route; the route passes the same inputs through `resolveSimInputs`, so differences are not expected.
- The remaining criteria wording for items 1, 6(a), 6(c), 7 needs no change.
