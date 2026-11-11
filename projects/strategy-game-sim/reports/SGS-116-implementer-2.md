# SGS-116 implementer 2 (re-spec 2 pass)

- Branch: sgs-116-step-table-readability, tip f685e48aeedf1039a94dea5df2a2195af4827376 (was 22ba507)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-116-step-table-readability

## Files touched
- acceptance/aoe4-step-annotations.spec.ts: layout case "the longest prebuilt step table fits the Build panel and the editor is not clipped". `step-table-scroll` is scrolled fully right; the result is `{ panelFits, scrollsInside, deletesInside }`. `scrollsInside` is computed `overflow-x === 'auto'` on the scroll box. `deletesInside` requires every `step-delete` rect to lie within the scroll box (left and right). The text-view check is unchanged.

## Tests
- Layout case run alone: 1 passed with the fix. Full suite and acceptance were not re-run, because only this test changed.
- tsc --noEmit and lint:dup: ran in one chain, exit 0 (the output tail showed only jscpd's footer). Build and codegen not re-run (test-only change).
- Pre-existing tests edited: none this pass.
- Doc claims: none added.

## Mutation check
- Removed `overflow-x: auto` at components/apps/aoe4-build-order/step-table.module.css:8. The case failed on the `toEqual` assertion: panelFits false, scrollsInside false, deletesInside false. Restored with git checkout; the tree is clean.

## Invariant check
No invariants apply to this ticket.

## Out-of-scope findings
None.

Status: needs_review
