# SGS-164 ticket report

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-164-combat-simulator-doc-remove-stale-current-code-notes.md

Summary: Docs ticket, component wotr-combat-simulator, Milestone none, Risk standard (CONTEXT.md names docs/combat-simulator.md authoritative for the combat contract), about 25 doc lines, no dependencies, On merge none. Only `docs/combat-simulator.md` is touched. It removes three false **Current code** notes (Number of battles N, Independence of battles, Outcome reporting) and rewords the intro (lines 6-8) that introduces them. Each note is checked against `validateBattles` (`pages/api/fight.ts`), `simulateBattles` and `OutcomeAccumulator.summary` (`lib/combat-simulator/simulate.ts`), and `FightResponse` (`lib/combat-simulator/fight-api.ts`). The Extension points section was verified (`shouldStop`, `BattleOptions`, `OUTCOME_KINDS` exist in `battle.ts`) and stays. A grep for "Current code" over docs, code, and README found only this doc. Criteria: no Current code text, rules unchanged, no one-battle claims, flowchart unchanged, no code or openapi in the diff.

Diagrams: none (docs only).
Open questions: none. No decision is needed that code does not state.
Overlap: none with open tickets (SGS-158 dice change already merged; the doc already says 5 or 6).
Scratch checkout: none used. Lint: ticket-lint passed with no errors.
