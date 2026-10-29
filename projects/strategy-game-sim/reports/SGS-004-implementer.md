# SGS-004 implementer report

- Ticket: SGS-004 (WOTR combat caps, move to lib/combat-simulator, round step + loop)
- Branch: sgs-004-wotr-combat-caps, base origin/main 006c553
- Tip SHA: c53942c
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-004-wotr-combat-caps
- Commits (all authored choinickolas@gmail.com, not pushed):
  1. 11a5e74 Move WOTR battle logic and army model to lib/combat-simulator (pure move + roller param + Battle(attack, defend, roll = rollDice) parameter list)
  2. 8e7d690 Split Battle into a round step and a stop-checked loop (resolveRound, shouldStop, BattleOptions, OUTCOME_KINDS/OutcomeKind, battleOutcome, getSurvivor via Record<OutcomeKind, string>)
  3. c53942c Cap WOTR combat dice and leader rerolls at 5, fix elite-only casualties (caps, takeHit downgrade, unit tests, ARCHITECTURE.md bullet, doc edits)

## Files touched
- lib/combat-simulator/army.ts: new; Army/BaseArmy moved verbatim (commit 1); takeHit `> 5` branch downgrades an elite when regulars is 0 (commit 3).
- lib/combat-simulator/battle.ts: new; BattleResult, BattleStats, DiceRoller, rollDice, combat-roll helpers, Battle moved (commit 1); resolveRound/shouldStop/BattleOptions/outcome kinds (commit 2); MAX_COMBAT_DICE, MAX_LEADER_REROLLS and the two Math.min edits (commit 3). Only import is ./army.
- pages/api/fight.ts: thinned to FormParseResult, validation, parseFightForm, handler; calls Battle(form.attackArmy, form.defendArmy). Dropped the unused `Army` import (see note below on `Results`).
- pages/api/models/army.ts: now `export type { Army }` + `export { BaseArmy }` from lib/combat-simulator/army.
- lib/combat-simulator/army.test.ts: new, 6 tests.
- lib/combat-simulator/battle.test.ts: new, 23 tests.
- ARCHITECTURE.md: rewrote the WOTR bullet under "Existing code that predates this layout".
- docs/combat-simulator.md: removed the two Current code notes (dice/reroll caps under Round order; negative regulars under Casualties); added `### Extension points` at the end of "Departures from the published game". No rule text changed.

## Tests
`npm test`: 3 files, 33 passed, 0 failed (4 pre-existing utils tests + 29 new).
Before applying the commit-3 behavior change, the new tests were run against commit 2: 5 failed exactly where expected (7-elite downgrade trace, exhaustive no-negative check, 5-dice cap, both 5-hits-per-round tests), 28 passed.
Invariants and criteria encoded:
- Combat dice cap: 10v10 -> first two calls get 5; 3+2 -> 5; 3 -> 3.
- Leader rerolls: third call gets min(m, leaders) for (5,5)->5, (5,2)->2, (3,5)->3, (0,5)->0.
- Hits per round: all-6s whole battle (10/0/5 v 10/0/5) records 5 in round 1 and no entry > 5; combat 1s + leader 6s gives 5 per side, all from rerolls.
- resolveRound: exactly one round (calls 3,2,0,0; rounds 1; hits [2]/[1]; armies 2/0 and 0/0; script has 4 entries so a 5th call throws); simultaneous casualties (1v1 both 6 -> both 0/0, 1 hit each).
- shouldStop: false both alive; true for either side at 0; true both at 0.
- battleOutcome: attacker/defender/tie values, each in OUTCOME_KINDS; throws when both alive.
- Battle loop: 2-round attack win with exactly 8 calls; tie -> "n/a"; defender win -> "defend"; Battle(attack, defend) with no roller uses rollDice (Math.random mocked to 0.99 -> tie in 1 round).
- rollDice maps Math.random to faces 1-6 (mocked).
- Casualties: 0/7 trace 1/6, 0/6, 1/5, 0/5, 1/4; 6/0->5/0; 0/3->1/2; 2/0->1/0; dead army ignores hits; every army of 1-10 units (all regular/elite splits, 3 leaders) never goes negative, ends 0/0, leaders unchanged (hit loop bounded by 2*units so a regression cannot hang).
- Scripted roller throws when its script runs out or an explicit face list length mismatches numDice. console.log is stubbed in battle tests; no test depends on real randomness.

## Gates
- codegen: not set in REPO.md.
- build: `npm ci && npx next build` passed on c53942c.
- lint: `npx tsc --noEmit` clean on commits 1, 2 and 3.
- unit: `npm test` 33/33.
- acceptance: `npm run acceptance` 91/91 passed on commit 2 (8e7d690) and on the final commit (c53942c), with no spec files changed.
- `GET /api/models/army` under `next dev`: 500 on base 006c553, 500 on c53942c (same; the file has no default export on both).
- Manual fight 0/10/5 vs 10/0/5 via curl: base returned attacker regulars -4 (the defect); branch returned non-negative counts (e.g. 1/5) across 3 runs.
- Not done by me: clicking Fight! in a browser by hand. The acceptance specs `combat-simulator.spec.ts` and `combat-simulator-validation.spec.ts` (submit renders results) passed, which covers the render path, but the specific 10/0/5 vs 0/10/5 click is left for the reviewer.

## Invariant check
- W1: caps match doc Round order steps 1 and 3 (min(r+e, 5), min(misses, leaders, 5)); downgrade matches the Casualties section; hit threshold (> 5) and round order (attack combat, defend combat, attack leader, defend leader, simultaneous takeHits, recordRound) unchanged.
- W2: Battle still runs on the two armies the handler builds per request; no shared state added.
- S3: shouldStop ends every battle on elimination; each round removes or downgrades units, unchanged termination behavior.
- S1: lib/combat-simulator imports only ./army (tests import vitest and local modules).

## Notes / deviations
- The ticket says to drop an unused `Results` import from pages/api/fight.ts. On 006c553 there is no `Results` import; the unused import was `Army` from ./models/army. I dropped that and import only BaseArmy.
- BattleOptions is introduced in commit 2 (with the other seams), not commit 1; commit 1 carries only the roller parameter and the (attack, defend) parameter list.
- The MAX_* constants carry a one-line comment saying they are separate from takeHit's army-size threshold of 5 (a reader would otherwise merge them). BattleOptions carries the one comment the ticket asks for.

## Out-of-scope findings
- SGS-009 (in progress) also edits docs/combat-simulator.md (input bounds Current code note). Different section from this ticket's edits, but expect a textual merge if both land; whichever merges second should rebase.
- worktree creation: `git worktree add -b` failed on `.git/config.lock` (sandbox-held device node) after creating the branch; the worktree was then added for the existing branch. No upstream tracking is configured for the branch.

## Status
needs_review
