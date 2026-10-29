# SGS-004 re-spec 2 (owner design change: WOTR extensibility)

Ticket: /home/choin/git/WOTR_Combat_Simulator-factory/projects/strategy-game-sim/tickets/SGS-004-wotr-combat-caps.md
Base checked: origin/main 8532a0b (`docs/combat-simulator.md` and Vitest merged; `vitest.config.ts` includes `lib/**/*.test.ts`).

## Summary

The ticket is now titled "Move WOTR battle logic to lib/combat-simulator, split it into a round step and a loop, and apply the combat dice and leadership-reroll caps".
- Component: wotr-combat-simulator. Risk: high.
- LOC: ~245 business logic, up from ~215. About 190 lines are moved; about 55 are new or changed. No split is needed.
- Depends on: SGS-001, SGS-003, SGS-007. Unchanged.
- Everything from respec 1 stands: caps, elite downgrade, lib move, roller injection, re-export, ARCHITECTURE.md bullet, and all existing criteria.
- New `(respec 2)` items:
  - the round step and loop split;
  - `BattleOptions`;
  - the outcome kinds;
  - the doc's Extension points subsection;
  - a three-commit order;
  - six new unit criteria plus one docs criterion.

## Pinned names and signatures (SGS-005 / SGS-006 must align)

All of these are exported from `lib/combat-simulator/battle.ts`:

- `type DiceRoller = (numDice: number) => number[]`
- `type BattleOptions = {}`: empty in M1, with a comment saying later termination rules are added as fields.
- `function shouldStop(battle: BattleResult, options: BattleOptions): boolean`: true when either army is eliminated.
  - It takes `BattleResult`, not `(attack, defend, options)`, so a later round limit can read `battle.rounds` without a signature change.
- `function resolveRound(battle: BattleResult, roll: DiceRoller): void`: one round in today's call order (attack combat, defend combat, attack leader, defend leader), mutating `battle.attackArmy`/`defendArmy` and calling `battle.recordRound`. It does no alive check.
- `function Battle(attack: BaseArmy, defend: BaseArmy, roll: DiceRoller = rollDice, options: BattleOptions = {}): BattleResult`: loops `while (!shouldStop(...)) resolveRound(...)`.
- `const OUTCOME_KINDS = ['attacker', 'defender', 'tie'] as const`; `type OutcomeKind = typeof OUTCOME_KINDS[number]`
- `function battleOutcome(attack: BaseArmy, defend: BaseArmy): OutcomeKind`: **throws if both sides are alive**.
- Also exported: `BattleResult`, `BattleStats`, `rollDice`, `MAX_COMBAT_DICE`, `MAX_LEADER_REROLLS`.

What SGS-005 and SGS-006 must match:

- **SGS-005**
  - Classify each battle with `battleOutcome`. Key the outcome counters off `OUTCOME_KINDS` rather than hard-coded literals.
  - Pass a fresh `BattleOptions` (or `{}`) through to `Battle`.
  - Use `Battle` with an injected roller for tests. Use `resolveRound` only if it needs per-round access.
  - When it replaces `getStats()`/`survivor`, it may delete `getSurvivor` and its `Record<OutcomeKind, string>` map.
  - Battles can still only end on elimination, so the both-alive throw is unreachable from `Battle`.
- **SGS-006**
  - The OpenAPI outcome keys and shared types come from `OutcomeKind`/`OUTCOME_KINDS`: `attacker`, `defender`, `tie`.
  - Per the owner decision, the schema must allow more kinds later. The TS type is a closed union today, and a later kind is added to `OUTCOME_KINDS`.
- **Both**: the response `survivor` values (`attack`/`defend`/`n/a`) are unchanged by SGS-004. Do not treat them as the outcome vocabulary.

## Survivor derivation

This was a clean change. `getSurvivor()` keeps its name and values and now looks up `battleOutcome(...)` through a `Record<OutcomeKind, string>`: attacker maps to `"attack"`, defender to `"defend"`, tie to `"n/a"`.
- The results are identical for every finished battle.
- The only difference is on an unfinished battle with both sides alive, which now throws instead of returning `"attack"`. No caller reaches that case.

## Diagrams

There is one diagram, a Mermaid flowchart that was updated:
- the handler-to-lib boundary;
- the `Battle` loop with the `shouldStop` decision;
- the `resolveRound` subgraph grouped into Read, Act, and Record phases, with the caps and the injected roller;
- the `battleOutcome` classification and the `getSurvivor` mapping on exit.

## Open questions

- Scope item 7 also removes the two "Current code" notes in `docs/combat-simulator.md` that this ticket makes false: the dice/reroll caps note under Round order, and the negative-regulars note under Casualties.
  - The owner named only the Extension points subsection, so this is flagged as non-blocking. The default is to remove them.
  - The manager may drop that bullet and its criterion if the owner wants a separate doc-sync change.

## Overlap

- SGS-005 and SGS-006 consume the names above. SGS-005 removes the `console.log` calls, which this ticket keeps.
- SGS-003 is serialized ahead of this ticket because both edit `pages/api/fight.ts`. That is unchanged.
