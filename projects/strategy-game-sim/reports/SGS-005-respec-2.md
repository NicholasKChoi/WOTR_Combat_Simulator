# SGS-005 re-spec 2 (ticket author)

Ticket: tickets/SGS-005-n-battle-outcome-frequencies.md. Base: origin/main 8532a0b. Branch not created.
Trigger: owner decisions "WOTR extensibility" (CONTEXT.md Out of scope) and "WOTR survivor shares" (Decisions).

## Changes (all tagged `(respec 2)` in the ticket)
1. Section 1: `outcomes` is the one object keyed by outcome kind; this version always emits exactly
   `attacker`, `defender`, `tie` (count 0 if unseen) in `OUTCOME_KINDS` order; clients must tolerate
   additional keys with the same `{count, frequency}` shape. Every other object stays closed.
   Survivor `frequency` = share of that side's wins, stated as decided (old open question 7 resolved).
   `rounds` already said "over all N battles (every outcome)"; confirmed, unchanged.
2. Section 2: consumes SGS-004's `OUTCOME_KINDS`, `OutcomeKind`, `battleOutcome(attack, defend)`,
   `BattleOptions`, `Battle(attack, defend, roll = rollDice, options = {})`. Each battle classified with
   `battleOutcome`; accumulator takes a kind list (default `OUTCOME_KINDS`), one counter per kind, throws on an
   unlisted kind, emits entries by iterating the list. Simulate takes `BattleOptions` (default `{}`) and passes
   it unchanged to every `Battle`. Handler calls without options.
3. Section 5: "Fighting Stats" outcome rows from `Object.entries(outcomes)`, label map for known kinds,
   raw key for unknown kinds.
4. Section 7 Key surfaces: `outcomes.<kind>.{count,frequency}`, currently attacker/defender/tie, tolerate more.
5. Out of scope adds: other termination rules, any `BattleOptions` field, request option fields, new kinds.
6. Criteria: accumulator criterion revised (keys = `OUTCOME_KINDS`, sums over all kinds); NEW unit criterion:
   extended kind list `[...OUTCOME_KINDS, 'extra']` yields an `extra` entry, unlisted kind throws; NEW loop
   criterion: `battleOutcome` classification via scripted rollers, options pass-through review-checked;
   HTTP key-set and sum criteria revised; NEW UI criterion: `page.route`-intercepted body with extra outcome
   key renders four rows (raw key label) without error.
7. Diagram: options edge, `battleOutcome` node, per-kind accumulator, view iterating keys.
8. LOC ~265 -> ~275. Dependencies unchanged (parentheticals note SGS-001/SGS-007 merged).

## Design doc
Not edited (out of scope). `docs/combat-simulator.md` outcome-reporting section defers field names to
`docs/api/openapi.json`, so the "tolerate additional keys" statement lives in SGS-006's spec. The doc's
"The battle ends with one of three outcomes" is true for this version; a later termination-rule ticket must
update it.

## SGS-006 alignment
Checked SGS-006 (already re-specced as respec 2): `FightOutcomes` requires attacker/defender/tie with
`additionalProperties: $ref OutcomeTally` and a tolerate-unknown-keys description; type derived from
`OutcomeKind`; contract check compares `OUTCOME_KINDS`, `FightOutcomes.required` and real body keys;
`SurvivorCombination.frequency` = share of that side's wins. Consistent with this ticket. SGS-006 must keep:
- its key-set drift check treating `outcomes` as "required three, extras allowed" while the real 200 body
  emits exactly the three (SGS-005's HTTP key-set criterion asserts exactly three in this version);
- `OutcomeTally.frequency` = `count / battles`, and counts over all kinds summing to `battles`.

## Open questions
None.
