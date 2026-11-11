# SGS-138: Keep pinned runs out of the chart tooltip and show one dashed legend entry

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M9 / M9.5
- **Priority**: medium
- **Risk**: low
- **Invariants**: none (UI only; no engine, data or simulation path is touched)
- **Unverified assumptions**: recharts at the pinned version leaves a `Line` out of the `Tooltip` payload when `tooltipType="none"` is set on it (or whichever exclusion the implementer picks), and still draws the line; unit tests render with `renderToStaticMarkup`, which draws no tooltip, so only the Playwright hover case exercises it for real
- **LOC estimate**: 60 (the `Tooltip` exclusion and the `PinnedLegend` render condition in `line-chart.tsx`, the `PinnedLegend` component and the removals in `chart-legend.tsx`; business logic only, tests and docs excluded)
- **Depends on**: SGS-135
- **On merge**: none
- **Source**: `design/M9.md` C6 and the "Pinned display (M9.5)" behavior rules, M9.5 row of the Criteria map; plan outline K

## Context

With a pinned run, every chart's tooltip lists a `<name> (pinned)` entry per pinned series, so hovering doubles the rows, and the chart explains the line styles in two places: the `PinnedLineKey` in the series legend and an "Age-up (pinned)" item in the marker legend. M9.5 keeps pinned runs out of the tooltip and replaces both legend pieces with one dashed legend entry per chart.

## Scope

State at `origin/main`, plus the end state of SGS-135 (`ChartHeader` and `ChartControls` live in `chart-header.tsx`; `SeriesChart` passes `headerControls` to the header). Everything is in `components/apps/aoe4-build-order/` unless named otherwise. Contract names are those of `design/M9.md` C6.

- `line-chart.tsx`, `SeriesChart`:
  - Exclude each pinned `Line` (the `pinned?.series.map` block) from the `Tooltip`, so the tooltip lists only current-run series. The pinned lines keep their name `<name> (pinned)`, dashed style, colour rule, `data-series="pinned:<key>"` and the `isLineHidden` hiding. How to exclude (a `tooltipType` on the `Line` or a `Tooltip` filter) is the implementer's choice; design "Not decided" leaves it open.
  - Render `PinnedLegend` after `SeriesLegend` and `MarkerLegend` when `pinnedLegendShown(pinned, hidden, pinnedAgeUpCount)` is true, called with the chart's `hidden` state and the number of pinned age-up markers (`chart-pinned-marker`) it draws. "Draws" means visibly drawn: a pinned line hidden through its series legend item does not count (design C6). Stop passing `pinnedAgeUps` to `MarkerLegend`. A collapsed chart renders none of its body, so no `PinnedLegend`, as today for the other legends.
  - Nothing else in `line-chart.tsx` changes (views, marker labels and the legend hover are later tickets; do not touch the header code SGS-135 moved).
- `chart-legend.tsx`:
  - Add `pinnedLegendShown(pinned: PinnedSeries | undefined, hidden: ReadonlySet<string>, pinnedAgeUpCount: number): boolean` (exported, pure): true when `pinnedAgeUpCount > 0` or some pinned series is not hidden per `isLineHidden(hidden, pinnedKey(key))`; false with no pinned run and no age-ups.
  - Add `PinnedLegend`: a `<p data-testid="chart-pinned-legend">` holding a swatch `<span data-testid="chart-pinned-legend-swatch" data-line-style="dashed">` followed by the text "dashed = pinned build" (text and ids fixed by the design). It is not a button and not focusable.
  - Remove `PinnedLineKey` (`chart-pinned-key`, `chart-pinned-key-swatch`) and its use in `SeriesLegend`, and remove the `MarkerLegend` `pinnedAgeUps` prop with its `data-kind="pinned-age-up"` item; `MarkerLegend` returns nothing when no kind is present.
  - Keep the series legend rule that a series only the pinned run has is listed once with a dashed swatch (`legendItems` in `chart-rows.ts` is unchanged), and that an item hides both lines of its series.
- `chart-rows.ts`: its doc comment, if it mentions the pinned key or the pinned legend item, is updated; no logic change.
- Docs made untrue, in `docs/aoe4-build-order.md` (the series-legend and marker-legend paragraphs around the pinned-run description): that the series legend holds a `chart-pinned-key` explaining solid and dashed; that the marker legend ends with an `Age-up (pinned)` item shown even when the current run has no markers. Add that pinned lines and markers are not in the tooltip, and that each chart with a pinned line or marker has one "dashed = pinned build" entry. Grep the doc and `ARCHITECTURE.md` for `chart-pinned-key`, `pinned key`, `Age-up (pinned)` and `pinned-age-up`, and fix every statement the change contradicts. The hover title on a pinned marker is unchanged. Do not quote measured results.
- Tests:
  - `line-chart.test.ts`: the `pinned line key` cases and the marker-legend cases that pin the `pinned-age-up` item and the `pinnedAgeUps` behavior are rewritten to the new behavior; the "lists a shared series once" case stays. Add `PinnedLegend` presence cases and a `pinnedLegendShown` table (in `chart-legend.test.ts` or `line-chart.test.ts`; see criteria). The implementer lists every test it edits.
  - `acceptance/aoe4-build-order-pin-compare.spec.ts`: the case that checks `chart-pinned-key` and its swatches is rewritten for `chart-pinned-legend`; add the hover case (see criteria). Keep the dashed-line, legend hide and restore cases.
  - Any other test or spec that reads `chart-pinned-key`, `pinned-age-up` or a `(pinned)` tooltip row moves to the new behavior. `acceptance/aoe4-gather-rates-per-villager.spec.ts` reads a `Food (pinned)` tooltip value through `hoverRead`: that case checks pinned values in the tooltip, which no longer exist; rewrite it to read the pinned values another way that still proves the per-villager division of the pinned run (for example from the pinned line's drawn path), or move the check to Vitest, and say which in the report.

**Out of scope:** marker legend hover or focus labelling, view toggles, the chart header, drag and caret (SGS-135), marker label placement, and changing the pinned colour rule, dash pattern or `pinnedKey` naming.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `PinnedLegend` renders exactly one `chart-pinned-legend` containing a `chart-pinned-legend-swatch` with `data-line-style="dashed"` that draws a dashed border (computed style), and the text "dashed = pinned build". It is after the series legend and the marker legend in DOM order, and it is not a button and not focusable.
- [ ] `SeriesChart` static markup renders `chart-pinned-legend` when given a pinned series, and when given only pinned age-up markers (no pinned series); it renders none with neither, and none when the chart is collapsed. A test fails if the legend is rendered whenever `pinned` is defined regardless of what is drawn, or is absent when only a pinned marker is drawn. (respec 1) With the only pinned series hidden and no pinned age-up the markup has no `chart-pinned-legend`; with the same hide plus a pinned age-up it has one.
- [ ] (respec 1) `pinnedLegendShown` table test, cases: no pinned run and 0 age-ups is false; one pinned series not hidden is true; the only pinned series hidden (`hidden` holds its current key) and 0 age-ups is false; the same with 1 pinned age-up is true; two pinned series with one hidden is true. A test fails if the function ignores `hidden`, or ignores the age-up count. Playwright: hiding the only pinned line through its series legend item removes `chart-pinned-legend` and showing it again restores it, with no pinned age-up marker in the chart; repeated hide and show follows the latest state.
- [ ] `chart-pinned-key`, `chart-pinned-key-swatch`, `PinnedLineKey` and `data-kind="pinned-age-up"` no longer exist. Search criterion: `git grep -n "chart-pinned-key\|PinnedLineKey\|pinned-age-up"` has no match in source, tests, acceptance specs or docs once the ticket is done. `git grep -n "pinnedAgeUps"` has no match in `chart-legend.tsx`.
- [ ] The marker legend lists only kinds present in the current run: with no current markers and a pinned run, no `chart-marker-legend-item` is rendered and `MarkerLegend` renders nothing; with current markers it lists exactly their kinds.
- [ ] Playwright (`acceptance/aoe4-build-order-pin-compare.spec.ts`): with a current and a pinned run, hovering inside each chart shows a tooltip whose items include no name ending in `(pinned)` and do include the current-run series; the pinned lines are still drawn dashed (still `data-series="pinned:<key>"`). The test first asserts the pinned lines exist, so it cannot pass on a chart that lost them.
- [ ] Playwright: each chart with a pinned run has exactly one `chart-pinned-legend`; after unpinning, none. A series only the pinned run has is still listed once in the series legend with a dashed swatch, and clicking a series legend item still hides and restores both its lines.
- [ ] The tooltip's time label and current-run values are unchanged (the existing hover-reading specs pass, apart from the pinned-value rewrite named in Scope).
- [ ] The docs listed in Scope no longer contradict the code and describe the tooltip rule and the one pinned legend entry.
- [ ] `npx tsc --noEmit`, `npm run lint:dup` and `npm test` pass; `next build` succeeds.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-11

- Underspecified: whether a pinned line hidden through its series legend item counts as drawn for `PinnedLegend`.
- Changed: Scope names `pinnedLegendShown` (design C6) and the hidden-series rule; criteria add its table cases and the hide/show cases; the designer question is deleted.
- Stands: all other scope and criteria are unchanged.
