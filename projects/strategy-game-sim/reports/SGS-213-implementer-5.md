# SGS-213 implementer report 5

Status: needs_review

- Ticket: SGS-213. Branch: `sgs-213-step-popover-beside-text`. Base: `origin/main` = 5eac2142954b5a42351f433956297e4b921f77bc.
- Tip: 1e46dd41cc33966556a16201980fe1f691e39120 (two commits: 58b8a3c main change, 1e46dd4 one extra unit row found by mutation).
- Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-213-step-popover-beside-text`. It was new, so no own-commit check applied.

## Files touched
- `components/apps/aoe4-build-order/annotation-popover.tsx`: `place` replaced by exported pure `placePopover({anchor, textarea, popover, viewport})`. Beside the textarea (left = textarea.right + 4, top = anchor.top clamped vertically) when it fits in the viewport; otherwise the old below/above-anchor logic with the viewport clamp. `AnnotationPopover` takes a `textarea` ref and re-places on scroll and resize as before.
- `components/apps/aoe4-build-order/build-text-editor.tsx`: passes `textareaRef` to `AnnotationLine`; renders no popover when `hasPopover(run)` is false.
- `components/apps/aoe4-build-order/step-annotations.ts`: `hasPopover(run)`, false only for `completed` with `waitSeconds === 0`.
- `components/apps/aoe4-build-order/annotation-popover.test.ts`: 8 `placePopover` rows.
- `components/apps/aoe4-build-order/step-annotations.test.ts`: `hasPopover` table plus 3 `combineRuns` cases.
- `acceptance/aoe4-step-annotations.spec.ts`: hover test rewritten, other index-based tests moved to popover-showing steps, new placement tests.
- `docs/aoe4-build-order-ui.md`: text-view paragraph and the run cell paragraph.

## Tests run
- Unit: `npm test` gives 3116 passed, 15 skipped. New: placement (10 vitest cases across 8 rows plus table) and predicate (7 table rows plus 3 repeated-step cases). Invariants encoded: the textarea edge decides placement, top aligns with the anchor, clamps stay inside the viewport, and the predicate is applied to the combined run.
- Acceptance spec `acceptance/aoe4-step-annotations.spec.ts`, whole file: `npx playwright test acceptance/aoe4-step-annotations.spec.ts --reporter=line` gives 31 passed. Setup: `bash bin/link-node-modules.sh . && npm run acceptance:setup`. I did not run the rest of the acceptance suite.
- Spec changes: the old hover test is rewritten (no-wait step shows none on hover or caret; not-reached shows one and hides on leave). Index-based tests now pick steps from `simulateOk` via `popoverSteps` (the caret test, shared-active test, viewport test, and the blank/comment test, which asserts its last line is popover step `[0]`). New: 4 placement tests (`MIN_SUPPORTED_VIEWPORT` and `WIDE_VIEWPORT`, hover and caret). Each reads textarea, popover and active line rects in one `evaluate` under `expect.poll` and asserts rightOfTextarea, apart (box does not intersect) and levelWithLine (within 1 px, the line centred; the caret case re-centres after the caret scrolls the page). `popoverSteps` filters with the production `hasPopover`, so spec step selection is not independent of it; the no-wait test uses its own status/wait filter.
- Pre-existing tests edited: `acceptance/aoe4-step-annotations.spec.ts` "hovering a completed no-wait step and a not-reached step shows the popover..." (rewritten as the ticket's Scope names). The caret, shared-active-step, viewport and blank/comment tests changed only the step index; assertions kept.
- lint: `npx tsc --noEmit && npm run lint:dup`: 0 errors, 0 clones. Build: `npx next build` succeeded. Codegen: none set.

## Doc claims
- `docs/aoe4-build-order-ui.md` text-view paragraph: "except for a completed step that waited for nothing (for a repeated step, one whose copies all completed with no wait in total), which has none" (`hasPopover` on the `combineRuns` run in `build-text-editor.tsx:AnnotationLine`).
- Same paragraph: "opens beside the text (level with its line, to the right of the textarea, so it never covers the build text; when there is no room there it falls back to just below the line, or above it near the viewport bottom, and may overlap the text)" (`annotation-popover.tsx:placePopover`).
- Run cell paragraph: "The popover's `Blocked by:` part, for a step that has a popover, shows the same text."
- Searched `README.md`, `lib/aoe4-build-order/README.md`, `page-help.tsx`: no popover statements.
- No new code comments.

## Pinned outputs
None.

## Bug regression at base
Base 5eac214 in scratch `regress-213`, with the new spec copied in and only the `hasPopover` export added to `step-annotations.ts` (so the spec imports). Command: `npx playwright test acceptance/aoe4-step-annotations.spec.ts -g 'step annotation popover'`. Result: 5 failed, 6 passed. The no-wait test fails at `toHaveCount(0)` (spec line 221); the 4 placement tests fail on `rightOfTextarea: false` (expected true). Scratch removed.

## Mutation checks
Ran in scratch `mutate-213` (branch checkout plus committed state). Provisioning: `link-node-modules.sh .` and `npm run acceptance:setup`. Task-checkout `git status --porcelain --untracked-files=all` was empty and `git diff --binary HEAD | git hash-object --stdin` was e69de29... before the scratch and again after; they match. Each break was reset with `git checkout -- <file>` and `git diff --exit-code` passed (RESET-OK). Scratch removed.

`placePopover` (annotation-popover.tsx), unit:
- `if (false)` for the beside branch: fails the "past the right edge", "ignores anchor left edge", both beside vertical clamp rows.
- left = `anchor.left` (rejected alternative: ignore the textarea edge): fails 3 rows including "ignores the anchor left edge".
- top = `anchor.bottom + gap` (below-line alternative): fails "level" and "above the top margin" rows.
- `if (true)`: fails all 3 fallback rows.
- beside top unclamped: fails the near-bottom and above-top-margin rows.
- fallback always-below: fails "above the anchor when it does not fit below".
- fallback left unclamped: fails the near-right-edge row.
- no gap: fails the past-right-edge and near-bottom rows.
- fallback top clamp removed: passed at first, so I added the "fits neither below nor above" row; it now fails.

`hasPopover` (step-annotations.ts), unit:
- status only: fails "completed with 5" and the repeated-copy-waited row.
- wait only: fails the in-progress/waiting/not-reached rows and the in-progress repeated row.
- `waiting`-only exception: fails in-progress, not-reached and repeated in-progress.
- always true: fails completed-0 and the repeated zero-wait row.
- inverted for non-completed: fails in-progress 5 and waiting 5.
- `combineRuns` takes the first copy's wait (the single-copy alternative): fails "repeated, one waited" and the combineRuns sum test.

Acceptance:
- Beside branch off (base behaviour): all 4 placement tests fail on rightOfTextarea/apart/levelWithLine.
- Top = `anchor.bottom`: 4 placement tests fail on levelWithLine only.
- Beside top unclamped: both "inside the viewport" tests fail.
- `hasPopover` always true: no-wait test fails at `toHaveCount`.
- Editor guard also shows the popover while the textarea is focused: the no-wait test fails (the caret half; the hover half stays passing).
- `hasPopover` false: the not-reached `toBeVisible` fails (line 231).
- `completed`-only: the no-wait test fails.
Not separately broken: the "start line" test and the existing "Still waiting" text tests, which I did not change.

## Invariants
A1, A2, A3 upheld: display only, no simulation, payment or timing code touched.

## Unverified assumptions added
None.

## Out-of-scope findings
- A caret move by ArrowDown scrolls the page so the caret line can land at the viewport bottom, clamping the popover vertically; accepted by the ticket (only the clamp is asserted there).
- Untracked `lib/aoe4-build-order/zz-analyze.local.test.ts` in the main checkout is not mine.

## Status
needs_review
