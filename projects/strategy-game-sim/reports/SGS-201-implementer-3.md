# SGS-201 implementer report 3

- Ticket: SGS-201, branch `sgs-201-series-legend-aria-pressed`, tip `bce76f4b3d9796cbd9adc50ea7131065d0b61ac7`, base `origin/main` (9027940).
- Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-201-series-legend-aria-pressed`
- Status: needs_review

## Files touched
- `components/apps/aoe4-build-order/chart-legend.tsx`: `SeriesLegend` `aria-pressed={!hidden.has(item.key)}`.
- `components/apps/aoe4-build-order/chart-legend.test.ts`: new `SeriesLegend markup` block (2 tests).
- `components/apps/aoe4-build-order/line-chart.test.ts`: expected value flipped.
- `acceptance/aoe4-build-order-pin-compare.spec.ts`, `aoe4-chart-layout.spec.ts`, `aoe4-chart-views.spec.ts`, `aoe4-units-chart-upgrade-dots.spec.ts`: pinned-value flips.
- `docs/aoe4-build-order-ui.md`: one clause added.

## Tests
- Targeted: chart-legend + line-chart 45 passed. Full `npm test`: 2858 passed, 15 skipped, 0 failed.
- New unit tests: (1) all shown -> every item incl. pinned-only `p` is `true` with no style; with `b` and `p` hidden those are `false` and `opacity:0.5`, `a` stays `true`. (2) series item and marker control read the same `aria-pressed` when shown and when hidden.
- Acceptance (ran the five edited/related specs once as they pin the value; not authored as a new harness gate): pin-compare, chart-layout, chart-views, units-chart-upgrade-dots, help-modal: 112 passed.

## Pre-existing tests edited (ticket rule: tests pinning the inverted value get the shown-means-true value)
- `line-chart.test.ts`: "renders one pressed-state button per series with its key": `aria-pressed="false"` -> `"true"` (all shown).
- `aoe4-build-order-pin-compare.spec.ts`: "a legend item has a solid swatch ... hides and restores both lines of its series": before the click all items `true` (count = total, total > 1); after hiding, `item` is `false`, count of `false` is 1, `true` count total-1, opacity 0.5 (already asserted); after restore `true` count = total, item `true`, opacity 1. Replaced the old `true` count 1 / 0 checks.
- `aoe4-chart-layout.spec.ts`: collapse test, two checks on the hidden item `'true'` -> `'false'`.
- `aoe4-chart-views.spec.ts`: wood item, two checks `'true'` -> `'false'`.
- `aoe4-units-chart-upgrade-dots.spec.ts`: Longbowman hidden item `'true'` -> `'false'`.
- `aoe4-help-modal.spec.ts` unchanged (equality snapshot).

## Doc claims
- `docs/aoe4-build-order-ui.md` (series legend paragraph): "the item's `aria-pressed` is `"true"` while its series is shown and `"false"` while it is hidden, the same meaning as the marker control's". True per `chart-legend.tsx:SeriesLegend` and `MarkerControl` (`aria-pressed={!hidden.has(kind)}`).

## Bug regression
- Reverting the one-line fix (equals base behavior) fails all three unit tests: the two new ones (`AssertionError` on the pressed values; `expected 'false' to be 'true'` in the marker-agreement test) and the updated `line-chart.test.ts` test (`expected [] to deeply equal ['a','b']`). I used a revert of the fix in the task checkout, not a separate scratch checkout.

## Mutation checks
- `chart-legend.tsx:27` flipped back to `hidden.has(item.key)`: three tests failed on the assertions above; restored (diff shows 1-line fix only).

## Build / lint
- `tsc --noEmit` clean, `lint:dup` 0 clones, `next build` OK, codegen not set.

## Invariants
- A1 to A3 untouched (one ARIA attribute). No sighted change: dimming, swatch, onToggle unchanged.

## Unverified assumptions added
- none.

## Out-of-scope findings
- none.
