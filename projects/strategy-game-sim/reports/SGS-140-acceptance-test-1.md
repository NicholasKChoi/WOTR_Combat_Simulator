# SGS-140 acceptance-test 1

Verdict: PASS. Branch sgs-140-editor-compact-mode, tip 2f18733 (no new commit; I wrote no tests).

## Tests
The implementer's `acceptance/aoe4-editor-width.spec.ts` already covers every observable criterion, so I added nothing. It has 7 tests:
- 390 px: textarea client width >= half the editor, editor < 48rem (criterion 1).
- 1280x800: textarea content width >= 48-char probe, editor < 48rem (criterion 2).
- 390 and 1280 (2 tests): finish time `display:none`, started visible, fonts 0.875rem, span 0.8x, annotation width <= 8ch, no clipping, rows aligned (criteria 4 and 6).
- Table and table view keep the finish time, same text as the gutter (criterion 5).
- Hover sets `data-gutter-active` with a visible box-shadow in compact mode (criterion 7).
- TABS_VIEWPORT (>= 48rem): M8 layout, finish visible, fonts 1rem, annotation 17ch, span 0.8x (criterion 3).

## Runs
- `acceptanceSetup` ran (node_modules linked, Chromium installed).
- Width spec plus step-annotations, compact-view, narrow-layout and inline-issues specs: 54 passed.
- Stability: the width spec ran with `--repeat-each=15` (105 runs): 105 passed, 0 flaky. That includes the 1280x800 test whose margin is about 1.3 px. The result is deterministic in this environment.
- `npx tsc --noEmit && npm run lint:dup`: clean.

## Mutation checks (each undone with `git checkout -- components`, `git diff --exit-code` clean)
- `workbench.module.css` compact `--editor-font-size` 0.875rem to 1rem: the 1280 content-width test failed (expected >= 518.5, got 446), and both font tests failed.
- `workbench.module.css` query `(width < 48rem)` to `70rem`: the wide-layout font test failed.
- `step-annotation.module.css` hide rule made unconditional and extended to the table: the table-view test failed on `toBeVisible` (hidden), and the wide-layout finish-visible check failed.
- `workbench.module.css` span `calc(0.8 * var(--editor-font-size))` to `0.8rem`: both compact font tests failed (expected 12.6, got 14.4).
- `workbench.module.css` `.annotations` width 4.7ch to 12ch: the 1280 content-width test failed (386 against 453.7), and the annotation width <= 8ch bound failed (113.4 against 76.1).
- Not killed, by design: removing the `labelled` guard in `step-annotation.tsx` passes. The step table sits outside the `build-editor` container, so the container query never matches there. The guard is redundant, and the table contract is only observable through a CSS change that reaches the table, which the third mutation above kills.

## Failures
None.

## Notes
- The 1.3 px margin at 1280 px is stable across the 15 repeats. It is a known limit named in the ticket (a 3-digit gutter or `100:00` would break it).
- The spec has a double blank line before `expectFonts` (cosmetic, no lint rule flags it).
- Nothing started by me is still running.
