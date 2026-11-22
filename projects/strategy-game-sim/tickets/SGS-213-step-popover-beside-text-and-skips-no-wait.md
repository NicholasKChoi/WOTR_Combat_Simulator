# SGS-213: Open the step popover beside the build text and skip it for no-wait steps

- **Type**: Bug
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: medium
- **Risk**: standard
- **Invariants**: AoE4 Build Order Simulator (A1, A2, A3; their `Paths:` match `components/apps/aoe4-build-order/**`; the change is display only and touches no simulation number, payment check or timing)
- **Unverified assumptions**: none
- **LOC estimate**: 70 (`place` in `annotation-popover.tsx` and its call site, the popover guard in `build-text-editor.tsx`, one predicate in `step-annotations.ts`)
- **Depends on**: none
- **On merge**: none
- **Source**: BACKLOG.md "(standalone bug) AoE4 build-order step popover covers the build text and shows for no-wait steps" (owner via session, 2026-11-21)

## Context

In the text view, hovering a step's annotation (or putting the caret on its line) opens a popover. Today `place()` in `components/apps/aoe4-build-order/annotation-popover.tsx` puts it just below the active line's gutter `<li>` (`left = anchor.left`, `top = anchor.bottom + 4`), so it grows rightward over the next lines of the build text, and `AnnotationLine` in `build-text-editor.tsx` renders it for every line with a run, including a completed step that waited for nothing (text `Waited 0:00. Blocked by: nothing`), which tells the owner nothing. The existing spec asserted both behaviors (hover test for a no-wait step) and had no placement check, which is why neither was caught.

Docs: `docs/aoe4-build-order-ui.md` (the text-view paragraph that describes the annotation popover and "drawn outside the narrow annotation column"; the step run cell paragraph that says the popover's `Blocked by:` part shows the same text)

## Scope

- Placement. Change `place()` in `components/apps/aoe4-build-order/annotation-popover.tsx` (and what `AnnotationPopover` passes it) so the popover opens level with the active line (its top aligned with the line's top) and to the right of the textarea, starting past the textarea's right edge, in the free space or over the results column, so it never covers build text. The textarea's rect comes from the editor (`textareaRef` in `build-text-editor.tsx`, passed down through `AnnotationLine`). Keep the existing viewport clamp (margin, vertical clamp) and its scroll/resize re-placement. When the popover does not fit to the right of the textarea inside the viewport, fall back to the viewport clamp (it may then overlap text; that is accepted). Make the placement a pure function of rects (anchor, textarea, popover, viewport size) that a unit test can call without a DOM.
- No-wait steps. Add a pure predicate in `components/apps/aoe4-build-order/step-annotations.ts` that says whether a run's popover is shown: false only for `status === 'completed' && waitSeconds === 0`, true for every other status (`waiting`, `not-reached`, `in-progress`, and completed with a wait). `AnnotationLine` in `build-text-editor.tsx` renders no `AnnotationPopover` for a run where it is false, on hover or on caret. The rule applies to the run the line shows, which for a repeated step is the combined run (`combineRuns`), so a repeated step whose copies all completed with zero total wait also shows no popover, and its per-copy lines are not shown either. The hover and caret highlight (`data-gutter-active`) and the chart shading are unchanged.
- Docs. Fix `docs/aoe4-build-order-ui.md`: the text-view paragraph (the popover opens beside the text, not below the line; a completed step that waited for nothing has none) and any statement that every step line with a run shows a popover. Search `README.md`, `lib/aoe4-build-order/README.md` and `components/apps/aoe4-build-order/page-help.tsx` for the same statements (the first search found none outside the UI doc).
- Tests that this change alters. Hover test "hovering a completed no-wait step and a not-reached step shows the popover at once..." in `acceptance/aoe4-step-annotations.spec.ts` expects the no-wait popover: rewrite it so the no-wait step shows no popover on hover or caret and the not-reached step still shows one. Other tests in that spec pick lines by index (`lineAt(page, 0)`, the first and last line in the viewport test, the caret and shared-active-step tests, the "blank, comment and unparseable" test's last line) and may now land on a no-wait step with no popover; every such test selects a step that shows a popover (waited, waiting, or not reached) instead of keeping an index that no longer shows one. Examples only; search the spec for every use of the popover locator. Add a placement check at `MIN_SUPPORTED_VIEWPORT` and `WIDE_VIEWPORT` (from `acceptance/helpers.ts`), for hover and for caret: with a popover open, its left is at or right of the textarea's right edge and its box does not intersect the textarea's box, asserted unconditionally (the page's two equal columns leave room right of the textarea at both sizes; the no-room fallback is covered only by the unit test). The same check scrolls a mid-list line that shows a popover to the viewport centre (as `lineAt` does) and asserts the popover's top is within 1 px of the line's top; the near-bottom case stays an inside-the-viewport assertion. Read all rects in one `evaluate` under `expect.poll` (LESSONS: layout values). Add unit tests for the pure placement function and the pure predicate (`annotation-popover.test.ts`, `step-annotations.test.ts`); the predicate test also applies it to `combineRuns` of several copies, so a predicate applied to a single copy instead of the combined run fails.

**Out of scope:** the popover text, its per-copy lines, the run cell and step table (they keep showing no-wait steps' times), the gutter styling, simulation code and API.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] (respec 1) With a popover open for a line that has one, at `MIN_SUPPORTED_VIEWPORT` and at `WIDE_VIEWPORT`, for hover and for caret, the popover's left is at or right of the textarea's right edge and its box does not intersect the textarea's box. The acceptance assertion is unconditional (no skip when it does not fit); it fails if the popover is placed below the line as at the base.
- [ ] (respec 1) For a mid-list line scrolled to the viewport centre, the popover's top is within 1 px of the active line's top (acceptance test); the last line near the viewport bottom keeps its popover inside the viewport (existing viewport test).
- [ ] (respec 1) A unit test on the pure placement function covers: enough room right of the textarea (placed past its right edge, top equal to the anchor's top), too little room right (falls back to the viewport clamp, inside the viewport), and an anchor near the viewport bottom (vertically clamped inside the viewport). Its rows put the anchor's left well left of the textarea's right edge, so a test fails if the textarea edge is ignored.
- [ ] A completed step with `waitSeconds === 0` renders no popover on hover and none on caret; a completed step with a wait, an in-progress, a waiting and a not-reached step still show theirs. A unit test on the predicate covers each status and the zero and non-zero completed cases (a test fails if the check uses status only or wait only), and an acceptance test hovers a no-wait step and puts the caret on it and expects the popover locator to have count 0, which fails at the base.
- [ ] (respec 1) For a repeated step the rule is applied to the combined run: a unit test applies the predicate to `combineRuns` of two completed copies with zero waits (false), and of completed copies one of which has a non-zero wait so the total is above zero (true). A test fails if the predicate is applied to a single copy instead of the combined run. The popover's content for a repeated step that does show one is unchanged and is not re-asserted by this ticket.
- [ ] The existing acceptance tests of the popover (caret moves it, last event wins, blur hides it, blank/comment/start lines show none, inside-viewport at both sizes, "Still waiting. Blocked by:" texts) keep their assertions and pass, using steps that show a popover.
- [ ] No doc describes the popover as opening below the line or as shown for a no-wait step: `docs/aoe4-build-order-ui.md` states the placement beside the text and the no-wait exception.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-21

- Underspecified: the placement check named 1280 px (the split viewport, not the minimum) in the criterion but "minimum supported" in Scope, and was conditional on "where it fits", so it could pass by skipping; the top-align criterion's "unless clamped" had no observable condition; the repeated-step criterion named no test.
- Changed: placement is asserted unconditionally at `MIN_SUPPORTED_VIEWPORT` and `WIDE_VIEWPORT`; top alignment is asserted within 1 px for a mid-list line centred in the viewport, with the clamp left to the unit test; the repeated-step rule is a unit test of the predicate on `combineRuns` output, and the "per-copy lines as before" claim is dropped as unchanged behavior.
- No branch work exists yet; nothing to keep or discard.

## Rework 1 - 2026-11-21 (review)

Review report: reports/SGS-213-review-6.md (REQUEST CHANGES at tip 1e46dd41; every other check passed, including all acceptance criteria, lint, build, and UI inspection).

Findings:
- `components/apps/aoe4-build-order/annotation-popover.test.ts:49-71` (convention): five `it` blocks each call `placePopover(rects(<overrides>))` and compare with an expected position; they differ only in input and expected value, so they must be rows of one table.

Required fixes:
- [x] In `annotation-popover.test.ts`, replace those five `it` blocks with one named `it.each<[string, Partial<PlacementRects>, { left?: number; top?: number }]>` table checked with `toMatchObject`. Keep the same names, overrides and expected values (two rows keep both `left` and `top`; three keep `top` only); the exact rows are in the review report. Leave the first three blocks as they are. Re-run the recorded mutation breaks for those five cases against the table and confirm each still fails.
