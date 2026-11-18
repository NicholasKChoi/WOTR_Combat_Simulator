# SGS-205 acceptance-test 7

Verdict: PASS. No new tests written and no commit made; the tip's own regression spec was run and mutation-checked. Tip d5c37714fd36e0b5cd7d1f059fa666c4fcd00a7d, checkout unchanged and clean.

## Harness
`acceptance:setup` ran, then `npx playwright test acceptance/aoe4-help-modal.spec.ts` (Chromium): 15 passed, 0 failed.

## Test under review
`acceptance/aoe4-help-modal.spec.ts:266`, "every section heading is larger than the body text, smaller than the dialog title, and as large as a chart title". It pins criterion 1 (heading > paragraph, title > heading) and criterion 2 (heading == chart title) with computed font sizes, with the page run and the chart rendered. Measured: paragraph 21.6px, section heading 22.5px, chart title 22.5px, dialog title 27px.

The other 14 specs in the file (existing help-modal behavior) pass, which covers criterion 3 (tags, ids, aria wiring, text).

## Mutation checks (each undone with `git checkout -- <file>`; `git diff --exit-code` clean at the end)
- `page-help.tsx:25` `h5` -> `h6`: failed at line 290 "larger than the body text" (expected > 21.6, received 18).
- `page-help.tsx:25` `h5` -> `h4`: failed at line 291 "smaller than the dialog title" (expected > 27, received 27).
- `page-help.tsx:25` `h5` plus inline `fontSize: 1.3rem` (between body and title, not chart size): failed at line 292 "the chart title size" (expected 22.5, received 23.4).
- `chart-header.tsx:53` `h5` -> `h6` (the chart title measured): failed at line 292 "the chart title size" (expected 18, received 22.5).

Each assertion in the loop (body, title, chart title) was failed by its own break.

## Failures
None.

## Not expressible
None.

## Out of scope
None found. No process left running.
