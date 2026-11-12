# SGS-140 review 1

Branch `sgs-140-editor-compact-mode`, tip 2f18733 (task commit diffed against its parent; the branch base already contains SGS-128). Reviewed in the task worktree read-only.

## Verdict: NEEDS_SPEC

The code is correct against everything the ticket states except one point: the ticket's numbers do not hold, so the implementer had to go beyond the permitted levers. No code defect found. If the spec decision below is "ratify", the verdict becomes APPROVE with no code change.

## Spec gaps (NEEDS_SPEC)

Who decides: spec owner / ticket author (owner decision 2A context).

1. The ticket and design C14 assume 1rem = 16px ("margin with C14 values alone is a few pixels"). `styles/global.css:8` sets `html { font-size: 18px }`, so 48rem = 864px and the 1280x800 editor is 534px. With C14 values alone criterion 2 fails (content 375 vs probe 453.7). The ticket's own fallback ("may also narrow the gutter's `min-width` and the annotation padding") is not enough either. The implementer added levers outside that list, all inside the compact container query:
   - `.textarea` padding-left/right 0.75rem -> 0.25rem (`workbench.module.css`, compact block)
   - `.gutter` padding-right 0.5rem -> 0.125rem
   - `.annotations` width 4.7ch (ticket: "at most 8ch", so 4.7ch complies), padding-right 0 (is "annotation padding", permitted), gutter `min-width: 0` (permitted).
   Only the textarea padding and gutter padding-right exceed the enumerated levers; nothing outside compact mode changed (verified in the diff; the wide-mode test passes by reading and the wide rules are untouched). The criteria themselves are met (content 455 >= probe 453.7). Spec must decide: (a) ratify these levers, or (b) pick another (smaller compact font, hiding the gutter numbers, a lower TYPICAL_LINE_CHARS) and correct the 16px assumption in the ticket and C14.
2. Fragility, relevant to that decision. Margin is 1.3px at 1280x800 in Chromium. It depends on: line-number digit count (a 100+ line default build, or a 3-digit gutter, widens the gutter by one ch, about 8px, and fails criterion 2); the monospace fallback's advance (probe and layout both scale with it, but the fixed px parts, borders and padding, do not); and the Build column width (a platform with classic scrollbars would shift 534px). The default build is under 100 lines, so it holds today, and the test reads rem and metrics live so it fails loudly rather than silently. The 4.7ch annotation column fits `60:00` (the 3600 s horizon in `builds.test.ts`) but would clip a three-digit-minute time; no current path produces one. A spec that wants headroom should change a number, not add more padding trims.

## Blocking findings
None beyond the spec gap above.

## Acceptance criteria
1. Pass: `aoe4-editor-width.spec.ts` "at 390 px the textarea keeps half of the editor" asserts editor < 48rem first, then client width >= 0.5 * editor, one `page.evaluate`. Measured 266 of 336.
2. Pass, conditional on the spec decision: content 455 >= probe 453.7 in the textarea's computed font; the editor < 48rem asserted first; font left at 1rem or rule removed fails (implementer mutation-checked).
3. Pass: wide test at TABS_VIEWPORT asserts editor >= 48rem first, finish not `none`, fonts 1rem, span 0.8x, annotation width 17ch (toBeCloseTo 0 digits).
4. Pass: finish `display: none`, started visible, fonts 0.875rem, span 0.8x (toBeCloseTo), width <= 8ch, `clipped` 0 over all annotation rows. Runs at 390 and SPLIT_VIEWPORT.
5. Pass: hide class is applied only when `labelled` is false (`step-annotation.tsx`), and the rule sits in the container query; the table test compares step-table `step-finished` texts with the gutter's and asserts visibility. The implementer notes the table test guards only the unscoped-rule variant; scoping by class is the real protection and is sound.
6. Pass: all annotation row tops equal the line-number row tops (exact equality), plus the font equality in `expectFonts`. Not individually mutation-checked by the implementer. Note: the assertion compares annotation rows to gutter rows, not to the textarea rows; the textarea tie is the shared font and `line-height` rule, which `expectFonts` checks. Acceptable.
7. Pass (hover marks `data-gutter-active` with a visible box-shadow in compact mode; the precondition is asserted first). The stale tone has no compact test; the CSS for it is untouched, and the ticket only requires existing tests keep their values.
8. Pass: no existing test edited (git diff shows only the new spec plus source files in the task commit); text readers untouched. The `gutterEndTime` rename avoided a collision with an existing `Finished` text test.
9. Pass: the doc paragraph is updated in both places, and I checked each claim against the compact block (0.875rem, narrower annotation column, tightened padding on gutter, annotation and textarea, finish time hidden, table keeps it). grep found no remaining "17ch" or editor font claims in `docs/aoe4-build-order.md` or `ARCHITECTURE.md`.
10. Partly unverified: `npx tsc --noEmit` and `npm run lint:dup` run by me: clean (0 clones). `npm test` and `next build` not rerun by me (the implementer reports pass). The 360 / 768 / 1280 screenshots were not taken by me.
11. Pass: no invariant applies (CSS and a test id only; A1 to A3 untouched).

## Linter
`npx tsc --noEmit && npm run lint:dup`: no issues, 0 clones.

## Review bot
`reviewBot.cli` is empty: skipped.

## Conventions
- Container name `build-editor` is shared by `workbench.module.css` and `step-annotation.module.css` (CSS modules keep container names global, per the implementer; both files use the identical name). That coupling is undocumented in code: a rename in one file silently stops hiding the finish time. Non-blocking note, though the spec test would catch it.
- The test spec follows the existing layout (`openPage`, `SPLIT_VIEWPORT`, `TABS_VIEWPORT` from `helpers.ts`). The two compact-width variants use a loop over viewports, not copy-paste. No three-block repetition.
- `.gutter`/`.annotations`/`.textarea` declare `--editor-font-size: 1rem` in the shared rule and override it in the compact block on the same elements: right pattern for a container query that cannot style the container, and `.textarea` beats Bootstrap `.form-control` since the compact block comes later at equal specificity inside `@container` (confirmed by the passing font test at 0.875rem).

## Correctness
No operator or boundary inversion: `(width < 48rem)` equals design's `max-width: 47.99rem`; the wide test checks `>= 48rem` keeps M8. `labelled ? undefined : styles.gutterEndTime` is the right polarity (table keeps the finish time).

## Non-blocking notes
- Implementer's out-of-scope finding stands: other M9 rem bounds probably assume 16px; the spec owner should check them.
- UI inspection with the preview server was not run by me; I judged the UI from the code, the implementer's measured widths and the spec. Criterion 10's screenshot check at 360/768/1280 therefore stays with whoever runs the visual gate.

## Coverage
Reviewed: the six changed files of the task commit, the new spec in full, the compact and base CSS, `StepTimes`, the ticket, the implementer report, REPO.md, INVARIANTS.md and the spec checklist. Not run: acceptance, `npm test`, `next build`, screenshots.
