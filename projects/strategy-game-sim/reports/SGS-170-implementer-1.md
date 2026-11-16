# SGS-170 implementer report 1

- Ticket: SGS-170. Branch: sgs-170-step-annotation-hover-popover. Tip: 3e4c403 (single commit on origin/main).
- Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-170-step-annotation-hover-popover
- Status: needs_review

## Files
- components/apps/aoe4-build-order/annotation-popover.tsx (new): portal to document.body, position: fixed, placed below the line (above when no room), left/top clamped to the viewport, recomputed on scroll (capture) and resize.
- components/apps/aoe4-build-order/build-text-editor.tsx: `title` removed; popover rendered when `run !== null && active`; pointer handlers untouched.
- components/apps/aoe4-build-order/step-annotations.ts: `annotationDetailText` (pure).
- components/apps/aoe4-build-order/workbench.module.css: `.annotationPopover` (fixed, max-content, pointer-events none, z-index 1080).
- components/apps/aoe4-build-order/step-annotations.test.ts: table test for the text function.
- acceptance/aoe4-step-annotations.spec.ts: old title test replaced by popover tests (see below).
- docs/aoe4-build-order-ui.md: hover sentence and last-wins sentence.

## Tests
- Vitest full suite: 84 files passed, 2613 passed, 15 skipped. `annotationDetailText` rows: completed with wait, completed no wait (nothing), waiting and not-reached (Still waiting).
- Playwright (ran only this spec's popover/gutter tests, 9 passed; the full acceptance suite was not run): no title attribute and no Started/Finished text; gutter aria-hidden and no focusable lines; hover completed no-wait and not-reached step (hidden, visible with text, hidden after leave); start line (no run) shows no popover; caret-only via Control+Home/ArrowDown shows, moves, hides on a no-run line and on blur; hover-over-caret last-wins (B only, then none after leave, returns only on next caret move); viewport containment at 360/768/1280 for first and last line, one evaluate under expect.poll, also asserts not inside `build-order-annotations`.
- Existing test edited: acceptance/aoe4-step-annotations.spec.ts "the gutter title reads Still waiting..." read `getAttribute('title')`; replaced by popover reads plus a no-title test (ticket rule). Hover shading tests untouched.

## Mutation checks
- annotation-popover.tsx left clamp replaced by `anchor.left`: 360px viewport test failed (Expected "ok", Received rect past 360 wide). Undone.
- build-text-editor.tsx onPointerLeave made a no-op: the shows-at-once test failed on `toBeHidden` (still visible) and the last-wins test on `toHaveCount(0)`. Undone.
- step-annotations.ts `'nothing'` -> `'none'`: unit test failed (Expected "Waited 0:00. Blocked by: nothing"). Undone.

## Doc claims
- docs/aoe4-build-order-ui.md: "hovering the annotation, or putting the caret on its step line, shows a popover at once (not a delayed browser title) ... the popover is drawn outside the narrow annotation column, stays inside the viewport and ignores the pointer, and the gutter lines stay unfocusable." True per annotation-popover.tsx (portal, clamp, `pointer-events: none` in CSS) and build-text-editor.tsx (gutter `aria-hidden`, no tabIndex).
- "leaving a hovered annotation clears the shading and the popover until the next caret move, and blurring the textarea clears both." True: both follow `activeStep`, pointer leave and blur set it null.
- Comment in annotation-popover.tsx: portal rationale (clip and container-type containing block).

## Gates
- tsc --noEmit clean; lint:dup 0 clones; next build succeeded; codegen not set.
- Popover renders only while shown (absent from the DOM otherwise), so hidden tests pass on absence, plus `toBeVisible` when shown.

## Notes
- Popover and `StepTimes` rows: `li.textContent` unchanged since the popover is portalled.
- Unverified assumptions added: none. No out-of-scope findings.
