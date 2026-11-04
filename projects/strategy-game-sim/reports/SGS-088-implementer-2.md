# SGS-088 implementer-2 (Rework 1)

Branch sgs-088-aoe4-workbench-ui-state-kept, rebased onto main 2a36296 (the previous commit is now 8e9c276), tip 515e1c2.
Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-088-aoe4-workbench-ui-state-kept
Status: needs_review

## Required fixes
- [x] The active disabled view button keeps its fill. `workbench.module.css` has a new rule `button.activeView:disabled` that sets `--bs-btn-disabled-bg`, `--bs-btn-disabled-border-color` and `--bs-btn-disabled-color` to the `--bs-btn-active-*` values. `build-input.tsx` adds `styles.activeView` next to `active` on the pressed button.
- [x] The acceptance test "the Text and Table buttons are disabled while Results is shown" (`acceptance/aoe4-step-table.spec.ts`) now has an `expect.poll` over one `page.evaluate`. It asserts that the pressed (table) button's computed `backgroundColor` differs from the unpressed (text) button's while both are disabled.
- [x] Rebased onto 2a36296 with no conflicts.

## Mutation check
I removed `styles.activeView` from the button's classes. The new background assertion failed (spec line 690). I then restored the change. My `git checkout` also reverted my uncommitted `build-input.tsx` edit, so I re-applied it and re-ran the test, which passed.

## Checks (after the rebase)
- `npx tsc --noEmit`: clean.
- `npm run lint:dup`: 0 clones.
- `npm test`: passes (the tail of the output showed no failures; I did not record the pass count).
- Playwright `acceptance/aoe4-step-table.spec.ts` and `acceptance/aoe4-build-order-pin-compare.spec.ts` (run before the last `build-input.tsx` refactor): 62 passed.
- After that refactor (the `cn` call became an array argument) I re-ran only the single "disabled while Results" test: passed. tsc and lint:dup were re-run too.
- I did not re-run the full `npm run acceptance` suite or `npx next build`.

## Doc claims
No doc changes. `docs/aoe4-build-order.md:841` already says "the active view stays marked". It is now true visually because of the new CSS rule, and `build-input.tsx` still sets `aria-pressed` and `active`.

## Tests edited
Only the test added earlier in this ticket (the "disabled while Results" test). No pre-existing test was edited in this pass.

## Out-of-scope findings
None.
