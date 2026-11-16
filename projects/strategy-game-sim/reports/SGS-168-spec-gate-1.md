# SGS-168 spec gate 1

Verdict: READY

Checked at origin/main.

- Both quoted sentences exist verbatim in docs/combat-simulator.md. "Number of battles N" has the N = 100,000 sentence at line 100. "Not modeled" has the "planned for a later release" sentence at lines 151-152.
- lib/combat-simulator/simulate.ts has DEFAULT_BATTLES = 1000 and MAX_BATTLES = 100000. These match the doc's "defaults to 1000" and "at most 100,000".
- The code names the ticket cites exist: BaseArmy.leaders in army.ts, and resolveRound and MAX_LEADER_REROLLS in battle.ts.
- The Extension points symbols shouldStop, BattleOptions and OUTCOME_KINDS all exist in battle.ts.
- A grep of docs/, README.md and ARCHITECTURE.md finds no other copy of either claim. The 100,000 hits in aoe4-build-order.md are unrelated bounds.
- No file outside docs/ references combat-simulator.md. There are no doc-text tests to break.
- The ticket is docs-only, with Milestone none, no dependencies, no open questions and Risk standard (justified in the ticket). On merge is `none`. It adds no input or contract.
- Unverified assumptions of `none` is right: nothing external is called.

## Notes (non-blocking)

- Criterion 2 says there is no claim about future support or a later release for "any other rule". The kept Extension points paragraph opens with "Later termination rules ... plug in at three places" but ends "None of these rules is modeled today". Scope says to leave that section. The implementer might still read the criterion as forbidding it. Suggested wording: "...other than the Extension points section, which names code seams and says no such rule is modeled today."
