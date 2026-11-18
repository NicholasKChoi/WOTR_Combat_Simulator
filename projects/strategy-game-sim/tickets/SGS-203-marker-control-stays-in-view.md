# SGS-203: Keep the marker control in view while the results column scrolls

- **Type**: Bug
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: medium
- **Risk**: standard
- **Invariants**: none
- **Unverified assumptions**: CSS `position: sticky` on a block inside the `overflow-y: auto` results column sticks to that column's scrollport, and a `scroll-padding-top` on the column keeps a focused or `scrollIntoView`ed element out from under it (a real Chromium run in the regression spec exercises both)
- **LOC estimate**: 35 (a new sticky class in `results.module.css` used by `MarkerControl`, one measured scroll-padding hook or equivalent writing to the Results column, plus doc sentences)
- **Depends on**: none
- **On merge**: none
- **Source**: BACKLOG.md "AoE4 results: the shared marker control does not stay in view while scrolling the charts" (owner M11.8 check, 2026-11-17)

## Context

The one marker control (`MarkerControl` in `components/apps/aoe4-build-order/chart-legend.tsx`, rendered by `Results` in `results.tsx`) is a plain block at the top of `results-last-good`, above `chart-table`. The Results column (`styles.column` with `overflow-y: auto` in `workbench.module.css`, test id `results-column`) scrolls on its own, so once the user scrolls to the second or later chart the control is out of view. Hovering or focusing a kind (which labels that kind on every chart) and toggling a kind are then only usable against the top chart's lines, which defeats a control meant to be shared by all the charts.

### Cause

Nothing pins the control. `MarkerControl` uses only `.legend` from `results.module.css`, with Bootstrap utilities on top. That class has no `position`, so the control scrolls with the table. The series legend and pinned legend in the same file share `.legend`. The existing marker specs (`aoe4-marker-labels.spec.ts`, `aoe4-legend-pressed-state.spec.ts`) act on the control with the column scrolled to the top, and the unit test `chart-legend.test.ts` only renders markup, so none scrolls the column before using the control.

### Interpretation of "with the zoom bar"

The owner described the control as sitting with the zoom bar (the "view finder") at the top of the charts. At the base the only zoom bar is per chart (`ChartZoomBar`, `chart-zoom-bar` testid, drawn inside a zoomed chart's body above its plot), so it scrolls with its own chart and is a different element from the control. This ticket keeps the marker control in view; each chart's zoom bar stays with its chart.

## Scope

- Make the marker control stay at the top of the Results column's visible area while that column scrolls, across the whole length of the chart table. Do it with a new class in `components/apps/aoe4-build-order/results.module.css` that only `MarkerControl` (in `chart-legend.tsx`) uses. The shared `.legend` class must not become sticky: the series legend (`chart-series-legend`) and the pinned legend (`chart-pinned-legend`) use it too, and they stay where they are. The run bar's `.runBar` in `workbench.module.css` is the existing sticky example, with an opaque `var(--bs-body-bg)` background. The control needs an opaque background so charts scrolled beneath it do not show through, and a stacking order above the chart content (recharts tooltips, marker labels, drag handles). It must stay below the annotation popover (`.annotationPopover`, fixed, z-index 1080) and below the help dialog, which opens modal in the top layer. It needs padding in place of the bottom margin so the opaque area has no gap. The `mb-3` utility on the control's root element goes, because the Bootstrap utility is `!important` and a module class cannot override it. The control stays inside `results-last-good` so it still dims with the charts, and it still renders nothing for a run without markers. (respec 1)
- Keep focused and scrolled-to chart content from hiding under the stuck control. The control's height changes (its kinds wrap, the run changes), so a fixed number is wrong. Measure it the way `useRunBarHeight` in `use-run-bar-height.ts` measures the run bar, or with an equivalent that follows the control's actual height, and give the Results column a matching scroll padding at the top. The padding is written to the Results column only (`results-column` in `workbench-columns.tsx`). `.column` in `workbench.module.css` is shared with `build-column`, so the padding does not go into that shared rule unconditionally. When the control is absent (a run without markers, or the control unmounts), the measured value is removed or set to zero, so the column has no top scroll padding. Tab order, DOM order and the control's behavior (toggle, hover and focus labelling, `aria-pressed`, dimming of a hidden kind) do not change. (respec 1)
- Docs made untrue: `docs/aoe4-build-order-ui.md`, the "Marker control" paragraph (it says the control "sits above the chart table" and does not say it stays in view while the column scrolls) and the Chart table paragraph's "under the marker control" if the wording no longer fits. State the new behavior; the implementer writes the wording against the code it builds.
- Tests: add the regression spec below. Search the acceptance specs that scroll `results-column`, focus a chart control, or compare positions near the top of the column (examples: `aoe4-chart-layout.spec.ts` keyboard-reorder and scroll tests, `aoe4-split-scroll.spec.ts`, `aoe4-marker-labels.spec.ts` order check) for results that move: a test of the changed behavior gets the new expected value; any other keeps its assertion and the implementer fixes the cause rather than loosening it. The implementer lists every test it edits.

**Out of scope:** pinning or moving the per-chart zoom bar; changing marker semantics, hover/focus labelling, the kind list or order; the series legends; the run bar; the Build column; any layout change below 1200 px.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] With a run that has markers and the Results column scrolled so the last chart fills the view and the first chart is out of view, the marker control is visible at the top of the column (its rect is inside the column's visible rect and its top is at the column's top edge); at the base it is scrolled out of view, so the spec fails there. Positions are read in one `evaluate` inside `expect.poll` (LESSONS.md, layout values).
- [ ] With the column scrolled that far, hovering a non-age-up kind in the control labels that kind's markers on the last chart (not only the first), and clicking an entry hides that kind's vertical lines on the last chart; clicking again restores them and `aria-pressed` follows. The regression spec covers hover and toggle against a chart other than the first.
- [ ] The control stays in view at every scroll position of the column from the top to the bottom, and at the top (scrollTop 0) sits where it did before the change relative to the first chart (not overlapping it): the first chart's header and the first line of its plot are not covered at scrollTop 0.
- [ ] A chart control that gets keyboard focus, or is scrolled into view, below the control is not hidden under it: after tabbing from the control to a lower chart's drag handle with the column scrolled, the handle's rect top is at or below the control's bottom edge. A test fails if the scroll padding is removed.
- [ ] The control is drawn over the chart content scrolled under it. With the column scrolled so that a chart's plot (and a marker label, where the run has one there) lies under the control's rect, `document.elementFromPoint` at the control's centre returns the control or one of its descendants. Read it in the same `evaluate` as the rects. A test fails if the control has no stacking order above the chart content. The dimmed state (`results-last-good` opacity) still applies to the control. (respec 1)
- [ ] Only the marker control sticks. With the column scrolled past them, the series legend and the pinned legend scroll out of view with their charts. (respec 1)
- [ ] The stuck area follows the control's height: when the control wraps to more lines (a narrower column or more kinds), the focus-clearance criterion above still holds. A test that fixes the clearance at the one-line height fails this case.
- [ ] A run with no markers draws no control and no empty sticky strip at the top of the column, and the Results column's computed `scroll-padding-top` is zero (auto counts as zero). The Build column never gets the padding. Existing assertions about the control's order (after the order status, before the chart table), `Markers` heading, button names and `aria-pressed` pass unchanged. (respec 1)
- [ ] `docs/aoe4-build-order-ui.md` states that the marker control stays at the top of the Results column's view while it scrolls and that it works against every chart; no doc sentence still says only that it "sits above the chart table".
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-17

- Underspecified: Scope allowed making the shared `.legend` sticky, which would also pin the series and pinned legends. It also left the `!important` `mb-3` on the control in place, and placed the scroll padding nowhere in particular. The stacking criterion checked a run-bar overlap that cannot happen, since the run bar is outside `results-column`, and named no observation.
- Changed: Scope now requires a new class used only by `MarkerControl`, removes `mb-3`, and puts the measured padding on the Results column only, cleared when there is no control. The stacking criterion is now an `elementFromPoint` check. New criteria cover "only the marker control sticks" and "no scroll padding without markers". The run-bar clause is dropped, and the stacking bound now names the annotation popover and the modal help dialog.
- No branch work exists yet. Nothing to keep or discard.

## Rework 1 - 2026-11-17 (review)

Bounced by review (reports/SGS-203-review-6.md) at tip 6c71747fc4e5aab47d80e7ef9442ed308f15f0a7. Product change passes all criteria; both blocking findings are in `acceptance/aoe4-marker-control-sticky.spec.ts`. No earlier gate passed a later tip.

Findings:
- `acceptance/aoe4-marker-control-sticky.spec.ts:142`: `focusClearance(LAST)` cannot fail. At 1280x800 the last chart's drag handle sits 1695 px down the column and the column scrolls at most 1554 px, so the scroll target clamps, the handle is already 141 px below the column top and clear of the 74 px control, and removing the scroll padding cannot move it. Only the wrapped-control call at line 147 tests the padding.
- `acceptance/aoe4-marker-control-sticky.spec.ts:89-91, 136-138, 156-158`: each poll compares positions read in two separate `evaluate` calls, against the LESSONS.md layout rule and the criterion that says "same evaluate as the rects".

Required fixes:
- [ ] Run the one-line focus-clearance case on `CHART_IDS[1]` (or the second-to-last chart), and first assert the handle starts above the column top. Breaking `workbench.module.css:45` (scroll padding set to `0px`) must then move handle top minus control bottom from about 0 to about -74; confirm by mutation.
- [ ] Give `readStuck` an optional target selector and return `targetTop` from the same `evaluate`; replace the three two-evaluate polls (lines 89-91, 136-138, 156-158) with it.
