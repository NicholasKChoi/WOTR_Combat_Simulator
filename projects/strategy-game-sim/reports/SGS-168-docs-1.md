# SGS-168 docs report 1

- Ticket: SGS-168. Branch: sgs-168-combat-doc-not-modeled-claims. Tip: edbb1b37d28899fced4e61b9c3d0f0a32b7adbc8
- Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-168-combat-doc-not-modeled-claims

## Docs touched
- docs/combat-simulator.md: removed the N = 100,000 duration sentence and the "planned for a later release" sentence (1 insertion, 4 deletions).

## Doc claims (added or changed)
- "Companions, Minions, and Nazgul that add leadership are not modeled; leadership comes only from the leaders count." (kept, now ends there). True per lib/combat-simulator/battle.ts resolveRound (rerolls = min(misses, leaders, MAX_LEADER_REROLLS)) and BaseArmy.leaders.
- "N defaults to 1000 ... and N is at most 100,000." (unchanged) matches lib/combat-simulator/simulate.ts DEFAULT_BATTLES = 1000, MAX_BATTLES = 100000.

## Removed claims
- "A request for N = 100,000 completes within 10 seconds." No test, acceptance spec, or design doc measures a duration.
- "Support for them is planned for a later release." No code or doc backs it; the roadmap is not a rule.

## Checks
- Re-grep of docs/, README.md, ARCHITECTURE.md for "planned", "later release", "within 10 sec", 100,000: no remaining copy of either claim (openapi.json hits are only the 100000 cap).
- Extension points section left as scoped (spec-gate note): shouldStop, BattleOptions, OUTCOME_KINDS exist in lib/combat-simulator/battle.ts. Its "Later termination rules" wording is exempt.
- Departures section and the rest of the doc: no other future-tense or timing claims.
- Lint/codegen: not run (docs only; commands.lint is tsc and jscpd, codegen is empty). No links added.
- Only docs/combat-simulator.md changed; no lib/, app/, acceptance/, or test file touched.

## CONTEXT.md Design docs rows
None.

## Out-of-scope findings
None.

## Status
needs_review. Ticket acceptance boxes not ticked (ticket file is manager state).
