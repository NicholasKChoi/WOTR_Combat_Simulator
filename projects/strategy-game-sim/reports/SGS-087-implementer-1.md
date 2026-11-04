# SGS-087 implementer report 1

Status: needs_review
Branch: sgs-087-aoe4-chart-readability, tip 4c065b2 (base origin/main fcfbaf1). Not pushed.
Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-087-aoe4-chart-readability

## Files
- components/apps/aoe4-build-order/line-chart.tsx: `pinnedAgeUpMarkers` renamed `ageUpMarkers`; feeds pinned lines, `placeMarkers` and `labelKey`; non-age-up markers drawn as solid unlabelled `ReferenceLine`s (same testid/data attrs/stroke) with a `<title>`; Tooltip `formatter={formatChartValue}`.
- components/apps/aoe4-build-order/chart-rows.ts: `formatChartValue`.
- components/apps/aoe4-build-order/chart-rows.test.ts: `it.each` table for `formatChartValue` (8 rows: the 7 specified plus a string).
- components/apps/aoe4-build-order/line-chart.test.ts: rename only (import, call, describe title 'age-up markers').
- docs/aoe4-build-order.md: results paragraph rewritten (age-up only labelled, others hover title, tooltip 1 decimal). Grep of the doc and data/aoe4-build-order/README.md for label/stacked/tooltip found no other statement that every marker is labelled.
- acceptance/aoe4-chart-readability.spec.ts: new, 2 tests at 1280 px on the Knight/Longbow prebuilt.

## Tests
- npm test: 1368 passed, 10 skipped (46 files). npm run acceptance: 697 passed. tsc ok; lint:dup 0 clones; `npx next build` ok.
- New acceptance: label set per chart equals age-up `<label> <m:ss>` texts (Y-axis label excluded as the rotated text), 1 <= data-label-rows <= age-up count; every marker present once per chart with kind/label/at, MARKER_COLORS stroke, no dasharray; non-age-up groups have no text and a title `<label> <m:ss>`; tooltip at plot centre (HOVER_FRACTION 0.5, raw decimals present there) has no `\d+\.\d{2,}` in gather rates and floating resources.
- Pre-existing tests edited: line-chart.test.ts only the rename (pinnedAgeUpMarkers -> ageUpMarkers); expected values unchanged. No test asserted a text label on a non-age-up marker (the old marker spec was deleted by SGS-082).

## Mutation checks (all undone)
- Remove Tooltip formatter: tooltip acceptance test fails.
- Pass all markers to placeMarkers/labelKey: marker acceptance test fails.
- Drop the `<title>`: marker acceptance test fails.
- formatChartValue using toFixed(1): unit rows `40` and `0.04` fail.
- Unit filter changed to keep all kinds: 2 line-chart tests fail.
- Note: an `+ 0` guard against `-0` was unnecessary (String(-0) is '0'), removed; the `-0.04` row passes without it.

## Doc claims
- docs/aoe4-build-order.md results paragraph: "Only `age-up` markers carry a text label ... the other kinds have no text label and show `<label> <m:ss>` as a hover title. Tooltip values are shown rounded to at most 1 decimal place." True per line-chart.tsx (placeMarkers gets ageUpMarkers; others get `<title>`), Tooltip formatter.
- chart-rows.ts comment: "Rounds to at most 1 decimal without a trailing zero; a non-number (a missing value) passes through." True per the unit table.

## Screenshot (1280 px, Knight/Longbow Gather rates)
- After: reports/SGS-087-gather-rates-after.png, data-label-rows 1.
- Before (all markers labelled, via the mutation above): reports/SGS-087-gather-rates-before.png, data-label-rows 9 (about 126 px of label column vs 14 px).

## Invariants / out of scope
No INVARIANTS touched; no other acceptance file edited. Other agents' playwright processes (step-band spec) were running in the machine; none are mine.
