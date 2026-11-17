# SGS-194 spec gate 1

**Verdict: READY**

Read at origin/main (fetched). No Depends-on. No scratch checkout made; judged from file reads.

## Checks
- Grounded scope: `ChartHeader`, `chart-header.module.css`, `SeriesChart` (root div with `sectionRef`, `data-label-rows`, `data-collapsed`, `data-dragging`, `div[chart-body]`, measuring svg), `results.tsx` focus lookup, `use-chart-drag.ts` `sectionRef`/midpoints, `.chart` and `.chart[data-dragging]` in `results.module.css` all exist as the ticket describes. `ChartHeaderRow`, `chart-table`, `chart-header-row`, `chart-body-row` match design C13 to C15 exactly. (C15's `MarkerControl` is M11.3's; the ticket correctly leaves it out.)
- Existing tests that depend on the change are covered by Scope: `aoe4-chart-layout.spec.ts` (`readLayout`, `sectionBoxes` use `results-last-good > [data-collapsed]`), `aoe4-results-split.spec.ts` direct-children case, `chart-header.test.ts`, `line-chart.test.ts`. I searched for others and found none that break: `aoe4-split-tab-order` (uses `closest('[data-testid=chartId]')`, works on a tbody), "charts fill the Results width" (tbody rect width = table width), `aoe4-split-scroll` h3 size check (all h3s still one size), `results-last-good` opacity specs (unchanged element), key-results-collapse and chart-views (testid selectors).
- Invariants A1 to A3 not touched. Persistence untouched. Risk `standard` is right (no strongModelTriggers or criticalPaths symbol). Open questions none. On merge `none` is valid. Docs: `docs/aoe4-build-order-ui.md` "title row" wording stays true; no other doc names the chart markup.
- Unverified assumptions `none` is acceptable: the new acceptance specs read real Chromium layout.

## Notes (non-blocking)
1. Opacity criterion: a computed-style read of the rows cannot see a double application (tbody 0.6 plus tr 0.6 both compute 0.6 on the row). The criterion is satisfiable because a read of the tbody and the rows will fail if tbody sets it and rows read 1. To make "once" testable, have the test read the computed opacity of the tbody as well and assert the tbody is 1 while the rows are 0.6 (or the reverse, whichever the implementation chooses), so the product cannot be 0.36.
2. "The controls column fits the widest view toggle" and "fixed widths" for handle and caret have no observable criterion. With `table-layout: fixed` an undersized column clips or overflows silently. Suggest adding to the alignment case: at `MIN_SUPPORTED_VIEWPORT` no header cell's content overflows its cell (`scrollWidth <= clientWidth`, or each control's right edge is within its cell's right edge) for the Gather rates and Units produced toggles.
3. The B-T5 "never scrolls sideways" criterion names no test beyond the existing split spec, which checks page scrollWidth only at the wide viewport. Consider asserting the Results column (or `chart-table`) has `scrollWidth <= clientWidth` at both viewports in the new alignment spec.
4. `.chart { min-width: 0 }` "moves to whatever element now needs it" is loose; the implementer should keep it only if a test or the width check needs it (the table itself with `width: 100%` and fixed layout usually needs no min-width).
