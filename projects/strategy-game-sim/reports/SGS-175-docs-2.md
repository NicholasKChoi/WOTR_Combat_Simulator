# SGS-175 docs report 2 (Rework 1)

- Ticket: SGS-175. Branch: sgs-175-starcraft-helper-design-doc. Tip: ec0bb7c391bd8ad7c8887d303433090763b28ed6.
- Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-175-starcraft-helper-design-doc

## Docs touched

- `docs/starcraft-helper.md`: the two Required-fixes replacements (lines 17-21 and 33). Wording is exactly the ticket's; only line wrapping at ~110 columns was added to match the file.

## Doc claims (changed)

- "no other code changes, as long as the player list keeps at least 3 names and the map pool at least 5 maps": the pairing loop needs more than one pairing (3 names gives 3), and the cap of 3 strikes plus the shown map bans 4, so 5 maps always leave one eligible.
- "With fewer than 3 players there is a single pairing, so every Fighter Select click after the first would never end": `GetNewPartners` redraws until the text differs from the shown one; first click compares against `''`.
- "with 4 or fewer maps, 3 strikes plus the shown map can ban every map, and Map Select shows `FAILURE`": `getMapText` returns `FAILURE` when every map is banned.
- "With a list that yields a single possible pairing, every click after the first would never end.": same retry loop; the first click starts from `''`.

(Both claims were stated by the ticket as the exact text; I re-checked them against the logic described in the existing doc and ticket, not by re-reading the page source in this pass.)

## Removed claims

- "To update a list, edit the array; no other code changes." (true only at some list sizes) and "A list with a single possible pairing would never end." (false for the first click): replaced as above.

## CONTEXT.md Design docs rows

No change from this pass (see ticket On merge).

## Checks

- Lint: REPO.md/the repo has no markdownlint config found in the checkout; none run. Codegen: not applicable. No links added or changed.
- Ticket Rework 1 boxes ticked.

## Out-of-scope findings

none

## Status

needs_review
