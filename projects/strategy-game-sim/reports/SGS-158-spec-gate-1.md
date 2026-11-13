# SGS-158 spec gate 1

**Verdict: READY**

Checked against origin/main (git fetch was started; it ran in the background and I read the local origin/main ref).

## Checks
- Grounded scope: `calculateCombatRollResults`, `CombatRollOps`, `resolveRound` exist in `lib/combat-simulator/battle.ts`. The defect is as described (`opts.threshold || 5`, strict `>`). The doc lines (34, 36, 56, 57) match the quoted wording in `docs/combat-simulator.md`.
- Tests: `battle.test.ts` scripted rollers use only faces 1 and 6. The "rolls with rollDice when no roller given" test mocks Math.random at 0.99 (face 6) and still holds. The rollDice test is independent of the hit rule. `simulate.test.ts` uses hand-built records, so it is unaffected.
- Acceptance: `combat-simulator-battles.spec.ts` uses a synthetic mocked response and does not depend on the rule. The `fight-api-*` specs use loose ranges (lone defender p90 <= 2 and a 5-hit bucket > 0, mirror matches 0.3-0.7, tie and attacker counts > 0); all still hold at 1/3 per die. Scope already covers them with a rule (the implementer reports and edits only on a failure the rule explains).
- Invariants: W1 and W2 are named correctly. No criterion contradicts them.
- Risk high: the dice rule is a behavior change in the core output, so high is fine. Open questions: none; the owner confirmed the rule (Q89). On merge: `none`. Unverified assumptions: none is correct (no external service). Diagrams: none required. Input validation: not applicable. Dependencies: none. Overlap with other open tickets: none found in TASK-GRAPH.md.
- Docs: a grep found no other statement of the 6-only rule (README, openapi, UI) beyond the four doc lines in Scope.

## Gaps
None.

## Notes (non-blocking)
- Scope leaves a choice: fix `threshold` or remove it from `CombatRollOps`. Both are fine; removing the unused option is simpler, and the criteria are testable either way.
- Criterion 7 (measured lone-die hit rate) is a report item, not a test. That is acceptable, but review can only confirm it from the report. Expect 0.333 within sampling error.
- Criterion 5 is a doc-wording search, which is the permitted use of a search.
