# SGS-201: Make the series legend's aria-pressed mean shown

- **Type**: Bug
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: low
- **Risk**: low
- **Invariants**: none adjacent (A1 to A3 guard engine results and data; this changes one ARIA attribute on a chart control)
- **Unverified assumptions**: none (the unit tests render the real markup and the acceptance specs read `aria-pressed` from the live page in Chromium)
- **LOC estimate**: 1 (the `aria-pressed` expression in `SeriesLegend`; tests and one doc sentence excluded)
- **Depends on**: none
- **On merge**: none
- **Source**: BACKLOG.md standalone bug "Series legend aria-pressed is inverted vs marker control" (found by SGS-200); owner answer to Q135, option A (fix the series legend so `aria-pressed="true"` means shown)

## Context

### Cause

`SeriesLegend` in `components/apps/aoe4-build-order/chart-legend.tsx` sets `aria-pressed={hidden.has(item.key)}` on each `chart-series-legend-item` button, so it is `true` while the series is hidden. `MarkerControl` in the same file sets `aria-pressed={!hidden.has(kind)}` (`true` while the kind is shown), and `docs/aoe4-build-order-ui.md` documents that meaning for the marker control. A screen-reader user therefore hears opposite meanings from two toggles that look and behave alike. The series button has no `aria-label`, so its accessible name is the series name and the pressed state is the only thing that carries shown or hidden.

### Why the tests did not catch it

The tests pinned the inverted value as correct. `chart-legend.test.ts` covers the marker control's pressed state but not the series legend's; `line-chart.test.ts` ("renders one pressed-state button per series with its key") asserts `aria-pressed="false"` for series that are all shown; and several acceptance specs assert `aria-pressed="true"` right after hiding a series. No test compared the two controls, and the pressed state has no sighted effect (the dimming reads `hidden`, not `aria-pressed`), so nothing visual failed.

### Same defect elsewhere

Searched `aria-pressed` across `components/` and `acceptance/` at `origin/main`: `MarkerControl` is already correct, `chart-view-toggle.tsx` and `build-input.tsx` use `aria-pressed` for the selected option (not a hidden set) and are correct. `SeriesLegend` is the only inverted site.

## Scope

All paths under `components/apps/aoe4-build-order/` unless noted.

- `chart-legend.tsx`, `SeriesLegend`: `aria-pressed` is `true` while the series is shown and `false` while it is hidden, the same meaning as `MarkerControl`. Nothing else changes: the dimming, `onToggle`, the testids and the swatch stay as they are. A sighted user sees no change.
- Tests that pin the old value get the new expected value (rule, since a sibling ticket may add more before this lands; search `aria-pressed` and `chart-series-legend-item` in `components/` and `acceptance/` and edit every test that reads a series legend item's pressed state). Examples found at base: `line-chart.test.ts` "renders one pressed-state button per series with its key"; `acceptance/aoe4-build-order-pin-compare.spec.ts` (the two `chart-series-legend-item` `[aria-pressed="true"]` counts and the item's own check around hiding and restoring `food`); `acceptance/aoe4-chart-layout.spec.ts` (the collapse test's two checks on the hidden item); `acceptance/aoe4-chart-views.spec.ts` (the `wood` item checks across view toggles); `acceptance/aoe4-units-chart-upgrade-dots.spec.ts` (the hidden Longbowman line's item). `acceptance/aoe4-help-modal.spec.ts` only snapshots `aria-pressed` before and after and compares for equality, so it keeps its assertion. Every other assertion in those specs keeps its expected value. The implementer lists every test edited.
- New unit coverage in `chart-legend.test.ts` (or the existing `line-chart.test.ts` series-legend block, whichever the nearest siblings use) for `SeriesLegend` markup: with some keys in `hidden` and some not, each item's `aria-pressed` and dimming are read back and the hidden ones are the dimmed and `false` ones. Include the pinned-only series item, whose key is in `legendItems`, so a wrong key lookup shows.
- Docs: `docs/aoe4-build-order-ui.md` describes the series legend click behavior (hides, dimmed, restores) but not the pressed state, while it states the marker control's `aria-pressed` meaning. Add the series legend's `aria-pressed` meaning next to that behavior, so both toggles' meaning is documented. The implementer writes the sentence.

**Out of scope:** the marker control, `chart-view-toggle`, and `build-input` pressed states (already correct); any visual change to the legend; renaming or relabeling legend buttons; adding `aria-label` to series items.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] A series legend item's `aria-pressed` is `"true"` while its series is shown and `"false"` while it is hidden, on first render (all shown) and after hiding then restoring it; a unit test over the rendered `SeriesLegend` markup fails if the value is inverted (the shown items and the hidden items are checked in the same render, including a pinned-only series item).
- [ ] An acceptance check on the live page hides one series by clicking its item, then asserts that item reads `aria-pressed="false"` and every other item on that chart reads `"true"`, and clicking it again returns it to `"true"`. The check also asserts the item is dimmed (computed `opacity`) while hidden, so a change that moves only one of the two signals fails it.
- [ ] The series legend and the marker control agree: in the same state a shown entry of either control reads `aria-pressed="true"` and a hidden entry `"false"` (the unit test or the acceptance check asserts both controls in one render or one page).
- [ ] No sighted-user change: the dimmed opacity, swatches, order, names and click behavior of the series legend are unchanged (the existing opacity, line-count and swatch assertions keep their expected values).
- [ ] Existing tests: each test that pinned the inverted pressed value is rewritten to the shown-means-true value; every other assertion keeps its expected value; the report lists each test edited.
- [ ] `docs/aoe4-build-order-ui.md` states that the series legend item's `aria-pressed` is `true` while the series is shown (no search count).
- [ ] No INVARIANTS.md regressions

## Open questions

none
