# SGS-001: Draft WOTR combat design doc `docs/combat-simulator.md`

- **Type**: Task
- **Component**: wotr-combat-simulator
- **Milestone / criteria**: M1 / M1.1
- **Priority**: high
- **Risk**: high
  <!-- Touches W1 (this doc is the rule source W1 points at) and defines the contract W1, M1.5, M1.6, M1.9
       tickets are judged against; PROJECT.md trigger "touches an invariant". Adjacent: W2, S3. No logic changes. -->
- **LOC estimate**: ~220 lines of prose, 0 business logic (one new file, `docs/combat-simulator.md`; no `docs/` dir exists on `main` at d54af2e)
- **Depends on**: none
- **Source**: MILESTONES M1.1; plan M1-20261028 Outline A; CONTEXT.md "Decisions"; ARCHITECTURE.md "Where files go" (`docs/<app>.md`)

## Context

`docs/combat-simulator.md` does not exist, so W1 ("combat follows the doc") has nothing to check against.
The doc records the rules the simulator must follow, states once where today's code differs, and fixes
input bounds, N, and outcome reporting. Owner decisions in CONTEXT.md Decisions are written as settled
rules. Later tickets (SGS-003 validation, SGS-004 caps and casualty fix, SGS-005 Monte Carlo) implement
against this doc.

## Scope

Create `docs/combat-simulator.md`: prose plus one Mermaid round-order flowchart. Current-code notes are
grounded in `pages/api/fight.ts` (`Battle`, `rollDice`, `calculateCombatRollResults`, `BattleResult.getStats`,
`BattleResult.getSurvivor`, `parseFightForm`, `handler`), `pages/api/models/army.ts` (`BaseArmy`), and
`components/apps/combat-simulator/army.js` / `results.js`, all at origin/main d54af2e.

Rule text and "current code" notes are kept apart: each section states the rule, then, where the code
differs, one short note labeled **Current code** saying what the code does today and that a planned change
brings it in line. The doc never says which ticket does it.

1. **Purpose and model.** Estimates a War of the Ring field battle by running N independent battles and
   reporting outcome frequencies. One side attacks, one defends.
2. **Armies.** Regulars, elites, leaders. Combat strength = regulars + elites (`getCombatStrength`). A side
   with combat strength 0 is eliminated (`isArmyAlive`). Leaders never take casualties and never roll combat
   dice. Leadership comes from the `leaders` count only.
3. **Round order (rule)** (respec 1), each step stated once:
   1. Each side rolls combat dice = min(regulars + elites, 5).
   2. A die hits on a 6 only (code: `threshold` 5, hit when `> threshold`, in `calculateCombatRollResults`).
   3. Each side re-rolls missed combat dice: rerolls = min(misses, leaders, 5). A re-rolled die hits on 6.
   4. A side's hits = combat-die hits + reroll hits; at most 5 per side per round (follows from 1 and 3).
   5. Both sides take hits simultaneously (both rolls resolve before either side takes casualties; code calls
      `takeHits` on both after both rolls).
   6. The round is recorded.
   7. Repeat while both sides have combat strength > 0. Outcomes: attacker win, defender win, or tie (both
      reach 0 in the same round).
   - **Current code** notes: dice = regulars + elites with no cap (`rollDice(getCombatStrength())`); rerolls =
     `Math.min(misses, leaders)` with no cap of 5; a side can therefore exceed 5 hits per round today.
4. **Mermaid flowchart** (respec 1) of the step 3 round order showing the settled rule (the caps at steps 1
   and 3, simultaneous casualties, the loop condition, and the three outcomes). It does not depict
   current-code behavior.
5. **Casualties (rule)** (respec 1). The fixed order is intentional: it stands in for the human player's
   choice of losses. Per hit, with "units" = regulars + elites:
   - more than 5 units: remove a regular; if there are 0 regulars, downgrade an elite to a regular (combat
     strength unchanged);
   - 5 or fewer units: downgrade an elite to a regular if there is one; otherwise remove a regular;
   - hits beyond what eliminates the side are discarded; leaders are never casualties.
   - **Current code** note: `BaseArmy.takeHit` decrements regulars whenever there are more than 5 units, so a
     side with more than 5 units and 0 regulars goes to negative regulars. That path is a defect, not a rule.
6. **Input bounds (rule)** (respec 1). Per side: regulars + elites <= 10; leaders 0-5 and not counted toward
   the 10; regulars + elites = 0 is invalid input and the request is rejected (an army of only leaders is
   invalid). The UI offers 0-10 regulars, 0-10 elites, 0-5 leaders.
   - **Current code** note: the UI offers 0-9 regulars, 0-9 elites, 0-5 leaders (`army.js`), and the server
     enforces none of these bounds (`parseFightForm`); a 0-unit side today yields 0 rounds and non-numeric
     averages. Stated once as behavior being replaced, not as a rule.
7. **Number of battles N (rule)** (respec 1). Default 1000, maximum 100,000. A request for N = 100,000
   completes within 10 seconds.
   - **Current code** note: one battle per request; N is not accepted.
8. **Independence of battles.** Each battle starts from the submitted armies; no state from one battle
   carries into another. **Current code** note: `Battle` mutates the parsed armies in place.
9. **Outcome reporting (rule)** (respec 1). Describes what each statistic means; does not name response
   fields (the wire format belongs to the API spec; the doc may link to `docs/api/openapi.json` for it).
   - Outcome frequencies over N: attacker wins, defender wins, ties (both sides eliminated in the same round;
     today's `survivor` value `n/a`), as counts and as shares of N.
   - Rounds per battle over all N battles (ties included): mean, median, p10, p90. Percentiles use the
     nearest-rank method: with round counts sorted ascending, the p-th percentile is the value at 1-based
     rank ceil(p/100 x N); the median is p50 by the same method, so every percentile is a whole round count.
   - Surviving units: for each side, over the battles that side won, the number of battles ending with each
     (regulars, elites) combination, with regulars and elites kept as separate coordinates (not summed). Ties
     contribute no survivors.
   - Hits per round: for each side, the share of all rounds (across all N battles) in which that side scored
     0, 1, 2, 3, 4, and 5 hits.
   - **Current code** note: the response reports one battle (`rounds`, `survivor`, average hits per round per
     side, and the final armies).
10. **Departures from the published game, each tagged "owner to confirm"** (respec 1): fight to elimination
    (no retreat or cease-attack choice); no combat cards; no sieges or sorties; attacker shown as Shadow and
    defender as Free, hard-coded in `results.js`.
11. **Not modeled (settled)** (respec 1): character and Nazgul leadership (a later milestone). Not tagged
    "owner to confirm".

**Out of scope:** any code change (caps, casualty fix, validation, UI ranges, Monte Carlo); creating or
editing `docs/api/openapi.json`; `docs/starcraft-helper.md`; editing CONTEXT.md or other factory files.
The shipped doc must not mention ticket ids, invariant numbers, milestone ids, or factory files; the ticket
ids above are for this ticket only.

## Diagrams

Single-component change outside the core control loop (docs only, no code); no diagram required for the
ticket. The doc itself ships a round-order flowchart, checked by a criterion below (respec 1).

## Acceptance criteria

- [x] `docs/combat-simulator.md` exists on the branch with sections for: purpose and model, armies, round
      order, casualties, input bounds, N, independence, outcome reporting, departures, not modeled.
- [x] (respec 1) Round order states, as rules: combat dice = min(regulars + elites, 5); hit on 6 only;
      rerolls = min(misses, leaders, 5); at most 5 hits per side per round; simultaneous casualties; loop
      until a side has 0 combat strength; outcomes attacker win / defender win / tie.
- [x] (respec 1) The doc contains a Mermaid flowchart whose steps, caps, loop condition, and three outcomes
      match the round-order section, and which renders on GitHub (a fenced `mermaid` block that parses).
- [x] (respec 1) Casualty section states the rule: more than 5 units removes a regular, or with 0 regulars
      downgrades an elite to a regular; 5 or fewer units downgrades an elite, else removes a regular; leaders
      never casualties. It is not required to match current `BaseArmy.takeHit`; it carries a "Current code"
      note that today's code drives regulars negative in the more-than-5, 0-regulars case.
- [x] (respec 1) Input bounds state: regulars + elites <= 10 per side; leaders capped at 5 and not counted
      toward the 10; regulars + elites = 0 invalid and rejected; UI offers 0-10 regulars, 0-10 elites, 0-5 leaders.
- [x] (respec 1) N section states default 1000, maximum 100,000, and N = 100,000 within 10 seconds.
- [x] (respec 1) Outcome reporting describes, without naming response fields: attacker win / defender win /
      tie frequencies (tie mapped to today's `n/a`); rounds mean, median, p10, p90 with the nearest-rank
      method stated; each winning side's surviving (regulars, elites) combination counts kept separate; each
      side's hits-per-round distribution over 0-5 as shares of all rounds. None is tagged "proposal" or
      "owner to confirm".
- [x] (respec 1) Every rule the current code does not yet follow (dice cap, reroll cap, 5-hit ceiling,
      casualty 0-regulars case, input bounds and 0-unit rejection, UI ranges, N, independence, outcome
      statistics) has a labeled "Current code" note, and no note is presented as a rule.
- [x] (respec 1) Fight to elimination, no combat cards, no sieges/sorties, and Shadow/Free hard-coded are each
      listed and each tagged "owner to confirm". Character/Nazgul leadership is listed as not modeled and is
      not tagged "owner to confirm".
- [x] The doc has no ticket ids, invariant numbers, milestone ids, or factory-file references
      (`grep -E 'SGS-|M1\.|W1|W2|S3|CONTEXT\.md|INVARIANTS\.md'` on the file finds nothing).
- [x] The diff adds only `docs/combat-simulator.md`; no code file changes.
- [x] No INVARIANTS.md regressions (W1, W2, S3 adjacent)

## Open questions

Resolved by the owner (CONTEXT.md Decisions, 2026-10-28) and written into Scope as settled rules: dice cap,
reroll cap, 5-hit ceiling, casualty 0-regulars downgrade, input bounds and leader cap, leadership from
`leaders` only, outcome statistics, N default/max, 10-second budget.

Still open:
1. Remaining departures (fight to elimination, no combat cards, no sieges/sorties, Shadow/Free hard-coded):
   owner confirms each as intended or asks for a follow-up ticket. The doc keeps them tagged "owner to
   confirm". Non-blocking.
2. Surviving-units shares: the doc reports counts per (regulars, elites) combination. If shares are also
   wanted, is the denominator that side's wins or all N battles? Non-blocking; counts are unambiguous.

## Rework

None.

## Re-spec 2026-10-28

**Underspecified:** (spec gate, 6 gaps; SGS-003 and SGS-004 gates) the casualty criterion required matching
current `takeHit`, which contradicts the owner's 0-regulars downgrade rule; section 4/6 pointed at resolved
open questions; per-field limits and leader counting were left open and the UI was described as 0-9;
Nazgul/character leadership was tagged "owner to confirm" though settled; outcome statistics were tagged
"proposal" with two choices left open (survivor split, hits per round); the 10-second budget was not in the
doc; the scope required a flowchart while Diagrams said none and no criterion checked it.

**Changed:** round order now states the caps as rules with current-code notes; casualty rule written as the
owner's rule with a defect note, criterion no longer tied to `takeHit`; input bounds settled (regulars +
elites <= 10, leaders <= 5 not counted, 0 invalid, UI 0-10/0-10/0-5) with a leader-cap criterion; N section
records the 10-second budget; outcome statistics settled with nearest-rank percentiles, survivors as separate
(regulars, elites) combinations, hits-per-round distribution 0-5, no field names; flowchart kept in the doc
with its own criterion; character/Nazgul leadership moved to "not modeled"; link to `docs/api/openapi.json`
permitted; dropped the trivially-true `tsc` criterion in favor of "only the doc file is added".

**Branch work that stands:** none; `sgs-001-wotr-combat-design-doc` has not been created.

## Gate log - 2026-10-28

- review: APPROVE at 47c8931 (reports/SGS-001-review.md).
- acceptance-test: skipped. REPO.md has no acceptance harness configured (SGS-002 not merged), and the change is docs only with no public surface.
- Follow-ups noted by review (non-blocking): the doc gives no minimum N and no out-of-range behavior (SGS-005 pins 1-100,000, otherwise 400); survivor share is listed as counts only pending owner confirmation of the denominator. Both are one-line doc edits after SGS-005.
