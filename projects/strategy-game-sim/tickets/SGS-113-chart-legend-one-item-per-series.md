# SGS-113: List each chart series once and explain the pinned line once

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M8 / M8.4
- **Priority**: medium
- **Risk**: low
- **Invariants**: none (no A1-A3 path: no game number, resource or simulation timing changes)
- **LOC estimate**: 80 (`legendItems`, `LegendItem`, a hidden-line helper and the new `PinnedLineKey` in `chart-rows.ts` / `chart-legend.tsx`, and the two `hide` props in `line-chart.tsx`)
- **Depends on**: none
- **On merge**: none
- **Source**: design/M8.md C10 and Criteria map M8.4; MILESTONES.md M8.4

## Context

With a run pinned, every chart legend lists each series twice (`Food` and `Food (pinned)`) and hides each line separately. M8.4 asks for one legend item per series with a colour, a single key that explains solid = current run and dashed = pinned run, and a hide toggle that hides both lines of a series.

## Scope

All paths are under `components/apps/aoe4-build-order/` unless noted. Design contract C10 is the source for names.

- `chart-rows.ts`:
  - `LegendItem` becomes `{ key: string; name: string; color: string; lines: 'current' | 'pinned' | 'both' }`; the `pinned` field is removed.
  - `legendItems(series, pinned?)` returns one item per series key: the current keys in their order, then the pinned-only keys in pinned order. `key` is the series key (never `pinned:<key>`), `name` is the series name with no ` (pinned)` suffix. `lines` is `'current'` for a current-only key, `'both'` for a key in both runs, `'pinned'` for a pinned-only key. `color` is `seriesColor(index)` for `current` and `both` and `pinnedColor(series, key, pinnedIndex)` for `pinned`.
  - Add one small pure helper that says whether a given line key is hidden under the new rule (the hidden set holds series keys only; a hidden key hides the `key` line and the `pinnedKey(key)` line). Name is the implementer's; `line-chart.tsx` uses it for both `hide` props, so the rule exists once. `toggleHidden` is unchanged.
- `chart-legend.tsx`:
  - `SeriesLegend` swatch: `solid` for `current` and `both`, `dashed` for `pinned`. Everything else about the item (`data-testid="chart-series-legend-item"`, `data-series`, `aria-pressed`, dimming at opacity 0.5, `chart-series-legend-swatch`) is unchanged.
  - New exported `PinnedLineKey` renders `data-testid="chart-pinned-key"` once per chart legend, only when a pinned run is shown (`pinned` is set). It holds two swatches: a solid one labelled "current run" and a dashed one labelled "pinned run". `SeriesLegend` renders it inside the series legend element (`chart-series-legend`), after the items, so the order "series legend, then marker legend" does not change.
- `line-chart.tsx` (legend and hidden-set hunks only): the current `Line` is `hide` when its series key is hidden; the pinned `Line` is `hide` when the same series key (not `pinnedKey(key)`) is hidden. The `Line` `name` props (`<name> (pinned)`, shown in the tooltip) stay as they are: the tooltip has no key to explain the dashed line.
- `docs/aoe4-build-order.md`: rewrite the legend sentences in the chart section (the one that says a pinned item is hidden under its own `pinned:<key>` key, independent of its current series' item, with the `Gold` / `Gold (pinned)` example) and the sentence in the pinned-run section that says each pinned line "toggles from the series legend like any series" and names the legend item `<name> (pinned)`. They state: one item per series; a pinned-only series is listed once; the `chart-pinned-key` explains solid and dashed; hiding an item hides both lines. The line keys `pinned:<key>` on `data-series` of the chart paths stay and stay documented. Grep the doc for `pinned:` and `(pinned)` and fix every legend statement; the marker legend's `Age-up (pinned)` item stays.
- Tests (examples, not a closed list; every test that pins the old legend shape):
  - `chart-rows.test.ts` `describe('legendItems')`: replace the three tests that pin the old shape (keys `a, b, pinned:b, ...`, `(pinned)` names, the `pinned` boolean). Cover a series in both runs, a current-only series, a pinned-only series, and the `color` of each.
  - The unit test of the hidden-line helper.
  - `line-chart.test.ts`: a render with a pinned run asserts one `chart-pinned-key` with the two labels, and a render without a pinned run has none.
  - `acceptance/aoe4-build-order-pin-compare.spec.ts`: the two legend tests ("the pinned legend item toggles only the pinned line" and "the current legend item toggles only the current line") are replaced by tests of the new behavior. Every other `data-series="pinned:..."` locator on chart paths stays.

**Out of scope:** the marker legend and its `Age-up (pinned)` item; tooltip text; line colours and dash pattern; chart collapse and reorder and the header controls (a sibling ticket edits other hunks of `line-chart.tsx`); acceptance `holdSimulate` consolidation (a sibling ticket edits other tests in `aoe4-build-order-pin-compare.spec.ts`).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `legendItems` returns exactly one item per distinct series key across the current and pinned series: no item's `key` starts with `pinned:` and no item's `name` contains `(pinned)`. A unit test with one current-only, one both-runs and one pinned-only key pins the order (current keys in order, then pinned-only keys) and the `lines` value of each (`current`, `both`, `pinned`). It fails if `legendItems` still emits a second item for a shared key.
- [ ] The legend item colour is `seriesColor(index)` for `current` and `both` items and the same colour as the pinned line (`pinnedColor`) for a `pinned` item; a unit test pins a pinned-only key's colour to a value that differs from the colour of the first current series.
- [ ] With a run pinned, each of the four charts shows one `chart-pinned-key` containing a solid swatch labelled "current run" and a dashed swatch labelled "pinned run"; with no run pinned, no chart has one. After unpinning, it is gone.
- [ ] In the series legend the swatch `border-top-style` is `solid` for `current` and `both` items and `dashed` for a pinned-only item, and `border-top-color` equals the matching line's `stroke` (checked in acceptance with `getComputedStyle` via `toHaveCSS`).
- [ ] Clicking a legend item for a series present in both runs (for example `food` in Gather rates) hides both the `food` line and the `pinned:food` line, sets `aria-pressed` on that one item only, and dims it; clicking again restores both lines. Other series' lines are untouched. Checked in `aoe4-build-order-pin-compare.spec.ts`.
- [ ] Hiding a pinned-only series item hides its dashed line (unit test of the hidden-line helper: hidden set `{z}`, `pinned:z` hidden, a pinned-only key; and hidden set `{a}`, both `a` and `pinned:a` hidden, `b` and `pinned:b` not). The test fails if the pinned line still looks up `pinnedKey(key)` in the hidden set.
- [ ] The marker legend is unchanged: `Age-up (pinned)` still appears when the pinned run has age-up markers (existing `line-chart.test.ts` cases keep passing without edits).
- [ ] `docs/aoe4-build-order.md` states one item per series, the pinned-line key, and that hiding an item hides both lines; no sentence still says a pinned item toggles independently or is named `<name> (pinned)` in the legend.
- [ ] `npx tsc --noEmit`, `npm run lint:dup` and `npm test` pass; every test edited is listed in the report.
- [ ] No INVARIANTS.md regressions

## Open questions

none
