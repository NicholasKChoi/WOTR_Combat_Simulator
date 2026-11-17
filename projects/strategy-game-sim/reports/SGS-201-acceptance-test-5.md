# SGS-201 acceptance-test report 5

Verdict: PASS. Commit 79d17e17e0a730a239e6e465aa5a793379d5aa24 on `sgs-201-series-legend-aria-pressed` (on top of bce76f4).

## Tests written
File: `acceptance/aoe4-legend-pressed-state.spec.ts` (Playwright, Chromium, real page, shared helpers `openPage`, `waitForRun`, `CHART_IDS`).
- One test per chart (4: units, gather rates, gathered, floating): on first render every series item reads `aria-pressed="true"` and computed opacity 1; clicking the last item makes it `"false"` and opacity 0.5 while all others stay `"true"`/1; clicking again returns every item to `"true"`. Pins criteria 1, 2, 4.
- Marker control and series legend agree: both shown read `"true"`; both hidden read `"false"` with opacity 0.5; both restored read `"true"`. Pins criterion 3.

## Run
Harness ran (acceptanceSetup, then Playwright). New spec plus pin-compare, chart-layout and chart-views specs: 91 passed. The new spec's 5 tests all passed.

## Mutation checks
- `components/apps/aoe4-build-order/chart-legend.tsx:27` reverted to `aria-pressed={hidden.has(item.key)}`: all 5 new tests failed (`toHaveAttribute` Expected "true", Received "false"; array diffs on the pressed lists). Undone with `git checkout`; `git diff --exit-code` clean.
- `chart-legend.tsx:28` series dim opacity 0.5 changed to 0.9: all 5 failed on `toHaveCSS('opacity')` Expected "0.5", Received "0.9". Undone; diff clean.

## Lint
`tsc --noEmit` and `lint:dup` clean.

## Failures
None.

## Not expressible
None. The no-sighted-change and edited-existing-tests criteria are covered by the pre-existing specs (pin-compare, chart-layout, chart-views passed against the tip); units-chart-upgrade-dots and help-modal were not rerun by me.
