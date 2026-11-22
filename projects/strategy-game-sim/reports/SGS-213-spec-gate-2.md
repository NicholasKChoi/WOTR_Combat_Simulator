# SGS-213 spec gate (report 2)

Verdict: NEEDS_SPEC

ticket-lint output was empty (no errors, no warnings). Read at origin/main: annotation-popover.tsx, step-annotations.ts, build-text-editor.tsx, annotation-popover.test.ts, acceptance/aoe4-step-annotations.spec.ts, helpers.ts viewports, workbench.module.css, docs/aoe4-build-order-ui.md.

## Gaps

1. Testable criteria (item 2): viewport sets disagree and the placement check can skip itself.
   - Scope says "at the wide and minimum supported viewports" (helpers: MIN_SUPPORTED_VIEWPORT 1200, WIDE_VIEWPORT 1800). The first criterion says "1280 and 1800". 1280 is SPLIT_VIEWPORT, not the minimum, so the implementer must guess.
   - Scope also says "where it fits". The page has two equal columns (`grid-template-columns: minmax(0,1fr) minmax(0,1fr)`), so the textarea's right edge is near half the width and the popover (max 24rem) fits at 1200 and above. A check that is conditional on "where it fits" can pass by skipping, so it cannot fail.
   - Fix: state the viewports as MIN_SUPPORTED_VIEWPORT and WIDE_VIEWPORT in both places. Drop "where it fits": assert unconditionally that the popover's left >= textarea right and that the boxes do not intersect. The no-room fallback is covered by the unit test only.

2. Testable criteria (item 2): "top aligns with the active line's top unless the viewport clamp moves it" has no observable condition in the acceptance test, since "unless clamped" cannot be asserted.
   - Fix: the acceptance test scrolls a mid-list line to the viewport centre (existing `lineAt` does this) and asserts `|popover.top - line.top| <= 1`. The near-bottom case is asserted only as "inside the viewport", which the existing viewport test already does. The clamp itself is covered by the pure-function unit test.

3. Testable criteria (item 2): the repeated-step criterion ("combined run completed with zero total wait shows no popover; non-zero shows combined text and per-copy lines as before") names no test. No existing spec asserts the popover for a repeated step (aoe4-repeat-step.spec.ts only checks the shading on gutter hover; the per-copy lines are asserted only in the table row).
   - Fix: add a unit test that applies the predicate to `combineRuns` of two completed copies with zero waits (false) and of copies whose waits sum above zero (true). This also catches a predicate applied to a single copy instead of the combined run. State the same for the per-copy-lines claim, or drop "as before" as unchanged behavior.

## Checked and fine

- Grounded scope: `place`, `AnnotationPopover`, `AnnotationLine`, `textareaRef`, `combineRuns`, `data-gutter-active` all exist at base. `place` is not exported today; the ticket makes it a pure exported function, which is new work and is fine.
- Existing tests that depend on the change: the hover no-wait test, the index-based tests, and the "blank, comment" test's last line (the second `build barracks` may be a no-wait step) are all covered by the ticket's rule. Other specs (aoe4-repeat-step, compact-view, editor-width, split-scroll) hover the gutter but assert shading or layout, not the popover, so they are unaffected.
- Docs: the only popover statements are in docs/aoe4-build-order-ui.md (text-view paragraph and the run-cell "Blocked by" sentence at line 106); README, lib README and page-help.tsx have none.
- Invariants, risk (standard; no criticalPaths symbol touched), diagrams, dependencies, On merge, unverified assumptions (browser rect APIs are real in Playwright), input validation, rule exceptions: no issue.

## Notes

- The unit test on the placement function only fails on "textarea edge ignored" if the anchor's left is less than the textarea's right edge in the test rows. Pick rows where anchor.left is well left of textarea.right.
- The popover may now cover the Results column content; the ticket accepts this.
