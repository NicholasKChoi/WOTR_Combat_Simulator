# SGS-004 spec-readiness gate, pass 2

Verdict: READY

Checked against origin/main (d54af2e): `pages/api/fight.ts`, `pages/api/models/army.ts`, ARCHITECTURE.md "Existing code that predates this layout", tsconfig.json. Also read the SGS-001 and SGS-007 tickets, the sgs-007 branch commit (67ba9d8), TASK-GRAPH, CONTEXT.md, INVARIANTS.md, REPO.md, PROJECT.md, spec-checklist.md. Both LESSONS.md files are empty.

## Prior gaps

1. Statistical criteria that could not fail: CLOSED. Replaced by deterministic unit tests with a scripted roller. I hand-traced them against the current code: 10 vs 10 gets numDice 10 today (fails, as claimed); 10/5 vs 10/5 with all 6s records 10 hits today (fails, as claimed); 5 dice with all 6s gives 5 hits with 0 misses, so 0 leader dice, consistent with "5 hits".
2. Reroll cap untestable: CLOSED. The (m, leaders) table checks min(m, leaders); the cap of 5 is explicitly review-only with the reason (misses <= 5 once dice are capped), and the constant is named.
3. Elite downgrade had no observable: CLOSED. The trace 0/7 -> 1/6 -> 0/6 -> 1/5 -> 0/5 -> 1/4 matches `takeHit` run by hand (strength 7, 7, 6, 6, 5; the last step uses the <=5 branch). The other branch cases (5/0, 1/2, 1/0) are also correct. The exhaustive 1-10 check terminates and is satisfiable.
4. Test location and harness dependency: CLOSED. Depends on SGS-007 (Vitest, `lib/**/*.test.ts` included, tests next to code as `<name>.test.ts`; confirmed in SGS-007 and its branch). The SGS-002 harness comes through SGS-003. TASK-GRAPH dependsOn already lists SGS-007.
5. Doc source of truth: CLOSED. Preconditions section makes the merged doc the source and bounces rather than editing it. SGS-001 (re-specced) states all three rules as settled (dice cap, reroll cap, 0-regulars downgrade), so the precondition is satisfiable.

Also confirmed from the respec report: INVARIANTS.md, CONTEXT.md and REPO.md now list `lib/combat-simulator/**`.

## Checklist

- Grounded scope: every moved symbol exists (`rollDice`, `CombatRollOps`, `CombatRollResults`, `calculateCombatRollResults`, `BattleResult`, `BattleStats`, `Battle`, `Army`, `BaseArmy`). `lib/` does not exist on main and the ticket says the files are new. `isolatedModules: true` is present, so `export type { Army }` is correct. `pages/api/models/army.ts` has no default export on main, so the re-export keeps route behavior.
- Testable criteria: all have observable outcomes. See note 1 for one under-specified mechanic.
- Open questions: none block the main path. The remaining one is stale (note 3).
- Invariants: W1, W2, S3 named; no contradiction. The hit threshold and round order are explicitly unchanged.
- Contracts: no API, response or config names change. `MAX_COMBAT_DICE` and `MAX_LEADER_REROLLS` are internal constants, not CONTEXT.md contracts.
- Dependencies and size: stated; ~215 lines, mostly moved, under 400. The two-commit order is stated.
- Diagrams: present and consistent with the scope.
- Lessons: none apply.
- Risk: `high` is correct (W1 and the core loop trigger).

## Notes (non-blocking)

1. Scripted-roller behavior after the scripted round is not stated. A roller that returns all 1s forever (criteria 1 and the second hits-per-round case) makes `Battle` loop forever, because nobody is ever hit, and the same applies to the leader-reroll cases whose later rounds are unscripted. Suggested wording: "the scripted roller throws once its script is exhausted; tests assert on calls recorded before the throw", or use a script whose later rounds end the battle. An implementer will hit this at once, so it is not a blocker.
2. `pages/api/fight.ts` on main imports `Results` from `components/apps/combat-simulator/results` and never uses it. The Scope says fight.ts "shrinks to" the parse, validation and handler pieces; say explicitly to drop the unused `Results` import (a component import in an API route).
3. The "Still open" question on test-file location is settled by SGS-007 (tests next to code as `<name>.test.ts`, included via `lib/**/*.test.ts`). It can be marked resolved.
4. SGS-007 is still in review. If its runner changes before merge, the ticket's wording ("SGS-007's runner and naming") still holds.
5. Manager: TASK-GRAPH status for SGS-004 is `needs_spec`; move to `spec_ready`. SGS-005 (needs_spec) still needs a re-spec for the `Battle(attack, defend, roll)` signature and the lib location.
6. Gate for implementation start: SGS-001, SGS-003 and SGS-007 must be merged (Preconditions); SGS-001's branch is still in progress.
