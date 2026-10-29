# SGS-004 spec-readiness gate

Verdict: NEEDS_SPEC

Checked against origin/main (d54af2e): `Battle`, `rollDice`, `calculateCombatRollResults`, `BattleResult.getStats` in `pages/api/fight.ts`, and `BaseArmy` in `pages/api/models/army.ts`. Also read CONTEXT.md, INVARIANTS.md, PROJECT.md, REPO.md, LESSONS (both are empty), and the SGS-001, -002 and -003 tickets.

## Passing checks

- Grounded scope: every named file and function exists. The `takeHit` and `getCombatStrength` descriptions match the code.
- Open questions: all four main-path questions are resolved, and they agree with CONTEXT.md Decisions.
- Invariants: W1 is named, and S3 and W2 are correctly called not affected. No criterion contradicts an invariant.
- Contracts: no new names are introduced.
- Size: well under 400 lines. The LOC estimate omits the `takeHit` change, but that is about 3 lines.
- Diagram: present, as required for a per-round loop change.
- Risk: `high` is correct. It changes the core loop and touches W1. `criticalPaths` is empty.

## Gaps

1. **Acceptance criteria 1, 2, 3 and 4 - cannot fail for the reason they cite, or are wrong as written.**
   Why an implementer would guess: the criteria cannot tell a correct cap from no cap.
   - Criterion 1 says "before the change this fails". It does not. `getStats()` returns the per-battle mean over rounds. 10 vs 10 cannot end in one round, because it needs 10 hits. A mean above 5 would need every round to score 6 or more hits. P(6 or more hits in one round) is about 0.2% at 10 dice, so this essentially never happens.
   - Criterion 2 passes trivially for the same reason. Its second half (leaders raise the mean) is fine.
   - Criterion 3 asserts "at most 5, an integer" on one-round battles. That is true with or without the cap, apart from a roughly 0.2% tail.
   - Criterion 4 expects about 0.83 hits per round for 5 vs 5. That is wrong. The average runs over rounds, and armies shrink as the battle goes on, so the mean is below 0.83. The tolerance is also not stated.
   - Fix (owner, or the writer with the owner's agreement): use a conditional statistic that separates capped from uncapped.
     - Run 10 regulars vs 1 regular, 0 leaders, and keep only requests with `rounds == 1`. Then `averageAttackHitsPerRound` is the first-round attacker hit count conditional on at least 1 hit.
     - Uncapped (10 dice) the expected mean is about 1.99. Capped (5 dice) it is about 1.39. These come from (10/6)/(1-(5/6)^10) and (5/6)/(1-(5/6)^5).
     - With about 2,000 or more qualifying requests the standard error is about 0.03, so the two are clearly separable. Require the mean to lie in 1.39 plus or minus a stated tolerance, for example 0.1, and say how many qualifying requests are needed.
     - Replace criterion 4 with the same setup at 5 regulars vs 1 regular. It should still read about 1.39, which shows armies of 5 or fewer are unaffected.
     - Add an upper-bound check across all requests with leaders, for example `averageAttackHitsPerRound` is at most 5. Keep it, but label it a sanity bound, not the proof.
   - Alternative: decide the seam open question as "yes". Export a pure per-round function, or an injectable RNG, so a unit-level test can assert exact dice counts. The repo has no unit runner (REPO.md `unit` is empty), so the conditional-statistic route above is cheaper.

2. **Open question "per-round test seam" and criterion 5 - leader-reroll cap is untestable as written.**
   Why an implementer would guess: criterion 5 is conditional on a seam that does not exist, and it defaults to "covered by criteria 1 and 2", which do not cover it.
   - The ticket's own observation says the reroll cap of 5 adds no behavior once the dice cap is in. A test can only confirm the leaders and misses bounds, which the code already enforces through `Math.min`.
   - Fix: mark criterion 5 as "reviewer confirms by reading the diff, no automated test". Say that the reroll cap is defensive and equal to 5. Name the constant, for example `MAX_LEADER_REROLLS`, so it is reviewable.

3. **Acceptance criterion 7 (elite downgrade) - no concrete input or observable.**
   Why an implementer would guess: the response only exposes the final armies, and a downgrade keeps the total unit count unchanged.
   - Fix: add a concrete case. A 7-elite, 0-regular attacker vs 10 regulars should never return a negative `regulars` or `elites` in `attack` or `defend`. Before the change, the first hit on the attacker gives `regulars = -1`, so this fails today.
   - If an exact trace is wanted, state it. A 7e/0r army has these states: hit 1 gives 6e/1r, hit 2 gives 6e/0r, hit 3 gives 5e/1r, hit 4 gives 5e/0r.
   - Say whether criterion 7 is verified over HTTP or by code review.

4. **Dependencies and Scope - where the tests live is not stated, and the harness dependency is missing.**
   Why an implementer would guess: the criteria say "tests run over HTTP (the harness from M1.3, or curl)". SGS-002 is the harness, but SGS-004 does not depend on it. The Scope also never says whether the ticket adds specs.
   - Fix: add SGS-002 to Depends on, or state that the criteria are verified manually by curl and that no spec is added. TASK-GRAPH currently shows SGS-004 depending only on SGS-001 and SGS-003. Say which one the owner wants. Align the TASK-GRAPH row if SGS-002 is added.

5. **Source of truth for the casualty rule - SGS-001 and SGS-004 may conflict (W1).**
   Why an implementer would guess: SGS-001's criterion says the doc's casualty description "matches `BaseArmy.takeHit`" (the current code). Its resolved open questions say the doc states the downgrade rule as settled. SGS-004 forbids any doc edit and says the doc governs. If SGS-001 ships without the downgrade rule, W1 fails on this ticket.
   - Fix: add a precondition to SGS-004, "the doc as merged by SGS-001 states the 0-regulars downgrade rule". Alternatively, permit a one-line doc edit in this ticket, which contradicts the current Out of scope. Either way, say which.
   - Also state who confirms the doc's 5-die and reroll-cap wording before the implementer starts, since the ticket says "take the value from the doc".

## Notes (non-blocking)

- Name the dice cap as a constant, for example `MAX_COMBAT_DICE = 5`, and keep it distinct from `takeHit()`'s `> 5` army-size threshold. Both are 5 but mean different things. The Naming checklist asks for names that state intent.
- Make the statistical tolerances explicit wherever a criterion says "within a stated tolerance". Pre-compute the request counts so the tests do not flake.
- The scope's line numbers (`~139-158`) are approximate, which is fine because SGS-003 shifts them.
- The two reroll expressions share one cap, and both sides go through the same code path. Nothing further is needed.
- Out of scope is complete.
- No LESSONS.md entry applies (both are empty).
