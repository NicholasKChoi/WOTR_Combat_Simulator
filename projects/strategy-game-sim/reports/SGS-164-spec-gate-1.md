# SGS-164 spec gate 1

**Verdict: READY**

## Checked
- Base origin/main: docs/combat-simulator.md has exactly three **Current code** notes (N, Independence, Outcome reporting) plus the intro lines 6-8. `git grep "Current code"` over docs, README.md, ARCHITECTURE.md, lib, components and pages hits only this doc.
- Code claims match the base:
  - `validateBattles` in pages/api/fight.ts defaults to `DEFAULT_BATTLES` and accepts a whole number from 1 to `MAX_BATTLES`, with a 400 otherwise.
  - `DEFAULT_BATTLES` is 1000 and `MAX_BATTLES` is 100000.
  - `simulateBattles` builds a fresh `BaseArmy` per side per battle.
  - `FightResponse` is in fight-api.ts and `OutcomeAccumulator.summary` is in simulate.ts.
  - `shouldStop`, `BattleOptions` and `OUTCOME_KINDS` exist in battle.ts.
- The other doc rules checked against fight.ts hold: the 10 regulars+elites cap, 5 leaders, at least 1 fighter, and the 400 on a negative or non-integer value. I found no other stale or planned-behavior statement. "Not modeled ... planned for a later release" is a scope statement, not a code note, and stays.
- Invariants W1 and W2 are named and not contradicted. Docs-only, Risk standard, no tests affected, no diagram trigger, On merge is `none`, no dependencies, no overlap with other tickets (I did not open TASK-GRAPH.md).
- Criteria are observable end-state checks. The only search criterion is over doc wording, which is allowed.

## Gaps
none

## Notes
- The intro rewrite is left to the implementer. A fine rule: keep paragraph 1, replace paragraph 2 with one sentence that each section states a rule the code follows.
- One cosmetic point: after the Independence note is removed, the "Outcome reporting" section ends with its Hits per round paragraph, and the blank-line spacing should be kept consistent.
