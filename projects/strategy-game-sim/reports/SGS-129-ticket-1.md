# SGS-129 ticket report

File: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-129-strict-typescript.md` (lint clean).

Summary: "Turn on `strict` in tsconfig". Component site, criterion M9.13, risk low, 0 business-logic lines, no dependencies, On merge none. Scope: set `strict: true` and drop the redundant `strictNullChecks` in `tsconfig.json`; typing-only fixes for the three TS7053 errors; update the `ARCHITECTURE.md` Stack sentence that states `strict: false`. Criteria cover tsc, next build, no suppressions or `any`, unchanged asserted values and test count, and docs.

Verified: in a throwaway detached worktree at `origin/main` (cdc51b1), `tsc --noEmit --strict` reports exactly three errors, all TS7053 on `FightOutcomes` indexing: `acceptance/fight-api-contract.spec.ts` (per-kind key loop), and two in `lib/combat-simulator/simulate.test.ts` (summarize custom-kinds test, outcome-classification table test). The worktree is removed. `git grep strictNullChecks` finds only `tsconfig.json` and `ARCHITECTURE.md`.

Diagrams: none required. Open questions: none (design question 11 on `combat-simulator.js` is settled by the design: stays unchecked). Overlap with other tickets: none. No graph rows added.
