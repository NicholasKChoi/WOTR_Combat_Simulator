# SGS-133 ticket re-spec 1

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-133-split-scroll-anchoring-and-run-bar-cap.md
Lint: clean.

## Summary

SGS-133, "Stop scroll anchoring in the split layout and cap the run bar height". Component aoe4-build-order, M9 / M9.12, risk standard, about 20 business-logic lines (CSS in `workbench.module.css` plus a module class on the page `<section>` in `pages/apps/aoe4-build-order.tsx`). Depends on SGS-132. The criteria cover: case (a) anchoring, with a precondition and a mutation run that removes the rule wherever it was placed; column positions unchanged; case (b) cap, with the precondition asserted first; the height property; case (c) reachability of `save-copy-cancel`; `auto-run-status` reachable at max `scrollTop`; no horizontal overflow and an unclipped focus ring at 768 and 1280; static and uncapped below 768; existing tests; helpers defined once with no jscpd clone; docs; gates; invariants. No diagram: single component, outside the core control loop.

## Gaps folded in

1. **Capped state (gap 1).** I read `save-build.tsx` at origin/main. `openForm` does not clear `saved`, and the link stays while the settled input is unchanged, so the link and the copy form can be open together: save a copy with storage writes throwing, then click `save-build-copy` again. The existing my-builds layout test ("layout of the save panel") checks only the copy form alone and the link alone, not this combined state. SGS-132 replaces the link-panel row with the save-panel row, so the total row count may not change. I could not confirm that either way: SGS-132 has no branch, and I did not run a browser. The ticket therefore states a rule:
   - Build this state at 1280x720.
   - If it does not exceed the cap, add real content in a fixed order: the clipboard-refused `copy-saved-link-hint`, then `save-copy-name-error`.
   - The first assertion is the precondition (the elements are shown and `scrollHeight > clientHeight`).
   - The viewport stays fixed. If even the full state does not exceed the cap, the implementer stops with a `designer` question.
2. **`overflow-anchor` placement (gap 2).** The rule goes on the page section, the nearest common ancestor of the run bar and the split, through a new module class. If case (a) still fails there, it falls back to a module-scoped `html` rule (`:global(html):has(.runBar)` as an example). If neither placement fixes case (a), the implementer stops and reports, because the drop would not be anchoring. The mutation removes the rule wherever it was placed. `useRunBarHeight` writes the property synchronously in the ResizeObserver callback, which makes anchoring the likely cause rather than scroll clamping. This stays listed as an unverified assumption.
3. **Helpers (gap 3).** The ticket names the local helpers in `aoe4-my-builds.spec.ts`: `saveCopy` with `submitCopy`, `blockStorageWrites`, and the `refused` clipboard scripts. Any helper SGS-132 already moved is used from `acceptance/helpers.ts`; any that is still local is moved there and imported by both specs.

I also folded in these non-blocking notes:
- No horizontal overflow, and focus rings not clipped.
- An observable `auto-run-status` check.
- Explicit steps so the link survives the reopened copy form.
- A computed `max-height: none` check below 768px.

## Open questions

none (a conditional `designer` stop is written into Scope for the case where no real UI state exceeds the cap at 1280x720)

## Overlap

None found. SGS-141 depends on this ticket. SGS-132 may move some of the same helpers; the ticket handles either order.
