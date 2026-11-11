# SGS-113 implementer report 1

Status: needs_review
Branch: sgs-113-chart-legend, tip 41357ecb0e9b8ad74665c3d5107a6853716797cd (base origin/main b3da879)
Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-113-chart-legend

## Files touched
- components/apps/aoe4-build-order/chart-rows.ts: `LegendItem.lines`, one-item-per-key `legendItems`, new `isLineHidden(hidden, lineKey)`, `PINNED_PREFIX` constant behind `pinnedKey`.
- components/apps/aoe4-build-order/chart-legend.tsx: swatch dashed only for `lines === 'pinned'`; new exported `PinnedLineKey`, rendered inside `chart-series-legend` after the items when `pinned` is set.
- components/apps/aoe4-build-order/line-chart.tsx: both `hide` props use `isLineHidden`.
- components/apps/aoe4-build-order/chart-rows.test.ts, line-chart.test.ts: unit tests.
- acceptance/aoe4-build-order-pin-compare.spec.ts: the two old legend tests replaced by three new ones.
- docs/aoe4-build-order.md: two legend sentences rewritten.

## Tests
- Full `npm test`: 63 files, 1977 passed, 13 skipped, 0 failed. The two touched files: 45 passed.
- Invariants encoded: one item per key in current-then-pinned-only order with `lines` current/both/pinned; no `pinned:` key or `(pinned)` name; colours (pinned-only colour differs from first current series); a hidden series key hides both lines, and a `pinned:<key>` entry in the hidden set hides nothing; `chart-pinned-key` appears once, with both labels, after the series legend start, only with a pinned run.
- Acceptance specs were written but NOT run (acceptance belongs to the separate gate).

## Pre-existing tests edited
- chart-rows.test.ts `legendItems`: the three old-shape tests replaced (ticket names them).
- acceptance/aoe4-build-order-pin-compare.spec.ts: "the pinned legend item toggles only the pinned line" and "the current legend item toggles only the current line" replaced (ticket names them).
- No other existing assertion changed; marker-legend tests in line-chart.test.ts untouched and passing.

## Doc claims
- docs/aoe4-build-order.md: "the legend has one item per series, named without a suffix: with a pinned run, an item for a series in both runs hides and restores both its lines, and a series only the pinned run has is listed once, with a dashed swatch. With a pinned run, the series legend also holds a key (`chart-pinned-key`) that explains the line styles: solid is the current run and dashed is the pinned run." True per `legendItems`, `isLineHidden`, `SeriesLegend`/`PinnedLineKey`.
- docs: "A pinned line is hidden and restored together with its series' legend item." True per `line-chart.tsx` `hide` props via `isLineHidden`.
- The line-key sentences (`pinned:<key>` on `data-series`, line name `<name> (pinned)`) and the marker legend `Age-up (pinned)` remain unchanged.

## Pinned outputs
None.

## Mutation checks (all undone)
- chart-rows.ts isLineHidden prefix strip removed: 3 `isLineHidden` tests fail (`expected [ true, false ] to deeply equal [ true, true ]`).
- `legendItems` `'both' : 'current'` flipped: "lists each key once" fails on `lines` values; "without a pinned run" fails.
- pinned-only filter forced always true: "lists each key once" and "lists a shared series once" fail.
- pinned-only colour replaced by `seriesColor(0)`: colour test fails.
- `{pinned && <PinnedLineKey />}` made unconditional: "only with a pinned run" test fails (`not to contain 'chart-pinned-key'`).
- label 'current run' renamed: key test fails on `toContain('current run')`.
- Not covered by unit tests: the dashed swatch style for pinned items and the key's swatch styles; they are asserted only in the acceptance specs (not run).

## Stages
- `npx tsc --noEmit && npm run lint:dup`: pass, 0 clones.
- `npx next build`: pass.
- Codegen: none configured.

## Invariant check
No A1-A3 path touched. Marker legend unchanged.

## Notes / out of scope
- `isLineHidden` takes a line key and strips a leading `pinned:`; a current series whose key itself starts with `pinned:` would be mishandled (no such key exists today).
- The `PinnedLineKey` swatches use `currentColor`, not a series colour.
