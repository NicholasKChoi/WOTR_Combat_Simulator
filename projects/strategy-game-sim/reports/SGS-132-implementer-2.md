# SGS-132 implementer pass 2 (Re-spec 3)

Ticket SGS-132, branch `sgs-132-save-panel-live-status`, tip `5ab8f45e3c9f9b7c1674532ca60abed475d2bbcb` (on top of edca704), worktree `$FACTORY_DIR/worktrees/sgs-132-save-panel-live-status`.

## Files touched (this commit)
- `components/apps/aoe4-build-order/build-input.tsx`: `auto-run-status` moved back after `SaveBuild`; file is now identical to base.
- `acceptance/aoe4-small-screen.spec.ts`: "stays sticky at the top" now checks `Math.abs(top) < 1` (`stuck: true`) with the `scrolled` and `position: sticky` checks kept.
- `acceptance/aoe4-split-scroll.spec.ts`: "each column scrolls on its own" calls `scrollInstantly(page, 0)` before each wheel and polls `{room: scrollY < max, scrollable: max > 0}` equal to `{true, true}`; post-wheel assertions unchanged. Imports `scrollInstantly`.
- `docs/aoe4-build-order.md`: Page paragraph reordered: select, duration, toggle, save panel on its own row, then run status "which comes last".

`use-run-bar-height.ts` unchanged (verified `git diff main`), no pixel heights or min-height added.

## Tests
- `npx playwright test acceptance/aoe4-` : 804 passed (includes the two previously failing specs, the new save-status spec, all other AoE4 specs).
- `npm test`: 74 files passed, 2370 passed, 13 skipped.
- `npx tsc --noEmit && npm run lint:dup`: clean, 0 clones.
- `next build`: succeeded. Codegen: not configured.

## Pre-existing tests edited
- `acceptance/aoe4-small-screen.spec.ts:stays sticky at the top` (tolerance below 1px) and `acceptance/aoe4-split-scroll.spec.ts:each column scrolls on its own` (sets own scroll position): the Scope carve-out for these two tests.

## Doc claims
- "a save panel (`save-panel`) on its own row, with the save buttons ... and the save status (see below), and the run status (`auto-run-status`), which comes last." True: `build-input.tsx` renders `SaveBuild` then `auto-run-status` as the form's last child; `.savePanel` is `flex: 1 1 100%`.

## Mutation checks
- Sticky, `.runBar` without `top: 0` (`workbench.module.css:3` deleted): failed at 768 px on `stuck` (expected true, received false). Undone. (The 1280 case passes under that mutation because the bar still sits at top by default there.)
- Sticky, `.runBar` `position: static` (`workbench.module.css:2`): both viewports fail on the unchanged `expect(position).toBe('sticky')` (Received "static"), as the lead predicted. Undone.
- Split-scroll, `overscroll-behavior: contain` removed from `.column`: failed on `expect(after.page).toBe(before.page)` (expected 0, received 200). Undone (file restored from commit).

## Invariants, unverified assumptions
No new unverified assumptions. No invariant deviation.

## Out-of-scope findings
Local `main` is stale relative to origin/main (diff against it shows unrelated package.json and tsconfig changes); the branch's own diff against its base is clean.

Status: needs_review
