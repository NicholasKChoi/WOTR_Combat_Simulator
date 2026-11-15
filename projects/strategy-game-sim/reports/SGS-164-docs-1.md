# SGS-164 docs report 1

- Ticket: SGS-164. Branch: sgs-164-combat-doc-stale-notes. Tip: a5490af8584fbb2a98c399f6f20c07d94e0060c7 (base origin/main 0d708bc).
- Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-164-combat-doc-stale-notes

## Docs touched

- docs/combat-simulator.md: intro reworded; three Current code notes removed (1 insertion, 13 deletions).

## Doc claims (added or changed)

- "Each section states a rule, and the code follows it." Rules in the doc match battle.ts, simulate.ts and pages/api/fight.ts as read (validateFightForm, validateBattles, DEFAULT_BATTLES = 1000, MAX_BATTLES = 100000, 400 on invalid input before simulateBattles runs).

## Removed claims

- "Where today's code does something different, a short note labeled Current code ... a planned change brings the code in line ... never a rule." Describes nothing once the notes go.
- "each request runs exactly one battle, and N is not accepted." Contradicted by pages/api/fight.ts:validateBattles (optional `battles`) and simulate.ts:simulateBattles.
- "the battle changes the parsed army objects in place ..." Contradicted by simulateBattles, which builds a fresh BaseArmy per side per battle (per ticket; the removed text was the only claim, no replacement made).
- "the response describes one battle ... `survivor` ..." Contradicted by FightResponse in fight-api.ts and OutcomeAccumulator.summary.

## CONTEXT.md Design docs rows

None to add or change.

## Checks

- `git grep -n "Current code" -- docs` after the edit: no matches. Before editing, also grepped "today's code" and "planned change" repo-wide (excluding golang/): only this doc.
- Lint/codegen: not run. `commands.lint` is tsc + jscpd (does not check docs), `commands.codegen` is empty. No links added. Diff touches only docs/combat-simulator.md; Mermaid and all rule text unchanged.

## Out-of-scope findings

- docs/combat-simulator.md "Not modeled" says support for Character and Nazgul leadership "is planned for a later release". That is a roadmap statement, not a rule, and I could not verify it from code; left unchanged. Owner may want it cut or confirmed.
- Extension points sentence "None of these rules is modeled today" still accurate (BattleOptions = {} in battle.ts).
- The "within 10 seconds" claim for N = 100,000 is a performance requirement I did not measure.

## Status

needs_review
