# SGS-202 spec gate (report 2)

**Verdict: NEEDS_SPEC**

Read at origin/main: `lib/aoe4-build-order/simulate.ts` (`houseDemand`, `startProduction`, `offerSteps`, `runInstant`, `runHousePass`), `docs/aoe4-build-order.md`, `lib/aoe4-build-order/README.md`, tests that mention `held`.

Checked and fine: scope names exist. The `startProduction` condition `!engine.held?.instances.has(instance)` is quoted correctly. Risk `high` is right (A3 order of operations, simulation rules). A2 and A3 are the right invariants. No open questions. No throwaway overlap found.

## Gaps

1. **Docs (item 11) - a third doc sentence goes untrue and is not in Scope.**
   - `docs/aoe4-build-order.md` ~line 550-553 (the `productionModifier` paragraph) says the positive-finite production-time check runs "when auto houses estimate supply demand, which covers every unit an instance holds an unfinished order for, even one not yet paid".
   - `houseDemand` calls `productionSeconds`, which throws for a bad time. Skipping held instances skips that check for them, so the sentence stops being true.
   - Scope names only the "Houses and supply" sentence and the README Houses bullet.
   - Fix: add this paragraph to Scope's docs list and require it to say a held instance's order is not estimated (so its time is not checked there). Or require `houseDemand` to keep validating the held instance's time and exclude only its rate. The ticket must pick one, since the code path differs. Add a test for whichever is chosen: a held instance whose order has a non-finite time either does or does not throw from the house pass.

2. **Testable criteria (item 2) - criterion 3 contradicts Scope on the first pass.**
   - Scope says `engine.held` is used as is, and the Cause note says that at the first pass it is the previous instant's value.
   - At the instant the hold ends, the first `runHousePass` therefore still excludes the instance. Only the second and third passes count it again.
   - Criterion 3 says the order "counts again from that instant" and that the case "includes the first pass", which an implementer cannot meet as written.
   - Fix: state the expected behavior exactly. For example: "the order is excluded in every pass while `engine.held` holds the instance, including the first pass of the instant the step starts, and counts from the second pass of that instant". Or: "the observable house start time equals X". The test must pin a house that becomes due at that instant, so the stale first pass versus a fresh second pass produces different results. Otherwise the criterion cannot fail for the first-pass part.
   - Also say whether the stale hold may delay a house start by one instant. If it can, that is a result the ticket must describe.

## Notes (non-blocking)

- Criterion 1 gives only a relation ("starts later than at the base"). It would be sturdier to also require the start to equal the start of an otherwise identical build where the held producer has no order. That gives a derived, non-guessed expected value.
- The LOC estimate and "Unverified assumptions: none" are fine (pure internal logic).
- Item 16 (hotspot): the one real hotspot is the stale `engine.held` at the first pass. Gap 2 is the fix. Once criterion 3 pins it to a test, there is no untested hotspot.
