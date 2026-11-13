# SGS-158: Make a WOTR combat die hit on a 5 or a 6

- **Type**: Bug
- **Component**: wotr-combat-simulator
- **Milestone**: none
- **Priority**: high
- **Risk**: high
- **Invariants**: W1 (combat follows docs/combat-simulator.md; this ticket changes the dice rule and the doc together); W2 (battles stay independent; unaffected, `resolveRound` keeps its shape)
- **Unverified assumptions**: none
- **LOC estimate**: 5 (`calculateCombatRollResults` and `CombatRollOps` in `lib/combat-simulator/battle.ts`; doc text and tests excluded)
- **Depends on**: none
- **On merge**: none
- **Source**: BACKLOG.md item "WOTR combat: dice hit on 6 only; the rules say 5 or 6" (discovery milestone 2026-11-13); owner confirmed the rule (Q89): a die hits on a 5 or a 6.

## Context

War of the Ring 2E scores a hit on each die showing a 5 or a 6 (1/3 per die). The simulator scores a hit only on a 6 (1/6 per die), so every reported WOTR outcome, round count, and hits-per-round share is off, and `docs/combat-simulator.md` states the wrong rule.

### Cause

`lib/combat-simulator/battle.ts`, `calculateCombatRollResults`: `let threshold = opts.threshold || 5` and the test `thisDice > threshold` is a strict comparison, so the value 5 is a miss. The default 5 reads as "the face that hits" but is used as "the face that misses at or below". `||` also treats an explicit threshold of 0 as unset. Every caller in `resolveRound` (attack and defense combat rolls, both leader re-rolls) passes no threshold, so all four roll paths share the defect; no other place compares dice faces (`rollDice` only produces faces 1-6).

Why nothing caught it: every scripted-roller test in `lib/combat-simulator/battle.test.ts` and `simulate.test.ts` uses only the faces 1 (miss) and 6 (hit), and no test rolls a 5, so the 5 boundary was never exercised. The acceptance specs run real RNG and assert only loose ranges.

## Scope

- `lib/combat-simulator/battle.ts`: in `calculateCombatRollResults`, a die hits when its face is 5 or 6. Define `threshold` as the lowest face that hits, default 5, compared so that a face equal to the threshold hits. Do not let a falsy explicit threshold fall back to the default (no caller passes one today; if the option stays unused, removing `threshold` from `CombatRollOps` is also acceptable). Fix the same semantics for combat rolls and leader re-rolls, which share this function.
- `docs/combat-simulator.md`: update every statement of the 6-only rule: Round order step 2 ("A die hits on a 6 only"), step 3 (re-rolled dice "hit on a 6 only"), and the two Mermaid nodes in the round-order flowchart ("Each 6 is a hit" for the combat roll, "each 6 is a hit" for the re-roll). Also re-read the rest of the doc for any statement the new rule makes untrue.
- `lib/combat-simulator/battle.test.ts`: add tests of the boundary (see criteria). Search found no existing test, acceptance spec, `docs/api/openapi.json` description, or UI text that pins the 6-only rule (examples checked: `battle.test.ts`, `simulate.test.ts`, `army.test.ts`, `acceptance/combat-simulator*.spec.ts`, `acceptance/fight-api*.spec.ts`, `components/apps/combat-simulator/results.js`). Re-run `grep` for the rule wording before editing and edit any test, spec, or description that does pin it; the implementer lists every file edited.
- The statistical acceptance specs (examples: `acceptance/fight-api-battles.spec.ts` "simulation behavior", `acceptance/fight-api-caps.spec.ts` lone-defender and one-versus-one tests) use real RNG and loose ranges. They are not expected to change; the implementer reports whether they still hold under the new rule and edits one only if it fails for a reason the rule explains. `acceptance-test` runs them, not the implementer (common.md).

**Out of scope:** siege or other hit rules (backlog item for a later milestone), leader or Nazgul behavior, casualty order, the 5-dice and 5-reroll caps, any change to `rollDice`, any change to response shape or OpenAPI schema.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] A combat die showing 5 and one showing 6 each score a hit; dice showing 1 through 4 miss. A test covers the 4/5 boundary (a 4 misses, a 5 hits) and fails if the comparison is strict at 5 again.
- [ ] A leader re-rolled die hits on a 5 as well as a 6, and a re-rolled 4 misses. A test scripts the re-roll faces through `resolveRound` and checks the hits recorded for the round; it fails if re-rolls keep the 6-only rule while combat dice use 5-or-6.
- [ ] The number of dice a leader re-rolls (min(misses, leaders, 5)) counts a rolled 5 as a hit, not a miss: a test rolls 5s in the combat roll and checks the re-roll call size.
- [ ] `rollDice` is unchanged: it still yields faces 1-6 uniformly (the existing `rollDice` test keeps its assertions).
- [ ] `docs/combat-simulator.md` states that a die hits on a 5 or a 6 for the combat roll and the leader re-roll, in the Round order list and in the flowchart; no sentence of the doc still says only a 6 hits.
- [ ] Every pre-existing test whose assertions do not depend on the hit rule keeps its assertions; any test edited because it pinned the 6-only rule is listed in the implementer's report.
- [ ] The implementer's report records, from a run of `/api/fight` or `simulateBattles` on a one-versus-one fight, that a lone die now hits about one time in three (a measured result for the report and PR body, not written into any doc).
- [ ] No INVARIANTS.md regressions

## Open questions

none
