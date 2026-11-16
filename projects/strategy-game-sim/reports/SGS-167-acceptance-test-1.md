# SGS-167 acceptance-test report 1

Verdict: PASS. Tip 8b017ef6a485ffdff5f3c379939ca168ab4e804c. No commit made (no tests written; chore edits acceptance specs only).

## Harness
`acceptanceSetup` ran (node_modules linked, `playwright install chromium`). Playwright ran against the task checkout's own next dev.

## Run
`npx playwright test` on the four edited specs in full: aoe4-chart-views, aoe4-build-order-pin-compare, aoe4-gathered-resources, aoe4-compact-view.
Result: 72 passed, 0 failed, 1.6m. The Buildings tests in chart-views (lineEndYs consumers) pass unchanged, as do the converted pin-compare (poll), gathered-resources, compact-view and chart-views view-switch sites.

`npx tsc --noEmit` and `npm run lint:dup` pass (0 clones).

## Tests written / mutation checks
None written: the ticket is a no behavior chore and its criteria are covered by the existing specs. No mutation checks applicable.

## Failures
None.

## Notes
- Converted sites read all compared values in one evaluate via `readLayout`; the view-switch case keeps two reads (before and after the action), each one evaluate.
- Pin-compare 1200 s vs 300 s check now sits in an `expect.poll` (previously one-shot); the relation is unchanged.
