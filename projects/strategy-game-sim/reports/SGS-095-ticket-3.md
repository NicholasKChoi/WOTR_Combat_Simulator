# SGS-095 ticket 3 (re-spec 2)

File: projects/strategy-game-sim/tickets/SGS-095-test-hygiene-followups.md

## Summary
SGS-095 is "Fix four test-hygiene follow-ups". It is a test-only change in aoe4-build-order and combat-simulator: 0 business-logic lines and about 40 lines of test and helper edits. It has no dependencies and branches from origin/main. This re-spec closes the one blocking gap from spec gate 2 and folds in its note.

- **Criterion 2 (respec 2).** I checked origin/main `lib/aoe4-build-order/simulate.ts`. The `rally` handler writes the rally and completes the step at once, at no cost. `addBuildingInstance` falls back to `start.rally`. The build's own step rallies `capital-town-center` to `wood` at 20 s, which overwrites rallyDefaults. The schema accepts a rally on a villager producer with no trigger.
  - So the named step is `{ "action": "rally", "producer": "capital-town-center", "to": "sheep" }`, inserted first. It should change no timing.
  - The criterion also states the property: other timings stay unchanged and the men-at-arms index goes up by one.
  - It requires the spec to pass on the mutated build with this ticket's change and to fail its men-at-arms timing tests on origin/main.
  - The report must record the exact step JSON and both results. If the named step moves any timing, the implementer uses another step and says why.
- **Item 4 and criterion 6 (respec 2).** The 'Fight! with 10/0/5 vs 0/10/5 renders the Army Results table' test in `acceptance/fight-api-caps.spec.ts` is now a fourth caller of the helper. `openPage`'s `networkidle` in `acceptance/helpers.ts` is listed as out of scope.
  - Criterion 6 now says: `git grep -n networkidle -- acceptance/` finds only the `openPage` line, and `git grep -n "goto('/apps/combat-simulator')" -- acceptance/` finds only the helper.
  - I ran both greps on origin/main. Today they find the four call sites that Scope moves, plus `openPage`.

## Diagrams
None. The ticket keeps its "no diagram required" line.

## Open questions
None.

## Overlap
None found.
