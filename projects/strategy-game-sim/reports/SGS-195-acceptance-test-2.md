# SGS-195 acceptance-test 2

Verdict: PASS. 231 of 231 passed at tip 0d9591b.

Harness ran: Playwright, Chromium, `acceptanceSetup` run, in the task checkout. I wrote no tests and made no commit and no production edit. The tree is unchanged.

## Run

One Playwright invocation covered these specs:
- the two fixed specs, in full: `aoe4-chart-layout` (including line 175) and `aoe4-split-scroll` (including line 176)
- `aoe4-marker-labels`
- `aoe4-chart-readability`
- `aoe4-build-order-step-band`
- `aoe4-build-order-pin-compare`
- `aoe4-chart-views`
- `aoe4-auto-run`
- `aoe4-min-width`
- `aoe4-build-order-m3-flow`
- `aoe4-build-order-m4-flow`
- `aoe4-compact-view`
- `aoe4-results-split`
- `aoe4-step-table`
- `aoe4-gathered-resources`
- `aoe4-step-annotations`
- `aoe4-key-results-collapse`
- `aoe4-split-tab-order`
- `aoe4-split-layout`

Result: 231 passed, 0 failed, 2.0m.

The run 1 failures are resolved:
- `aoe4-chart-layout.spec.ts:175` passes.
- `aoe4-split-scroll.spec.ts:176` passes.

## Mutation checks

No new passing tests were written this run. The run 1 mutation checks on `aoe4-marker-labels.spec.ts` stand, because production code is unchanged since d570df7. I did not mutation-check the two test-only edits to the pre-existing specs.

## Not expressed

Nothing new. Unit-level criteria stay in vitest, which is out of scope for this gate. `commands.lint` was not run because I changed no files.
