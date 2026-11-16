# SGS-168 ticket report

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-168-combat-doc-not-modeled-claims.md

Summary: Docs ticket, component wotr-combat-simulator, Milestone none, about 4 doc lines, no dependencies, On merge none. It edits only `docs/combat-simulator.md`.
- Roadmap claim ("Support for them is planned for a later release", section "Not modeled"): cut the sentence. The code states only the leaders count (`army.ts` `BaseArmy.leaders`, `battle.ts` `resolveRound`, `MAX_LEADER_REROLLS`). The roadmap lives in PROJECT.md Out of scope. The "not modeled" fact stays.
- Performance claim ("completes within 10 seconds" for N = 100,000): the sentence sits in section "Number of battles N", not "Not modeled". Cut it. No test, acceptance spec, or design doc measures it. `MAX_BATTLES` and `DEFAULT_BATTLES` in `simulate.ts` back the cap and default, which stay.
- The ticket also tells the implementer to scan the doc for other future-tense or timing claims. A grep found no copy of either claim elsewhere in docs, README, ARCHITECTURE, or app.

Risk is standard, not low, because CONTEXT.md names this doc authoritative for input bounds and the other combat contracts. No diagrams. Lint passes. Open questions: none. No owner decision is needed, since the default (cut what code does not state) applies to both claims. No overlap with open tickets was checked beyond the grep above. No scratch checkout was made.
