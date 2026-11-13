# SGS-156 ticket 3 (re-spec 2)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-156-aoe4-auto-houses-plan-ahead-for-wood.md
Lint: `ticket-lint.py` passes (exit 0, no output).

## Summary

The ticket is still "Auto-houses plan ahead for wood and hold their cost back from steps and orders", in component aoe4-build-order. It is a Bug, standalone, Risk high, and depends on nothing. The size estimate went from 180 to about 220 business-logic lines, still under 400, so no split. All seven blocking gaps from spec-gate-1 are folded in, as Re-spec 2:

1. **Formula (Scope 1).** `G` is the gather time of one house's cost: the largest of `max(0, cost - real bank) / current income` over the cost's resources. The window `W = lead + G` replaces `lead` in two places: the pending-headroom filter (`completesAt <= time + W`) and the population projection. With `G = 0` the planner is exactly today's, `arriving` window included. A short resource with zero income makes the house not due. Due-state flip-flop is intended, with no hysteresis.
2. **Amount held (Scope 2).** The hold is one house's cost while any due house is not started, whatever count the planner returns.
3. **When it is computed (Scope 3).** One house pass plans, starts, and sets the hold. It runs three times per instant:
   - after `collectRunOuts`, before the first `offerSteps`;
   - after `applyDueEvents`, before the second `offerSteps`;
   - after `startProduction`.

   The hold is a separate field, so the reset of `engine.reserve` in `offerSteps` does not clear it. It stays constant between passes. `nextWake` reads the value the last pass left.
4. **Where it applies (Scope 4).** The hold is a field on `EngineState`, read through one shared helper that replaces the direct `canAfford` calls in `produce`, `build` and `researchHandler`.
   - It applies only per resource where the payment's cost is positive, mirroring `orderNeed`.
   - Non-villager orders need cost plus step reserve plus hold.
   - The `reserve` outcome and `payCost` keep using real amounts.
   - Explicit `build house` steps skip the hold.
5. **Wakes (Scope 5).** In `nextWake`, step needs (the cursor reserve and reaction needs) include the hold. No wake is added for the moment a house stops being due; the release takes effect at the next wake the loop already has.
6. **No-income criterion.** Rewritten in behavioral terms, per the gate's proposed text.
7. **Supply-capped criterion.** The fixture criterion now uses the villager unit series: the count never stays flat longer than one villager production time plus one sample interval, from 9:30 to 15:00. Its preconditions are asserted first: food stays above a villager's cost and villagers stay under the target.

New `(respec 2)` criteria:
- A pending building that completes after the lead but within the window counts toward headroom.
- A one-house hold when two or more houses are due.
- A held step wakes at the exact instant it can pay, not at a later sample.
- A house made due by events applied in the instant holds its cost from the second offer.
- Reaction steps are held, and a step that spends none of the house's resources is not held.

The Q88 builder-hold decision is kept unchanged (respec 1 text). Scope 8 now lists, as examples, the likely-affected tests and specs from the gate notes:
- unit tests: `simulate-house-gate.test.ts`, `simulate-construction.test.ts` (including the "project the demand at the modified production speed" test), `research.test.ts` (`paces auto-houses`), `houses.test.ts`, `build-move.acceptance.test.ts`;
- Playwright specs: house-gate, house-rule, waits, spend-population, triggers.

## Diagrams

One Mermaid read/act/record flowchart of `runInstant`, updated to show the three house passes, where the hold applies to payments, and the `nextWake` needs.

## Open questions

none

## Overlap

None found. No branch or worktree exists for SGS-156, so no branch work is affected.

## Notes for the manager

- The planner now computes income inside the instant (`incomePerSecond` over `gatherRatesOf`) up to three times per instant. This may cost some speed. The ticket does not dictate how to do it.
