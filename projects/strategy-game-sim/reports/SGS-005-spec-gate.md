# SGS-005 spec-readiness gate

Verdict: NEEDS_SPEC

Checked against code at origin/main (d54af2e), CONTEXT.md, INVARIANTS.md, REPO.md, SGS-001/003/004/006 tickets. Factory LESSONS.md files are empty.

## Gaps (blocking)

1. Scope item 1 / Acceptance (statistic shape) - the ticket delegates the stat set, bucketing and field names to `docs/combat-simulator.md`, which does not exist yet. SGS-001's scope for section 8 only requires a "proposed set" and leaves open whether surviving units are regulars/elites separate or combined, whether the distribution is per winning side, and whether hits per round is kept. An implementer would guess the response shape, and SGS-006 (FightResponse with additionalProperties false) depends on exactly these names. The stop-and-bounce clause helps but turns this into a likely mid-flight failure. Fix: pin in this ticket (or require SGS-001 to pin, and re-gate after it merges) these items: (a) response field names and types for N, win counts and frequencies (attacker/defender/tie), rounds mean/median/p10/p90, surviving-unit distribution, hits per round; (b) percentile method (nearest-rank vs interpolation) and median for even N; (c) surviving-unit distribution: keyed by what (winner side plus regulars+elites combined or separate), and the mean "conditioned on that side winning"; (d) hits per round: mean of per-battle averages vs total hits / total rounds, per side. Owner may need to close (c) and (d) if the doc is silent. [owner]

2. Acceptance "every statistic the doc lists for round counts and surviving units, and no others" - owner answer 2 includes "hits per round", which is neither a round-count nor a surviving-unit statistic, so the criterion can be read as excluding it. Fix: rewrite to "the response contains exactly the statistics listed in section 8 of the doc (outcome frequencies, rounds mean/median/p10/p90, surviving-unit distribution, hits per round), each computed over all N battles, and no others."

3. Scope item 2 vs Acceptance (submitted armies) - scope says either the response carries the starting armies or the page uses its own form values; the W2 criterion says "the response's reported starting armies equal the submitted armies". These contradict, and the choice changes the public response schema that SGS-006 documents (SGS-006's FightResponse list has no armies field). Fix: choose one. Recommended: the page renders its own submitted form values, response carries no armies; drop the "response's reported starting armies" clause and replace with a test that the aggregate for a deterministic matchup (for example 1 regular vs 10 regulars, N=1000) is not contaminated by a prior battle's depleted armies.

4. Contracts (CONTEXT.md Key surfaces) - the ticket introduces request field `battles` and a new response shape; CONTEXT.md Key surfaces lists neither, and the spec checklist requires names to match it exactly. Fix: add to the ticket's scope an update of CONTEXT.md Key surfaces (`battles`: optional, integer 1..100000, default 1000; response field names from gap 1), or state that the manager does so at merge.

5. Scope item 4 / Acceptance (time budget) - the owner resolved a budget (N=100,000 with maximum legal armies within 10 s; if exceeded, report and stop, do not lower the cap), but the scope text still says "no time budget ... cannot declare pass/fail" and the criterion only requires recording numbers. An implementer has no pass/fail. Fix: delete the stale sentence; criterion becomes "N=100,000 with 10 units and 5 leaders per side completes in <= 10 s under `npm run dev` (measured locally; Vercel preview if available), recorded in the PR; if over 10 s stop and report, keep the cap at 100,000". Also state the measurement runs on the final merged handler (after SGS-004's cap, which shortens battles) and name the matchup (which army maximizes rounds, for example 10 elites+5 leaders vs the same). Note the Vercel serverless function timeout may be shorter than 10 s on some plans; the preview measurement is informational.

## Smaller fixes (blocking only in combination; cheap to fix)

6. Misattributions: "error shape SGS-004 defines", "SGS-004's validation and 405 behavior", "the largest army the SGS-004 caps allow" - validation, 405, the `{ error: string }` shape and the 10-unit/5-leader caps belong to SGS-003; SGS-004 is dice/reroll caps and the elite-downgrade casualty. Fix the references.

7. `battles` parsing - SGS-003 accepts a JSON number or a digit-only string. Say `battles` follows the same rule (so `1.0`, `+5`, `" 5"`, `1e3`, `null`, `true` return 400) and that `""` is 400 while only an absent key (or undefined) defaults to 1000. Add `1e3`, `null` to the invalid cases in the criterion.

8. Acceptance on testing - ticket cites tests but no dependency on SGS-002 (Playwright harness); SGS-003 and SGS-006 use it. Say whether new cases go into the harness or are curl-verified, and add SGS-002 to Depends on if the former. The tie/win-sum and one-sided checks should be harness specs.

## Checks that pass

- Grounded scope: `Battle`, `rollDice`, `calculateCombatRollResults`, `BattleResult.getSurvivor/getStats`, `Results` import, the two `console.log` calls, `results.js` (attack/defend props), `army.js`, `pages/apps/combat-simulator.js` all exist as described. `docs/combat-simulator.md` is correctly flagged as not yet on main. Mutating `takeHits` / in-place `Battle` correctly identified (W2).
- Open questions: the three owner answers are recorded; none remains on the main path other than gap 1.
- Invariants: W2 and S3 named, W1 adjacency handled (no dice change). No contradiction.
- Dependencies/size: stated; ~220 LOC under 400.
- Diagram: present (control loop with outer loop); acceptable.
- Lessons: none apply.
- Risk: high is correct (public API shape change, W2/S3, control loop, >150 LOC). No criticalPaths.

## Notes (non-blocking)

- SGS-001 requires the doc to tag section 8 "proposal, owner to confirm", while its open questions say the owner confirmed it. Tell the implementer that the confirmation stands, so a leftover tag is not a reason to bounce.
- Rounds data for median/p10/p90: a histogram or Int32Array of N entries is fine for memory; say so, since "not N stored BattleResult objects" could be over-read.
- Ticket cites base 533e579 but main is d54af2e; line numbers are unaffected for the named symbols.
- A `battles` default of 1000 with the form's `value=1000` means the absent-field default is only exercised by direct API callers; the acceptance criterion should be tested via HTTP.
