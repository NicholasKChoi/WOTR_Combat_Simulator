# SGS-203 implementer report 5

Status: needs_review
Branch: sgs-203-marker-control-stays-in-view, tip 6c71747fc4e5aab47d80e7ef9442ed308f15f0a7 (base origin/main 636193d)
Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-203-marker-control-stays-in-view

## Files
- components/apps/aoe4-build-order/results.module.css: new `.markerControl` (sticky, top 0, z-index 5, opaque body background, padding-bottom 1rem). `.legend` untouched.
- components/apps/aoe4-build-order/chart-legend.tsx: `MarkerControl` root uses `styles.markerControl`, `mb-3` dropped, ref + `useMarkerControlHeight` before the early return.
- components/apps/aoe4-build-order/use-marker-control-height.ts: new hook, modelled on `useRunBarHeight`; writes `--aoe4-marker-control-height` (measured height, ResizeObserver) on the enclosing `section`, removes it on cleanup or when the control is absent.
- components/apps/aoe4-build-order/workbench.module.css: `.resultsColumn { scroll-padding-top: var(--aoe4-marker-control-height, 0px) }`.
- components/apps/aoe4-build-order/workbench-columns.tsx: `resultsColumn` class on the results column only.
- components/apps/aoe4-build-order/chart-legend.test.ts: one unit test (marker control has `markerControl`, no `mb-3`; series legend does not have `markerControl`).
- acceptance/aoe4-marker-control-sticky.spec.ts: new regression spec (5 tests).
- docs/aoe4-build-order-ui.md: Marker control paragraph.

## Tests
- Unit: chart-legend.test.ts 15 pass; full `npm test` 2864 passed, 15 skipped, 91 files pass.
- Acceptance (ran the new spec plus the neighbouring specs, not the whole suite): new spec 5/5, plus marker-labels, legend-pressed-state, chart-layout, results-split, chart-zoom, min-width, help-modal, split-scroll, step-band, compact-view, key-results-collapse: all pass (103 + 43). No pre-existing test edited.
- Note: at scrollTop 0 the control is not at the column's top edge (messages and key results sit above it in the column), so the "top at column edge" check covers scrolled positions only; at scrollTop 0 the spec checks the first chart header starts at or below the control's bottom.

## Bug regression
Base 086615606cd562cde15a7d9c6f46a8a599e14253 (origin/main), scratch checkout, `npx playwright test acceptance/aoe4-marker-control-sticky.spec.ts`: 4 of 5 fail. Test 1 fails on "control pinned at scroll 518" (the named bug); 2 (hover/toggle against last chart, control not in view), 4 (elementFromPoint) and 5 (scroll-padding-top stays 0 at base while with markers it must be >20px) also fail. Test 3 (focus clearance) passes at base because without a stuck control there is nothing to clear; it is guarded by the mutations below. Scratch checkout removed.

## Mutation checks (all undone, tree clean afterwards)
- results.module.css `position: sticky` -> relative: tests 1, 2, 4 fail (test 1 "control pinned at scroll 518").
- remove `z-index: 5`: tests 2 and 4 fail (elementFromPoint false).
- remove `background`: test 4 (opaque assertion) fails (and test 2).
- `padding-bottom: 1rem; margin-bottom: -2rem`: test 1's "first chart header not covered at scrollTop 0" fails.
- workbench.module.css scroll-padding-top -> 0px: test 3 (focus clearance) and test 5 (padding > 20px with markers) fail.
- scroll-padding-top -> fixed 3rem: test 5 (zero without markers) fails.
- hook height -> fixed 48px: test 3 fails (wrapped-control case).
- hook ResizeObserver no-op: test 3 fails (wrapped-control case).
- hook cleanup `removeProperty` removed: test 5 (zero padding without markers, Build column) fails.
- chart-legend.tsx: `markerControl` removed from the control: unit test fails ("to include 'markerControl'"); `markerControl` added to SeriesLegend: fails ("to not include"); `mb-3` re-added: fails ("to not include 'mb-3'").
- Deleted a dead test: "series legend and pinned legend scroll away" could not be failed by making `.legend` sticky (sticky stays inside its own chart row, so the legend still scrolls away). That criterion is covered by the unit test above (only `MarkerControl` carries the sticky class; `.legend` is unchanged).
- The spec originally had a scrollTop-equality assertion in the hover test and a plain `focus()` in the clearance test; both could not fail on a real break (scrollTop shrinks when labels change chart height; focus() centres the element) and were replaced with a control-in-view poll and `scrollIntoView({block:'nearest'})` plus focus.

## Doc claims
docs/aoe4-build-order-ui.md Marker control paragraph, added: "It stays at the top of the Results column's view while that column scrolls, drawn over the charts beneath it, so it works against every chart and not only the first; only this control sticks, and each chart's own legends and zoom bar scroll with their chart. Tabbing to or scrolling to a chart control keeps it clear of the stuck control, and a run with no markers draws no control and leaves no space for one."
- Sticky/over-charts: `.markerControl` in results.module.css; spec tests 1 and 4.
- Legends and zoom bar scroll with their chart: `.legend` unchanged and the sticky parent of those is their own chart row; unit test above. The zoom bar is untouched.
- Clearance: `.resultsColumn` scroll-padding-top and `useMarkerControlHeight`; spec test 3.
- No markers: `MarkerControl` returns null and hook clears the property; spec test 5.
The Chart table paragraph's "under the marker control" still holds and is unchanged.

## Codegen, build, lint
codegen: not set. `npx next build`: passes. `npx tsc --noEmit && npm run lint:dup`: pass, 0 clones (a first draft of the spec duplicated the marker-labels setup and was trimmed).

## Invariants
No INVARIANTS.md entries apply (A1-A3 untouched; no engine change). Tab order and DOM order are unchanged; control behaviour unchanged.

## Unverified assumptions
The ticket's entry (sticky inside the scrolling column, scroll-padding honoured) is exercised by the real Chromium spec. Added: Chromium's `scrollIntoView({block:'nearest'})` aligns to the scroll-padding edge (spec test 3 depends on it); plain `focus()` instead centres the element and so cannot show the padding. The padding is written to the enclosing `section` as a custom property (inherited by the Results column), as `useRunBarHeight` does for the run bar.

## Out-of-scope findings
None.
