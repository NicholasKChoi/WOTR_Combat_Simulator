# SGS-202 spec gate (report 4)

**Verdict: READY**

Read at origin/main: `lib/aoe4-build-order/simulate.ts` (`houseDemand`, `startProduction`, `offerSteps`, `runInstant`, `runHousePass`, `productionSeconds`, `produce` handler), `docs/aoe4-build-order.md` (Queues, Houses and supply, productionModifier paragraph), `lib/aoe4-build-order/README.md`, test greps for `held`/`autoHouses`.

## Checks

- Grounded scope: every named function, doc paragraph and test (`simulate.test.ts` line 734, "checks the production time of an ordered villager that is never paid...") exists. The quoted `!engine.held?.instances.has(instance)` matches `startProduction`.
- Pass-order trace in Context matches `runInstant` (house, offer, events, house, offer, startProduction, house). `engine.held` is reset in `offerSteps` and set only on a blocked step with a non-empty `hold`; `hold` is set only in the busy-target branch of `produce`, after the supply and resource checks. Passes 1 and 2 reading the previous hold and the offer-1 hold, pass 3 reading the offer-2 hold, is correct. The "no house delayed past the pass where the hold ends" claim holds.
- Gaps 1 and 2 from report 2 are closed: Scope keeps the `productionSeconds` call for held instances with a throw test (criterion 4), and criterion 3 now states pass 1/2 exclude and pass 3 counts, with mutations that fail.
- Docs: the only stale statements are the Houses and supply "combined rate of every producer with an order" sentence (doc line 346-347) and the README `held` bullet; both are in Scope. The productionModifier paragraph stays true. No other doc or comment (`houses.ts`) describes the rate sum.
- Criteria are behavior-based, no pinned counts or lists; existing tests handled by rule, not by list. Risk `high` is right (simulation order of operations, A3); hotspots (stale first-pass hold, skipped time check) each have a failing test criterion. Invariants A2/A3 are right. No open questions, no dependencies, no throwaway overlap, On merge `none` valid, Unverified assumptions `none` valid (pure internal logic).

## Notes (non-blocking)

- Criterion 4's setup needs a held order whose bad-time unit is never paid (otherwise `startHead` throws with `autoHouses` off too and the on/off contrast fails). The existing test at `simulate.test.ts:734` is the pattern to copy.
- Criterion 1 could also compare against an otherwise identical build whose held producer has no order, as a derived expected value.
