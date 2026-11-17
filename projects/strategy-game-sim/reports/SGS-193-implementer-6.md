# SGS-193 implementer-6 (Rework 1)

- Branch: sgs-193-step-annotations-name-the-wait, tip a84332a347505df974d5c36e87a4e7921d388bb0 (was cd3add99)
- Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-193-step-annotations-name-the-wait
- Own-commit check: skipped (no origin/<branch> ref before the call); checkout.sh exited 0, "reused".

## Files touched
- acceptance/aoe4-step-annotations.spec.ts: busy test and the loop test call `openTable(page, text)`; the `showView(page, 'table')` and step-run visibility lines at the top of `expectTableAndPopover` are deleted. 2 insertions, 8 deletions. No assertion changed.

## Checklist
- [x] Busy test uses `openTable(page, text)`.
- [x] Loop test uses `openTable(page, text)`; top-of-helper table lines deleted.
- [x] No assertion changes.

## Checks
- lint (`npx tsc --noEmit && npm run lint:dup`): pass, 0 clones.
- Unit tests and build not re-run: the diff touches only an acceptance spec. Acceptance not run (owned by the acceptance gate).
- Pre-existing tests edited: none besides this spec's own new tests.
- Mutation checks, doc claims, pinned outputs: none (refactor of test setup only).

## Status
needs_review
