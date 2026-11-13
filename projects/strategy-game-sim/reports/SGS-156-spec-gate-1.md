# SGS-156 spec gate 1

Verdict: NEEDS_SPEC

Read at origin/main after `git fetch origin`. The fetch printed `failed to run reflog` and `task 'gc' failed`; the refs I read were not affected.

## Checks that pass

- Grounded scope: `planAutoHouse` and `HouseDemand` (houses.ts), and `startAutoHouses`, `houseDemand`, `houseBuilderSource`, `orderNeed`, `payOrder`, `offerSteps`, `runInstant`, `nextWake`, `incomePerSecond` (simulate.ts) all exist. The `produce`/`build` handlers are in simulate.ts and `research` is in research.ts. The named tests exist: "wake when the house becomes affordable", "ignore a waiting step reserve", and "pays the research while an auto-house is building". So do the four Playwright specs: house-gate, house-rule, waits, spend-population.
- Quoted facts match the code. `startAutoHouses` runs last in `runInstant` and reserves nothing. Auto-houses do ignore `engine.reserve`. Docs lines 309-334 say what the ticket claims.
- Risk `high` is right. `runInstant`, `orderNeed` and `nextWake` are critical-path symbols.
- Invariants A2 and A3 are named, and the ticket does not contradict them.
- On merge `none` and Unverified assumptions `none` are fine. The engine is pure and nothing external is faked.
- Open questions: none.
- Docs: Scope 5 covers `docs/aoe4-build-order.md`. The openapi `autoHouses` description stays true.
- Tests: Scope 6 states a rule, not a list. `houses.test.ts` has a closed-export test, but extending `HouseDemand` does not change the export names.
- No other open ticket overlaps. Size is about 180 LOC.

## Gaps

1. **Scope 1, due rule, the window is unclear.**
   - What is missing: "positive within lead plus gather time" does not say whether `lead + G` also widens the `arriving` filter (`completesAt <= time + lead`). It does not say whether the population projection is `populationPerSecond * (lead + G)`.
   - Why an implementer guesses: both readings fit the text and give different due times. Criteria 2 and 3 and the fixture depend on the choice.
   - Fix: state the formula. For example, `shortfall = population + rate*(lead+G) - (supply + supply of pending that complete by time+lead+G)`. Also state that `G = 0` reproduces the old planner exactly, including the `arriving` window.

2. **Scope 1 and 2, more than one due house.**
   - What is missing: `planAutoHouse` returns a count. The ticket never says what is held when the count is 2 or more (one house cost or count times cost). It does not say which cost `G` uses (one house or all). The ticket only calls "how many houses" out of scope, which is a different question.
   - Why an implementer guesses: the hold amount changes which steps and orders wait.
   - Fix: pick one. For example, hold and gather-time cover the houses that `startAutoHouses` would start now (count times cost, limited by builders). Or hold one house only. Either way, say so.

3. **Scope 2 and 3, when the hold is computed.**
   - What is missing: `engine.reserve` is reset at the top of `offerSteps`, and the hold feeds the first and second `offerSteps` and `startProduction`. The ticket does not say where the due-house plan is re-evaluated. Candidate points are before the first `offerSteps`, after `applyDueEvents` (population and builders change there), and after the final `startAutoHouses`. The hold from that last evaluation is the one `nextWake` reads.
   - Why an implementer guesses: A3 timings depend on this.
   - Fix: state that the hold is recomputed from current state at the start of the instant, after `applyDueEvents`, and after the final pass. `nextWake` uses the last value.

4. **Scope 2, how the hold applies to a step.**
   - What is missing: `orderNeed` adds the reserve only to resources the unit costs. For steps, the text says "would take the bank below the house cost". It does not say whether the check covers only the resources the step spends, or all of them. The plumbing is also vague: the handlers receive `EngineState` and call `canAfford(state.resources, cost)` directly. "A handler registered through stepHandlers sees the same bank" does not say how (new state field, helper, or an adjusted bank).
   - Why an implementer guesses: a food-only step should not wait on a wood hold, and `payCost`/A2 behavior must stay exact.
   - Fix: say "per resource, only where the step's cost is positive, mirroring `orderNeed`". Say the hold is a field on engine state read through one shared affordability helper. State that `reserve` and `payCost` still use real amounts.

5. **Scope 2 and `nextWake`, the due-flip wake.**
   - What is missing: `G` shrinks as the bank grows. A house can stop being due with no event, which releases the hold. Waiting payments wake only when `bank >= cost + hold`, which can be later than the release. Which wake times apply is not stated: affordability of the hold only, or also the instant the house stops being due.
   - Why an implementer guesses: this changes wake times, and with them every timing (A3).
   - Fix: say whether a due-flip wake is required. If not, say that the held payment's wake and the sample times are the only wakes and that release takes effect at the next instant.

6. **Criterion 7 (no wood income) is vague.**
   - Current text: "an order with no wood income finishes its run without a step or order stuck on the hold".
   - Rewrite: with zero wood income and wood below the house cost, a wood-costing step and a non-villager order each pay as soon as the bank meets their own cost (plus the waiting step's reserve for an order). No house hold is applied.

7. **Criterion 1 observability.** "TC supply-capped" needs a defined test signal. The ticket should say the TC is capped when the order has a villager pending and `population + popcap > supply` at an instant, or equivalent. Name the signal in terms of behavior, such as the villager series gaps or the timings' `population` wait, not an engine field.

## Notes

- Scope 1 says a zero-income short resource makes the house "not due". Scope 2 and 4 now reconcile this with the builder hold. That is consistent.
- The flip-flop (due, not due, due) caused by `G` shrinking and then growing again after steps spend wood is allowed by the rules. Consider stating it is intended, to head off an implementer adding hysteresis.
- `simulate-house-gate.test.ts` ("auto-houses at 120, 220 and 320 s") pins exact house times for a no-house-step order. It is likely to shift and is covered by the Scope 6 rule. Also check `simulate-construction.test.ts` "project the demand at the modified production speed" and the `paces auto-houses` test in `research.test.ts`.
- Grep found these dependents of the old timing, subject to the Scope 6 rule: `simulate-house-gate.test.ts`, `simulate-construction.test.ts`, `research.test.ts`, `build-move.acceptance.test.ts`, and the acceptance specs house-gate, house-rule, waits (line 94, `autoHouses: true`), spend-population ("counts an auto-house under buildings") and triggers (line 249).
