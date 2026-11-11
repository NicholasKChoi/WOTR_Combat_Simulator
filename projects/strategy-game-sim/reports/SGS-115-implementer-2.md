# SGS-115 implementer 2 (Rework 1)

- Branch sgs-115-split-scroll, tip 637e1ad27e268bb5056254d110a0581bd12fd96b, worktree /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-115-split-scroll

## Files touched
- acceptance/aoe4-split-scroll.spec.ts: "each column scrolls on its own" now scrolls the column to its end, asserts the page can still scroll (scrollHeight > innerHeight), moves the mouse over the column, `page.mouse.wheel(0, 200)`, waits two animation frames, then asserts window.scrollY and the other column's scrollTop are unchanged.
- docs/aoe4-build-order.md:851: replaced verbatim with the given text.

## Doc claims
- "does not scroll vertically itself (in the side-by-side layout the Build column scrolls, below 1200 px the page does; a line longer than the box scrolls sideways)": text given verbatim by the ticket; backed by workbench.module.css `.column` and the tabs layout where the page scrolls.

## Mutation check
- Removed `overscroll-behavior: contain` from `.column` (workbench.module.css): test failed at aoe4-split-scroll.spec.ts:74 (`expect(after.page).toBe(before.page)`, expected 194, received 245). Restored; git diff shows the CSS unchanged.

## Results
- `npx playwright test aoe4-split-scroll` passed (whole spec); `npx tsc --noEmit` clean; `npm run lint:dup` 0 clones. Full `npm test`, build and other specs not rerun (only a spec and a doc line changed).
- No pre-existing tests edited besides the new spec's own case.

## Status
needs_review
