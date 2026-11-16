# SGS-181 review 1

Verdict: APPROVE. Tip baa121f23b0496fc3e3316429bc3a8f58bc0b1c7, base origin/main.

## Blocking findings
None.

## Acceptance criteria
1. Every case at 1200 px or wider: pass. A grep of the three files shows the only viewport sources are `MIN_SUPPORTED_VIEWPORT`, `WIDE_VIEWPORT`, `SPLIT_VIEWPORT` (1280, the untouched "beside Results" describe) and the default Desktop Chrome project viewport (1280x720, `playwright.config.ts:27`). No `PHONE`, `TABS_VIEWPORT`, `showTab` or width under 1200 remains. No unused imports: every imported name is used, and `tsc` passes. The implementer's per-file acceptance runs (9, 24 and 13 passed) were not re-run, since review runs no acceptance tests.
2. Half-editor, typical-line, gutter and Build-no-overflow cases: pass. The half-editor case runs at `MIN_SUPPORTED_VIEWPORT` and keeps `>= 0.5 * editorWidth`; the implementer's mutation record shows it failing at 0.99. Typical-line and gutter run for both rows with their assertions intact, and only the compact-boundary precondition is dropped. Overflow uses `SUPPORTED_VIEWPORTS`, body unchanged.
3. Table-keeps-finish-time and hover-marks-active-step at the default viewport: pass. `setViewportSize` is removed, the names are cleaned, and the assertions are unchanged.
4. Boundary cases deleted: pass. The "768 px and wider" describe and the 767/768/850 describe are gone from the diff, and `tsc` is clean.
5. Popover loop and run-cell border: pass. The popover loop takes its viewport from the row, with its assertions untouched. The run-cell describe has no `test.use`, so it runs at the default viewport.
6. Tick-overlap loop: pass. It runs over both rows, the title keeps `${viewport.width}`, and the assertions are untouched.
7. No read of unrendered content without `showTab`: pass. I checked each removed call. The reads that follow are `fill` or `click` (both auto-wait), `showView` clicks, `focus()`, `expectPressed`/`yLabel`/`line` expects, or `toBeVisible`. This holds for `runOk`, `setText`, `openText` and every chart case.
8. `lint:dup` and `tsc`: pass. I ran `npx tsc --noEmit && npm run lint:dup` in the scratch (0 clones, exit clean). `npm test` was not re-run; the implementer reports 2623 passed.
9. Invariants: none touched. The diff is `acceptance/` only (3 files).

Existing-test edits are all covered by the ticket's rules. The only removed assertion is `editorWidth < COMPACT_BELOW_PX`, which the ticket names.

## Spec gaps
None.

## Bot reconciliation
No `reviewBot` cli or rules file is configured, so there are no bot findings.

## Non-blocking notes
- `acceptance/aoe4-step-annotations.spec.ts:515` renames the run-cell describe to `'AoE4 step run cells'`, the same title as the describe at line 58. No test titles collide, but two same-named describes in one file are confusing. Moving the border case into the first describe would be cleaner. The ticket only asked for the rename, so I did not block.
- `expectFonts` now hardcodes a local `editorRem = 0.875`. This is fine and matches the ticket's allowance.
- Height change: the chart tick loop and popover loop now use the row heights (800 and 900) instead of 900 and 760. The implementer's report notes this, and the assertions do not depend on height.
- The UI inspection was skipped because the diff changes no UI code. It touches test files only.

## Coverage
Reviewed the full diff of the three spec files, the grep above, the implementer report, and `acceptance/helpers.ts` constants. Not run: acceptance, browser and end-to-end tests (review does not run them).
