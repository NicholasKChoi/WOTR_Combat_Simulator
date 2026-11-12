# SGS-132 spec-readiness gate 4 (re-spec 3)

Verdict: READY

Read at `origin/main` after `git fetch origin`; branch `sgs-132-save-panel-live-status` at `edca704` read via git, not the working tree.

## What was checked against the code

- `useRunBarHeight` at base writes `Math.ceil(height + margin)` to `--aoe4-run-bar-height`; `.workbenchSplit` uses `calc(100dvh - var(--aoe4-run-bar-height))`. The ticket's sub-pixel explanation matches the code.
- `acceptance/aoe4-small-screen.spec.ts` "stays sticky at the top" (both viewports) polls `toEqual({ scrolled: true, top: 0 })` (line 84-87 area). The sticky `position` check and the `scrolled` check exist as the ticket describes. A tolerance rewrite is a small, well-defined edit.
- `acceptance/aoe4-split-scroll.spec.ts` "each column scrolls on its own" relies on the `scrollY < max` poll after `scrollColumn`. `scrollInstantly(page, top)` exists in `acceptance/helpers.ts` at base. Setting the page to 0 before each wheel gives room (max > 0, since the page header sits above the bar). `.column` has `overscroll-behavior: contain` at base; removing it lets the wheel chain to the page, so the unchanged `after.page === before.page` assertion fails. The mutation is real.
- Base `build-input.tsx` has `auto-run-status` after `SaveBuild` (the last child). The branch diff moves it before `SaveBuild`; the ticket correctly calls for the revert. SGS-133 (spec_ready) depends on the last-child order, matching its Scope.
- `use-run-bar-height.ts` is untouched on the branch (no diff), so criterion 62 holds today.
- Risk `standard` is right: no `criticalPaths` symbol, no `strongModelTriggers` item. Invariants `none` is consistent (no engine, data or simulation change). No new input boundary. Docs are in Scope. On merge `none` is valid. Open questions: none. No overlap with other open tickets; SGS-133 explicitly builds on this one.

## Gaps

None blocking.

## Notes (non-blocking)

1. The small-screen mutation ("`.runBar` to `position: static` from 768px up") fails the unchanged `toBe('sticky')` assertion first, so it does not show that the new sub-1px tolerance still catches an unstuck bar, which is the stated reason for the tolerance. A sharper mutation is removing `top: 0` from `.runBar` (position stays `sticky`, the bar scrolls away, only the tolerance check can fail). Suggest the implementer run that one, or both.
2. The tolerance edit changes the poll's shape (a computed `Math.abs(top) < 1` in place of a literal `top: 0`). That is within "no other assertion changes" as long as the `scrolled` and `position` checks keep their form.
3. SGS-133 caps and changes the bar height again, so it may re-expose the same sub-pixel sensitivity elsewhere. SGS-133's own criterion keeps existing tests unchanged; if another test breaks there, it would need the same tolerance treatment. Not this ticket's problem.
4. Revert scope for the implementer: only the `auto-run-status` move in `build-input.tsx`; the rest of the branch stands per the ticket's re-spec note.
