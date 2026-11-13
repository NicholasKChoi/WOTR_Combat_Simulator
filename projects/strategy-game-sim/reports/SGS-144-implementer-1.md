# SGS-144 implementer report 1

Status: needs_review

- Branch: sgs-144-rem-basis-compact-threshold, tip 75a5bf0ef7f174c8fb6fb6606893bba1c57535a8 (base origin/main 1f35bef)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-144-rem-basis-compact-threshold

## Files touched
- components/apps/aoe4-build-order/workbench.module.css: container query `(width < 48rem)` -> `(width < 768px)`.
- components/apps/aoe4-build-order/step-annotation.module.css: same change.
- docs/aoe4-build-order.md: both "48rem" mentions (finish-time clause, compact-mode sentence) now say 768px.
- ARCHITECTURE.md: Styling bullet gains "The site root font size is 18px (`styles/global.css`), so 1rem is 18px: convert rem figures at 18."
- acceptance/aoe4-editor-width.spec.ts: `COMPACT_BELOW_REM` replaced by `COMPACT_BELOW_PX = 768`; new describe "compact boundary" sets the `build-order-editor` width directly (767 compact; 768 and 850 not).
- acceptance/aoe4-save-status.spec.ts: new `expectOneLine` helper (the 1280 one-line test now uses it), plus 1200px and 1199px cases.

## Save row
The 1200px check passed against the existing `.linkInput` sizes (`flex: 1 1 12rem`, `min-width: 8rem`), so no save-row CSS change. design/M9.md save-row figures need no update.

## Edited pre-existing tests (aoe4-editor-width.spec.ts)
- "at 390 px the textarea keeps half of the editor", "at 1280x800 the textarea content fits a typical build line", "at 390 / 1280 px the gutter drops the finish time...": bound `COMPACT_BELOW_REM * m.rem` -> `COMPACT_BELOW_PX`; expected values unchanged.
- "AoE4 text editor at 48rem and wider > keeps the M8 layout": describe renamed to "768 px and wider"; lower bound now `COMPACT_BELOW_PX`.
- `EditorMetrics.rem` is still used by `expectFonts`.

## Tests run
- Targeted acceptance (editor-width and save-status specs): 33 passed. Ran acceptance for these two specs only because the ticket changes them.
- `npm test`: 83 files passed, 1 skipped; 2552 tests passed, 15 skipped.
- `npx tsc --noEmit` and `npm run lint:dup` (0 clones): pass. `npx next build`: pass.
- Not run: the full acceptance suite; screenshots at 360x760, 768 and 1280 (review does these).

## Mutation checks
- Both container queries reverted to `48rem` (workbench.module.css:113, step-annotation.module.css:71): "768 px wide is not compact" and "850 px wide is not compact" failed on `finishedDisplays.every(...)` (expected true, received false); the 767 case passed, as expected. Restored.
- `.linkInput` `min-width: 8rem` -> `60rem` (workbench.module.css, inside the 1200px media query): "at 1200 px the row shares one line..." failed with `overflow: 500` vs 0. An intermediate `30rem` did not fail (the row had room), so it is not a regression guard at that size. Restored.
- The 1199px test passed under the 60rem mutation (wrapping is permitted there); it guards DOM order and no overflow only.

## Doc claims
- ARCHITECTURE.md Styling bullet: "The site root font size is 18px (`styles/global.css`), so 1rem is 18px: convert rem figures at 18." True per `styles/global.css:8` (`font-size: 18px`).
- docs/aoe4-build-order.md: "below 768px of editor width the finished time is hidden" and "Below 768px of the editor's own width ... the text view is compact" match the two `@container build-editor (width < 768px)` rules.

## Invariants
A1 to A3 untouched (CSS, tests and docs only).

## Unverified assumptions added
None. The boundary tests run in real Chromium; they set `flex: none` and `width` inline on `build-order-editor` and wait for the measured width to equal the target, which also confirms the container's content width matches the border box (no padding or border on it).

## Out-of-scope findings
None.

## On merge (manager)
design/M9.md to update to 768px and the 18px basis (list in ticket). Save-row figures unchanged.
