# SGS-004 re-spec report (re-spec 1, 2026-10-28)

Ticket: tickets/SGS-004-wotr-combat-caps.md (rewritten; ready for the spec gate)
Inputs: reports/SGS-004-spec-gate.md (gaps 1-5); CONTEXT.md Decisions ("Testing", "`/api/models/army`", "WOTR caps", "WOTR casualties"); ARCHITECTURE.md on origin/main d54af2e; `pages/api/fight.ts` and `pages/api/models/army.ts` on origin/main.

## Summary

The new title is "Move WOTR battle logic to lib/combat-simulator and apply the combat dice and leadership-reroll caps". The component is wotr-combat-simulator, and the risk stays high.

Code changes:
- `Army`/`BaseArmy` move to `lib/combat-simulator/army.ts`.
- `rollDice`, `calculateCombatRollResults`, `BattleResult`, `BattleStats`, and `Battle` move to `lib/combat-simulator/battle.ts`.
- `Battle(attack, defend, roll = rollDice)` takes an injectable dice roller. The per-round call order is preserved (attack combat, defend combat, attack leader, defend leader).
- Two constants are added: `MAX_COMBAT_DICE = 5` and `MAX_LEADER_REROLLS = 5`.
- `takeHit` gains the downgrade: with more than 5 units and 0 regulars, an elite becomes a regular.
- `pages/api/fight.ts` becomes a thin handler. The response shape is unchanged.
- `pages/api/models/army.ts` becomes a type and value re-export of the lib model.
- The pre-layout WOTR bullet in ARCHITECTURE.md is updated.
- Two commits: a pure move first, then the behavior change.

## Size

About 215 business-logic lines, tests excluded. About 190 of those are moved code and about 25 are new or changed. That is under 400, so no split. The two-commit order gives the reviewer the extraction separately anyway.

## Depends on

SGS-001, SGS-003, and SGS-007 (newly added).
- SGS-002 (the harness) is a transitive dependency through SGS-003, so it is not listed directly.
- The TASK-GRAPH row still reads "SGS-001, SGS-003". The manager should add SGS-007.

## Gap resolution

| Gap | Resolution |
|---|---|
| 1 (statistical criteria cannot fail) | Replaced by deterministic unit tests with a scripted roller. Round 1 combat calls receive 5 dice for a 10-unit army (fails today with 10) and 3 dice for a 3-unit army. Each side records at most 5 hits per round, and exactly 5 with all 6s at 10/5 vs 10/5 (fails today with 10). |
| 2 (reroll cap untestable) | Unit tests check the leader call gets min(misses, leaders) for (5,5), (5,2), (3,5), and (0,5). The cap of 5 is confirmed by review only; the ticket explains why. |
| 3 (downgrade has no observable) | A unit test on `BaseArmy` checks the exact trace 0/7 -> 1/6 -> 0/6 -> 1/5 -> 0/5 -> 1/4 (the first step fails today with -1/7). Other tests show the other branches are unchanged. An exhaustive check over every army with 1-10 units shows no negative count, a 0/0 end, and leaders unchanged. |
| 4 (test location, harness) | Unit tests go in the SGS-007 runner. The HTTP check uses the SGS-002 harness, which is on `main` through SGS-003: `npm run acceptance` must pass with no spec changes, because `fight-api.spec.ts` already asserts 200 and the `BattleStats` keys. Curl is not used. Also: compare `GET /api/models/army` status codes, and run a UI smoke check. |
| 5 (doc source of truth) | New Preconditions section. The merged `docs/combat-simulator.md` must state the dice cap, the reroll cap, and the downgrade rule. If any is missing, the ticket bounces. It never edits the doc. |

## `/api/models/army` choice

The file is kept as a re-export, not left untouched:
- The module stays at the same path with no default export, so the route behaves the same.
- Leaving the old file in place would leave a second `BaseArmy` without the downgrade fix.
- The reviewer records the `GET /api/models/army` status code before and after the change.

## Diagram

A read/act/record flowchart of `Battle()`. It marks the two caps, the injected `roll`, the downgrade in `takeHit`, and the boundary between the handler and lib.

## Open questions

- Non-blocking: test-file location and naming follow SGS-007. If SGS-007 sets none, the default is `lib/combat-simulator/<module>.test.ts`.

## Manager actions and overlap

1. TASK-GRAPH: add SGS-007 to SGS-004's dependsOn.
2. INVARIANTS.md W1/W2 paths and the CONTEXT.md component table do not list `lib/combat-simulator/**`. Without that, reviewers will not apply W1/W2 to the moved logic, because invariants are scoped by path. Add `lib/combat-simulator/**` to both. The same path is also missing from the REPO.md "Combat simulator" review-checklist paths.
3. SGS-001 (status needs_spec) has a criterion saying the doc's casualty description "matches `BaseArmy.takeHit`", which means the current code without the downgrade. Its re-spec must state the downgrade as a settled rule, or this ticket's precondition fails.
4. SGS-005 says to run `Battle` on "a freshly constructed `FormParseResult`" and lists "moving `pages/api/models/army.ts`" as out of scope. After this ticket, `Battle` lives in `lib/combat-simulator/battle.ts` and takes `(attack, defend, roll)`. SGS-005 should be re-spec'd to build fresh `BaseArmy` pairs per battle, put the N loop and aggregation in lib, and drop the `console.log` calls there.
5. SGS-003 lists "Moving `pages/api/models/army.ts`" as out of scope. That is consistent, since SGS-003 lands first.
6. The SGS-007 ticket file does not exist yet (the TASK-GRAPH row is draft). This ticket assumes `npm test` runs `.ts` tests.
