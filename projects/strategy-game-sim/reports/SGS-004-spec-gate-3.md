# SGS-004 spec gate, pass 3 (after respec 2)

Verdict: READY

Checked against `origin/main` at 8532a0b (code repo `/home/choin/git/WOTR_Combat_Simulator`), the factory files, and SGS-005 and SGS-006 (both respec 2). Both lessons files are empty. Saved as `-3` because `SGS-004-spec-gate-2.md` already exists from an earlier pass.

## Checks

1. Grounded scope. Pass.
   - `rollDice`, `calculateCombatRollResults`, `CombatRollOps`, `CombatRollResults`, `BattleResult`, `BattleStats`, `Battle`, `FormParseResult`, `parseFightForm` and `handler` are in `pages/api/fight.ts`.
   - `Army` and `BaseArmy` are in `pages/api/models/army.ts`.
   - The `Results` import in `fight.ts` is unused, as stated.
   - `lib/combat-simulator/` is new, and the ticket says so.
   - `vitest.config.ts` includes `lib/**/*.test.ts`.
   - No `acceptance/` directory is on `main` yet. The ticket depends on SGS-002 and SGS-003 for it.
2. Testable criteria. Pass.
   - I hand-traced the scripted cases, and each matches the code as specified:
     - the `resolveRound` case with call counts 3, 2, 0, 0;
     - simultaneous casualties;
     - the `Battle` loop cases (8 calls, `"attack"`, `"n/a"`, `"defend"`);
     - the 7-elite trace 1/6, 0/6, 1/5, 0/5, 1/4;
     - the three unchanged casualty branches;
     - the leader-reroll cases.
   - The 5-die and hits criteria also hold.
3. Open questions. Pass. The one still open is about the doc's Current code notes. The owner has now closed it by accepting removal, and ARCHITECTURE.md line 40 supports that ("a change to an app's rules updates `docs/<app>.md` in the same PR"). The ticket should move it to the Resolved list.
4. Invariants. Pass. W1, W2 and S3 are named, and no criterion contradicts them. `docs/combat-simulator.md` on `main` states all three rules in "Round order" steps 1 and 3 and in "Casualties". It has both Current code notes that item 7 removes, and the "Fight to elimination" bullet that item 7 anchors to.
5. Contracts. Pass. The names the ticket introduces match what SGS-005 and SGS-006 consume (see the sibling table). CONTEXT.md does not list the module-level export names. It only records the extensibility decision, and that is enough.
6. Dependencies and size. Pass. The ticket names SGS-001, SGS-003 and SGS-007. About 245 lines is under the ~400 threshold.
7. Diagrams. Present, and they match the scope.
8. Lessons. Nothing applies.
9. Risk. `high` is correct. It touches W1 and the per-round loop, and it is over 150 lines. `criticalPaths` is empty.

## Sibling alignment (SGS-005, SGS-006)

| Shared name | SGS-004 | SGS-005 | SGS-006 |
|---|---|---|---|
| `Battle` signature | `(attack, defend, roll = rollDice, options: BattleOptions = {})` | identical | not used |
| `OUTCOME_KINDS` | `['attacker','defender','tie'] as const` | identical, used as the accumulator default | runtime constant, checked against `FightOutcomes.required` |
| `OutcomeKind` | `(typeof OUTCOME_KINDS)[number]` | consumed | `import type` |
| `battleOutcome(attack, defend)` | exported, throws when both sides are alive | classifies each battle | not used |
| `BattleOptions` | `{}` | passed through unchanged | no request field |
| `MAX_COMBAT_DICE`, `MAX_LEADER_REROLLS` | exported | named | not used |
| Roller call order | attack combat, defend combat, attack leader, defend leader | same order | not used |
| Per-round `console.log` | kept in `resolveRound` | removes it | not used |
| `docs/combat-simulator.md` | the only edit is item 7, which adds Extension points and removes two notes | no edit | adds only a link line, and only if the doc has merged |

No conflicts. SGS-004 is the only one of the three that edits rule-adjacent doc text. SGS-006's link line goes in a different place.

## Notes (non-blocking)

- Move the "Still open" bullet in the ticket to Resolved. The owner accepted removing the stale Current code notes, so delete the "if the owner prefers" clause too.
- Interaction with SGS-005: its line 134 may delete `getStats()` and `BattleStats` "if nothing else uses them". SGS-004's `battle.test.ts` asserts `getStats().survivor`, so SGS-005 must rewrite or drop that test, or keep `getStats`. Consider having SGS-004's tests assert `getSurvivor()` instead, and have SGS-005 say so explicitly. Neither is a gap for SGS-004.
- Commit-1 criterion wording: it says "no logic change apart from the roller parameter and import paths". `Battle` also changes from taking `FormParseResult` to taking `(attack, defend)`, which Scope item 2 implies. Add "and the `Battle` parameter list".
- Test setup latitude: the leader-reroll case needs 5 or more combat dice for m = 5. The "all 6s" and "dice all 1s, leaders all 6s" hits cases run later rounds that the script does not cover, so those tests should use `resolveRound` for round 1, not `Battle`. The ticket already allows `resolveRound`, and both are harmless.
- "`BattleOptions` has no fields" is only reviewer-checked. That is acceptable.
- CONTEXT.md Key surfaces says `BattleStats` is in `pages/api/fight.ts`. After this ticket it is in `lib/combat-simulator/battle.ts`. The manager can fix it when SGS-006 lands, since that ticket reworks the surface.
- After SGS-003 and SGS-005 the doc's other Current code notes (inputs, N, independence, outcomes) will be stale, because those tickets do not edit the doc. That is outside SGS-004. It would be worth a doc-sync follow-up, or a line in those tickets that applies the same rule.
