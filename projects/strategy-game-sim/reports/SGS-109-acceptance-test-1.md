# SGS-109 acceptance-test 1

Verdict: PASS. Branch sgs-109-row-hover-drop-timeline, new tip e708ee5 (was 1c1cf1b). Not pushed.

## Coverage review
Every browser-boundary criterion was already covered by the implementer's specs in `acceptance/aoe4-build-order-step-band.spec.ts` and `acceptance/aoe4-results-split.spec.ts`. These are the shading on all four charts, the start-row mixed-input cases, focus and Tab, no flash inside a row, the unaligned-stale case, the edit case, a new run, waiting and not-reached rows, the active look, the zero-length and age-up cases, the width table, and the no-steps build.

One gap: "results-last-good holds the four charts as direct children after the message lists" had no browser assertion.

## Test written
- `acceptance/aoe4-results-split.spec.ts`: "the four charts are direct children of the results container and wrap no column". It pins the four chart ids as the direct children of `results-last-good`, in order, and as the last four children (after the message lists).

## Run
- The harness ran. Command: `npx playwright test` on `aoe4-results-split`, `aoe4-build-order-step-band`, `aoe4-step-table` and `aoe4-step-annotations`.
- Result: 57 of 57 passed, including the new test.
- `npx tsc --noEmit` and `npm run lint:dup` are clean.

## Mutation check
- Break: wrapped the four `SeriesChart`s in a `<div>` in `components/apps/aoe4-build-order/results.tsx` (insertions before line 31 and before line 87).
- Result: the test failed on `expect(children.filter(id => id?.startsWith('chart-'))).toEqual(CHART_IDS)` (received an empty array). That is the assertion that names the behavior.
- Undone with `git checkout -- results.tsx`. `git diff --exit-code -- components pages lib` is clean.
- The implementer's existing tests were not mutation-checked, because I wrote none of them.

## Failures
None.

## Not expressible
None for the browser boundary. Narrow screens are out of scope for M7. The unit-test and docs criteria were not part of this gate.

## Cleanup
No background processes remain from this run. Playwright's `webServer` started and stopped its own server. The only listener on a 31xx-39xx port is the sandbox proxy on 3128.
