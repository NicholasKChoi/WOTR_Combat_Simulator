# SGS-199 acceptance-test 6

Verdict: PASS. Tip d96b9589d98bb399525f8aa05cfe0fd665a4c588 (unchanged; I added no commit, the spec and helpers were already committed by the implementer).

## Harness
Ran `acceptance:setup` (Chromium installed/linked), then Playwright on `acceptance/aoe4-help-modal.spec.ts` plus the edited specs `aoe4-compact-view`, `aoe4-step-annotations`, `aoe4-results-split`, `aoe4-build-order-knight-longbow-page`, and `aoe4-split-scroll` (named in the ticket's h3 / getByText rule). 74 tests, 74 passed (47 s). `npx tsc --noEmit && npm run lint:dup` clean (0 clones). No server or browser left running.

## Tests in aoe4-help-modal.spec.ts (all pass)
1. click / Enter / Space open it, page behind inert, focus on Close, 0.8 x innerHeight bound, content scrolls inside, reopens at top, no simulate request, state unchanged (B-H1).
2. Close, Escape, backdrop click close and return focus to `help-open`; click on text and on padding at the rect edge leave it open (B-H2).
3. Opening twice gives same content, no scroll kept (B-H3).
4. Tab / Shift+Tab stay inside and wrap (B-H4).
5. Enabled and seven same-heading sections with no result (run loading), syntax error, and loading (B-H5).
6. Seven h3-labelled sections; legend in third has six kinds and colours equal run-cell border colours (B-H6).
7. Warn swatch computed background equals a still-waiting run cell; fourth section text terms (B-H6 section 4).
8. Section 5 feature table read from the live page, no-caveat regex.
9. Legend only inside the modal in every page state; pinned legend, marker control, reorder help, copy-link hint stay (B-H7).
10. 1200 and 1800 px placement beside h1, inside section, before run bar (B-H8) (2 tests).
11. Below 1200 px the button scrolls sideways with the page.
12. Tab order reaches `help-open` before the build select, only site layout earlier.
13. Server HTML dialog has no `open`, hidden before click (B-H9).

## Mutation checks (all reverted; `git diff --exit-code` clean, tree clean)
- page-help.tsx:44 remove scroll reset: test 1 failed "click: reopened at the top" (expected 0, got 200); test 3 failed expected 0 got 300.
- page-help.tsx:59 drop `outsideRect` from the backdrop condition: test 2 failed `toBeVisible` after the padding-edge click (line 157).
- page-help.tsx:57 remove `onKeyDown={wrapTab}`: test 4 failed "Tab press 2" (focus left the dialog).
- page-help.tsx:83 remove `<StepKindLegend />` from section 3: test 6 failed legend `toBeVisible`; test 9 failed legend count.
- page-help.tsx:87 drop `annotationStyles.warn` from the swatch: test 7 failed `not.toBe('rgba(0, 0, 0, 0)')`.
- page-help.tsx:105 "Reset zoom" reworded to "Reset": test 8 failed "reset zoom text".
- page-help.tsx:119-124 remove the Save and links section: tests 5 and 6 failed on seven-section count.
- page-help.tsx:106 add "Coming soon": test 8 failed on the no-caveat regex (line 336).
- step-table.tsx:310 re-render `StepKindLegend`: test 9 failed `legendOutsideHelp` count 0 (received 1).
- pages/apps/aoe4-build-order.tsx:337 move `PageHelp` after `BuildInput` plus fixed-position button: both placement tests failed (toEqual), sideways test failed (moved 0, expected 100), Tab-order test failed (`help-open` not in stops before the select).
- page-help.tsx:53 add `open` to the dialog: test 13 failed on the server-HTML `open` check (line 442).

Not individually mutated: the inert-behind check, focus-on-Close and height bound inside test 1, and the legend-vs-cell colour equality in test 6 (only the legend's presence was broken there). Test 1 still failed on its scroll assertion; the other assertions in it were not proven able to fail.

## Failures
None.

## Criteria not expressible
None. The unit-level criteria (`page-help.test.ts`, `StepTable` no-legend render) are the implementer's vitest files, not run here.
