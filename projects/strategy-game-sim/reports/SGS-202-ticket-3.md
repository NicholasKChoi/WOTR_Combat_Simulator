# SGS-202 ticket re-spec (report 3)

**Ticket**: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-202-house-demand-held-order.md (Re-spec 1, lint clean)

Read at origin/main bd0caf9: `lib/aoe4-build-order/simulate.ts` (`houseDemand`, `productionSeconds`, `startProduction`, `offerSteps`, `produce`, `runHousePass`, `runInstant`, `nextWake`), `engine-common.ts` (`instanceFree`), `docs/aoe4-build-order.md` (Queues, Houses and supply, `productionModifier` paragraph), `lib/aoe4-build-order/README.md`, `simulate.test.ts` production-time tests.

## Summary

"Leave a held instance's order out of the auto-house demand": Bug, aoe4-build-order, Milestone none, Priority low, Risk high, about 15 business-logic lines, no dependencies, Invariants A2 and A3. The criteria cover: the held order is left out (and the first pass excludes it), non-held and busy orders still count, the exclusion ends in the pass after the offer that starts the step, the production-time check still covers held orders, the doc updates, determinism, and no resources going negative.

## Gap 1 (production-time doc): resolved by keeping the check
- Decision: `houseDemand` still calls `productionSeconds` for a held instance's order, so a bad time still throws. Only the rate is left out of the sum. This keeps the `productionModifier` doc paragraph true, along with the existing test "checks the production time of an ordered villager that is never paid while auto houses plan supply".
- New criterion: a held instance whose order has a production time that is not a positive finite number throws while `autoHouses` is on, and does not throw while it is off. A mutation that skips held instances before computing the time must fail this test.
- Scope tells the implementer to confirm the `productionModifier` paragraph still reads correctly.

## Gap 2 (first pass vs criterion 3): resolved by stating the per-pass rule
- **Traced in the code:** only `offerSteps` writes `engine.held`, so each house pass reads the hold left by the latest offer:
  - pass 1 reads the previous instant's offer 2;
  - pass 2 reads offer 1;
  - pass 3 reads offer 2.
- **Why the pass-1 value is never stale:** a held step cannot start until a busy target frees. A target frees only when its completion event shifts `paid`, and events apply after offer 1. Reactions treat held instances as busy. So the step starts at offer 2 at the earliest. In that instant, passes 1 and 2 correctly exclude the instance, and pass 3 counts the new order.
- **The other way a hold ends:** a hold can also end at offer 1 when pass 1's house start or its house hold makes the step unaffordable. Then passes 2 and 3 count the order, which matches what `startProduction` sees.
- **No house is delayed:** in neither case is a house start delayed past the pass where the hold ends. Context now records this reasoning.
- **Criterion 3 (respec 1):** a test pins a house that becomes due only once the new order counts. The house must start at the held step's start time. A mutation that keeps the exclusion for the rest of the instant must make that test fail.
- **First-pass part, now in criterion 1 (respec 1):** the gate asked for a test where the first-vs-second pass difference changes a house start. That case cannot occur at the step-start instant, because pass 1's hold is current there. So criterion 1 now requires a case where pass 1 decides the house start, and a mutation that ignores `engine.held` in the first pass only must make it fail.
- **Gate note (non-blocking):** criterion 1 now pins the fixed engine's start, first asserts that the instance is held at the base start instant, and the report records the base and fixed starts.

## Diagrams
None. This is a single-component change outside the core control loop.

## Open questions
None.

## Overlap
None found. TASK-GRAPH shows no branch for SGS-202, so no branch work is affected.

## Checkouts
I made no scratch checkout. I ran no criterion commands because the criteria name tests to write, not existing commands.
