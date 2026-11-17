# SGS-194 implementer report 1

Status: needs_review

- Ticket: SGS-194. Branch: sgs-194-results-charts-table. Tip: 819d7892c9759c7ecb9e49fe8dd6a699a2cfce42 (base origin/main 87f0cd7).
- Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-194-results-charts-table

## Files touched (all under components/apps/aoe4-build-order/ unless noted)
- chart-header.tsx: `ChartHeader` replaced by `ChartHeaderRow` (`tr[data-testid=chart-header-row]`: td handle, `th scope="rowgroup"` with h3.h5, td caret, td controls; empty cells without layout).
- chart-header.module.css: flex rules removed; `.cell`, `.title` (h3 margin reset), `.dragHandle` kept.
- line-chart.tsx: `SeriesChart` root is a `tbody` (same test id, data attrs, `sectionRef`), then `ChartHeaderRow`, then `tr[chart-body-row]` (hidden when collapsed) with one `td colSpan=4` holding `chart-body` div and the measuring svg. Large diff is re-indentation only.
- results.tsx: `table[chart-table][aria-label="Results charts"]` with colgroup of four cols and one SeriesChart per id, after `chart-order-status`.
- results.module.css: `.chartTable` (width 100%, fixed layout, collapsed borders), column widths (3rem handle and caret, 11rem controls), `.chartBodyCell`, `.chart` renamed `.chartGroup`; `.chart { min-width: 0 }` dropped (not needed, per spec-gate note 4); opacity 0.6 is on the tbody only, rows are untouched.
- chart-header.test.ts, line-chart.test.ts: unit tests updated/added.
- acceptance/aoe4-chart-layout.spec.ts, acceptance/aoe4-results-split.spec.ts: updated per Scope and new cases (below).
- use-chart-drag.ts unchanged: it measures the tbody passed via `sectionRef`.

## Tests
- Unit: chart-header + line-chart 54 pass; full `npm test` 2614 passed, 15 skipped.
- Acceptance run once (specs were authored here): aoe4-chart-layout, aoe4-results-split, aoe4-split-tab-order: 36/36 pass. Tab-order spec unchanged. Other acceptance specs not run.
- Invariants encoded: tbody root + two rows + single colSpan=4 cell + `scope="rowgroup"`; four cells in order, empty handle/caret without layout; collapsed body row hidden with chart-body keeping id/hidden; four header rows share column lefts within 1 px with 2 collapsed charts at 1200 and 1800 (one evaluate under expect.poll); no header cell has scrollWidth > clientWidth; table, results-column and page do not scroll sideways at both viewports; collapsed group height equals header height; during drag tbody opacity is 0.6 and its rows 1 (so never 0.36 and not 1); drop index uses whole row group midpoints.
- Spec-gate notes followed: opacity once on tbody and tested on both tbody and rows (1); overflow check at min viewport; no-sideways-scroll at both viewports; `.chart` min-width removed.

## Pre-existing tests edited
- chart-header.test.ts: rows for `ChartHeader` became `ChartHeaderRow` (order test now cell-based; without-layout test asserts empty cells). Allowed by Scope.
- line-chart.test.ts `chart controls`: added tbody/body-row assertions to the collapsed and expanded cases; added one new tbody-structure test. Allowed by Scope.
- aoe4-chart-layout.spec.ts: `readLayout` and `sectionBoxes` now select `[data-testid="chart-table"] > tbody[data-collapsed]`; other assertions unchanged. Allowed by Scope.
- aoe4-results-split.spec.ts "the four charts are direct children..." rewritten to assert the charts are the tbody children of `chart-table` in order. Allowed by Scope.

## Doc claims
No docs or comments added. Docs (`docs/aoe4-build-order-ui.md`) not edited, per Scope.

## Mutation checks
- line-chart.tsx colSpan 4 to 3: "renders a tbody root..." fails at the colSpan assertion. Undone.
- chart-header.tsx scope rowgroup to col: "is a header row of four cells..." fails on `scope="rowgroup"`. Undone.
- results.module.css controls width 11rem to 2rem: both alignment tests fail (overflow/alignment). Undone.
- results.module.css `.chartGroup[data-dragging]` selector broken: opacity test fails (group 0.6 expected). Undone.
- use-chart-drag.ts midpoints from the first `tr` (header row) only: midpoint test fails (order changed). Reverted with git checkout.
- The collapsed-body-row `hidden` assertions, other cell-order and empty-cell assertions were not individually mutated.

## Build, lint
- `tsc --noEmit` clean, `lint:dup` 0 clones, `npx next build` succeeds (after link-node-modules). Codegen not set.

## Invariant check
A1 to A3 not touched (markup and CSS only). Persistence files untouched.

## Unverified assumptions added
None.

## Out-of-scope findings
None. Note: the first acceptance run failed because node_modules had not been linked; `link-node-modules.sh` (part of the build command) fixed it.
