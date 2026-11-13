# SGS-144 acceptance-test report 1

Verdict: PASS. Branch sgs-144-rem-basis-compact-threshold, previous tip 75a5bf0, new tip a79011d (one commit, test file only). Harness ran: Playwright/Chromium, `acceptanceSetup` done; `npx tsc --noEmit` and `npm run lint:dup` clean (0 clones).

## Tests

Implementer's, already at 75a5bf0 (reviewed against the criteria, run, mutation-checked):
- `acceptance/aoe4-editor-width.spec.ts` "compact boundary" x3 (767 compact; 768 and 850 not compact): editor width set directly on `build-order-editor`, width asserted first via `expect.poll`, then finish-time display and fonts read in one `page.evaluate`; hidden exactly when compact font applies. Pins the 768px absolute threshold and fails against 48rem.
- Same file, existing 390 px, 1280x800 and 1024 px cases now compare to `COMPACT_BELOW_PX`.
- `acceptance/aoe4-save-status.spec.ts` "at 1200 px the row shares one line and does not overflow", "at 1199 px the row keeps DOM order and does not overflow", plus the 1280x800 case sharing `expectOneLine`.

Written by me (a79011d), covering the screenshot criterion as an assertion:
- `acceptance/aoe4-editor-width.spec.ts` "AoE4 Build panel has no horizontal overflow" at 360x760, 768x1024 and 1280x800, in both the text and table views: page `scrollWidth - innerWidth` and `panel-build` `scrollWidth - clientWidth` both 0 (polled).

## Results

Run of aoe4-editor-width.spec.ts and aoe4-save-status.spec.ts: 36 passed, 0 failed (before commit, with my new test included).

## Mutation checks (each undone with `git checkout -- components`, `git diff --exit-code components` clean)

- `workbench.module.css:113` `768px` to `48rem`: 768 px and 850 px boundary cases fail on `expectFonts` (toEqual font sizes); 767 passes as expected.
- `step-annotation.module.css:71` `768px` to `48rem`: 768 px and 850 px fail at `aoe4-editor-width.spec.ts:165` (finish time still hidden where it should be visible).
- Both files `768px` to `700px`: 767 px fails at line 165.
- `workbench.module.css:230` `.linkInput` `min-width` `8rem` to `40rem`: the 1200 px and 1280x800 one-line tests fail on `overflow` (expected 0, received 140).
- `workbench.module.css:220` one-line media query lowered to 1100px and `min-width` to `40rem`: the 1199 px test fails at line 223 (overflow expected 0, received 320). Note: with only the threshold lowered the 1199 test still passes, since 8rem fits; it fails only when the sizes overflow, which matches the criterion's wording.
- `step-table.module.css:8` `overflow-x: auto` to `visible`: overflow test fails at 768 (panel 2) and 1280 (panel 134) on the `panel` field. The 360 px case passed under this break (cards layout does not scroll there); the other break I tried, `.gutter` `min-width: 60rem` at `workbench.module.css:63`, did not fail any case because the editor scrolls internally, so the 360 px case has no mutation shown to fail.

## Criteria

- Compact switch point at 768px, both queries together: covered, mutation-verified.
- 1200 / 1199 save row: covered, mutation-verified.
- Docs say 768px and the 18px root: checked by reading the diff (ARCHITECTURE.md Styling bullet; both `48rem` sentences in docs/aoe4-build-order.md changed); not expressible in the browser harness.
- No horizontal overflow at 360x760, 768 and 1280: asserted as above. No screenshot files were produced or committed; the assertion is the check.
- `npm test`, `next build`, existing-tests-keep-values: not run by me (out of scope); the implementer lists the edited tests.

No failures, no impl-defects or spec-gaps found. No processes left running (Playwright started and stopped its own server).
