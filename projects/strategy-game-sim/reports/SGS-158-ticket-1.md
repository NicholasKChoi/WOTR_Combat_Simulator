# SGS-158 ticket report 1

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-158-wotr-dice-hit-on-5-or-6.md

Summary: Bug, wotr-combat-simulator, Milestone none, Priority high, Risk high (combat rules), about 5 lines of business logic, no dependencies, On merge none. ticket-lint.py passed with no output.

Root cause: `calculateCombatRollResults` in `lib/combat-simulator/battle.ts` uses `opts.threshold || 5` with a strict `thisDice > threshold`, so a 5 misses. All four roll paths in `resolveRound` (attack and defense combat rolls, both leader re-rolls) share it. Nothing caught it because every scripted test uses only faces 1 and 6; no test rolls a 5.

Scope: fix the comparison and threshold semantics (lowest hitting face, default 5, no falsy fallback); update `docs/combat-simulator.md` (step 2, step 3, and the two Mermaid nodes); add boundary tests in `battle.test.ts`.

Grep result for pinned 6-only text: none outside `docs/combat-simulator.md` and `battle.ts`. No test, acceptance spec, OpenAPI description, or UI text pins it. The ticket tells the implementer to re-grep and edit any that turn up. The statistical acceptance specs (fight-api-battles, fight-api-caps) use loose ranges and should still hold; they are flagged for acceptance-test to confirm.

Diagrams: none (single-component, no diagram required).
Open questions: none. Overlap with other tickets: none found. The siege-battle backlog item is later and builds on this fix.
