# SGS-001: Draft WOTR combat design doc `docs/combat-simulator.md`

- **Type**: Task
- **Component**: wotr-combat-simulator
- **Milestone / criteria**: M1 / M1.1
- **Priority**: high
- **Risk**: high
  <!-- Touches W1 (this doc is the rule source W1 points at) and defines the contract W1, M1.5, M1.6, M1.9
       tickets are judged against; PROJECT.md trigger "touches an invariant". No logic changes. -->
- **LOC estimate**: ~200 lines of prose, 0 business logic (one new file, `docs/combat-simulator.md`; no `docs/` dir exists on `main`)
- **Depends on**: none
- **Source**: MILESTONES M1.1; plan M1-20261028 Outline A; CONTEXT.md "Decisions"

## Context

`docs/combat-simulator.md` does not exist, so W1 ("combat follows the doc") has nothing to check against.
The doc records the rules the simulator must follow, states what the code does today where it differs,
and fixes input bounds and outcome reporting. Owner decisions in CONTEXT.md override the plan's
"owner to confirm" list; those are written as settled rules.

## Scope

Create `docs/combat-simulator.md` (prose, plus a Mermaid round-order flowchart inside the doc). Describe
the code as read in `pages/api/fight.ts` (`Battle`, `rollDice`, `calculateCombatRollResults`,
`BattleResult.getStats`, `parseFightForm`) and `pages/api/models/army.ts` (`BaseArmy`). Sections:

1. **Purpose and model.** Estimates a War of the Ring battle by running N independent battles and reporting
   frequencies. One side is the attacker, one the defender; the results page labels them Shadow and Free
   (`components/apps/combat-simulator/results.js`).
2. **Armies.** Regulars, elites, leaders. Combat strength = regulars + elites (`getCombatStrength`).
3. **Round order**, each step stated once: both sides roll combat dice; a die hits on 6 only (`threshold 5`,
   `> threshold` in `calculateCombatRollResults`); each side re-rolls missed dice using leaders, one re-roll
   per leader up to the number of misses (`Math.min(misses, leaders)`); hits from both sides apply
   simultaneously (`takeHits` called for both after both rolls); the round is recorded; repeat until a side has
   0 combat strength.
4. **Rules the sim must follow (settled, owner decision).**
   - Combat dice are capped at 5 per side per round. Today the code rolls regulars + elites with no cap
     (`rollDice(getCombatStrength())`); implemented later by SGS-004. State as the rule, and add a short
     "current code" note that it does not yet cap.
   - Leadership re-rolls are capped. Same treatment: rule stated, current code uncapped
     (`Math.min(misses, leaders)`), implemented by SGS-004. The numeric value is Open question 1.
   - Casualty order is fixed and intentional (it replaces the human player's choice of losses): when the army
     has more than 5 units, a hit removes a regular; otherwise an elite becomes a regular; otherwise a
     regular is removed (`BaseArmy.takeHit`). Leaders are never casualties.
   - Fight to elimination: a battle runs until one or both sides have 0 combat strength.
5. **Departures from the published game, each marked "owner to confirm".** Fight-to-elimination (no
   retreat/cease-attack choice); no combat cards; no sieges/sorties; Attack = Shadow and Defense = Free
   hard-coded in the results view; no Nazgul/character leadership.
6. **Input bounds (settled).** An army is at most 10 units in total. A side that starts with 0 units is
   invalid input and is rejected (400 by SGS-003; the doc states "invalid" and the rejection, not the code).
   Per-field limits and whether leaders count toward the 10 are Open question 2. Document the UI as it is
   today: 0-9 regulars, 0-9 elites, 0-5 leaders in `components/apps/combat-simulator/army.js`, server
   enforces nothing. Do not describe today's 0-unit behavior (0 rounds, NaN averages) as a rule; mention
   once as current behavior being replaced.
7. **Number of battles N (settled).** Default 1000, maximum 100,000.
8. **Outcome reporting.** Required content (settled): who wins, round counts, and surviving units. Include a
   **proposed** statistics set, clearly labeled "proposal, owner to confirm":
   - outcome frequencies over N: attacker wins, defender wins, mutual elimination (today's `survivor`
     value `n/a`), as counts and fractions summing to N / 1;
   - rounds per battle: mean, median, and p10/p90 (or a histogram by round count);
   - surviving units: for each winning side, the distribution of surviving combat units (regulars and elites
     reported separately or combined: decision belongs in the proposal), plus mean survivors per side
     conditioned on that side winning;
   - average hits per round per side (already in `getStats`) carried over or dropped (proposal states which).
9. **Independence of battles.** Each battle starts from a fresh copy of the submitted armies (W2). Note the
   current `Battle` mutates the armies in place.
10. **Not rules.** Do not document the negative-count path in `takeHit` as a rule.

**Out of scope:** any code change (SGS-004 caps, SGS-003 validation, SGS-005 Monte Carlo); `docs/starcraft-helper.md`;
the `/api/fight` request/response contract doc (M1.7); editing CONTEXT.md or other factory files. The
shipped doc must not mention ticket ids, invariant numbers, or factory files: the SGS-003/004/005 references
above are for this ticket only; in the doc write "a planned change" or equivalent.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `docs/combat-simulator.md` exists on the branch and contains sections for: model, armies, round
      order, settled rules, departures from the published game, input bounds, N, outcome reporting.
- [ ] Round order matches the code: dice hit on 6 only; re-rolls = min(misses, leaders) (current); hits
      apply simultaneously; loop ends at 0 combat strength (verify each against `fight.ts`).
- [ ] The doc states as settled rules: 5-die combat cap, leadership-reroll cap, fixed casualty order
      (intentional), army max 10 units total, 0-unit start invalid, N default 1000 and max 100,000. None is
      tagged "owner to confirm".
- [ ] Where the current code differs from a settled rule (no dice cap, no reroll cap, no 10-unit cap, no
      0-unit rejection, no N), the doc says so in a clearly labeled "current code" note.
- [ ] Fight-to-elimination, no cards, no sieges, Shadow/Free hard-coded, no Nazgul/character leadership are
      each listed and each tagged "owner to confirm".
- [ ] Outcome reporting lists the required content (winner, round counts, surviving units) and a concrete
      proposed statistics set tagged "proposal, owner to confirm"; mutual elimination is named as an outcome
      and mapped to today's `n/a`.
- [ ] The doc's casualty-order description matches `BaseArmy.takeHit` and does not present the negative-count
      path as a rule.
- [ ] The doc has no ticket ids, invariant numbers, or factory-file references.
- [ ] No code files changed in the diff (docs only); `npx tsc --noEmit` still passes.
- [ ] No INVARIANTS.md regressions

## Open questions

1. **Leadership-reroll cap value.** CONTEXT.md says a cap exists but gives no number. Plan Outline A hints
   at 5 ("no cap of 5"). Owner confirms the number and whether it applies per side per round. The
   implementer writes "TBD: owner to confirm" for the value until answered; do not invent it.
2. **Do leaders count toward the 10-unit cap?** "10 units in total" is settled; in the published game leaders
   are not units, but the UI offers 0-5 leaders next to 0-9 regs/elites. Owner decides: cap on regulars +
   elites only, or regs + elites + leaders; and the per-field leader limit.
3. **Casualty order when an army has more than 5 units but 0 regulars** (reachable once up to 10 elites are
   allowed, e.g. 6 elites + 0 regulars): the current branch removes a regular that is not there. The fixed
   order is settled but silent on this case. Owner decides what a hit does here (for example, an elite is
   downgraded to a regular). Doc states the chosen rule once answered; until then it flags the gap.
4. **Outcome statistics proposal (flagged by decision).** Owner confirms or edits the proposed set in
   section 8 (frequencies, round-count summary, surviving-unit distribution, hits-per-round).
5. **Remaining departures** (fight-to-elimination, no cards, no sieges, Shadow/Free hard-coded, no
   Nazgul/character leadership): owner confirms each as intended or asks for a follow-up ticket.
