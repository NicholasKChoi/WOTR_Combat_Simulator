# SGS-168 docs report 2 (rework 1)

- Ticket: SGS-168. Branch: sgs-168-combat-doc-not-modeled-claims. Tip SHA: adf3a35a0b6b32d0da1001c1ec8b48a37f5746a1.
- Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-168-combat-doc-not-modeled-claims

## Docs touched
- docs/combat-simulator.md: restored "A request for N = 100,000 completes within 10 seconds." in "Number of battles N", with the blank-line layout it had on main. The cut of "Support for them is planned for a later release." stays.

## Doc claims
- "A request for N = 100,000 completes within 10 seconds." is enforced by `acceptance/fight-api-battles.spec.ts` `TIME_BUDGET_MS = 10_000` (line 5), used at line 228 with `battles: 100000`. `lib/combat-simulator/simulate.ts` `MAX_BATTLES = 100000` (line 6) gives the cap. The sentence is byte-identical to main.

## Removed claims
- None in this pass. The earlier cut ("Support for them is planned for a later release.") is kept.

## CONTEXT.md Design docs rows
- None.

## Checks
- `git diff main...HEAD --stat`: only docs/combat-simulator.md (1 insertion, 2 deletions). A plain `git diff main` also lists acceptance files, because local main is ahead of the branch point. The branch does not touch them.
- Lint, codegen, link check: not run. The change is one restored sentence and adds no links.
- Rework checkbox in the ticket was not ticked, because only the manager writes ticket and graph state. Required fix is done.

## Out-of-scope findings
- None.

## Status
needs_review
