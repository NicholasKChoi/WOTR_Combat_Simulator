# SGS-216 ticket report 1

File: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-216-population-chart-cap-mark.md`
Branch to use: `sgs-216-population-chart-cap-mark`. Lint (`ticket-lint.py --spec ... origin/main`): clean after one fix (Invariants must name the section `AoE4 Build Order Simulator`).

## Summary

"Add a Population chart with a population cap mark", Feature, M13, component aoe4-build-order, Risk standard (confirmed: no `criticalPaths` file, no public API or schema change, about 110 business-logic lines; invariants A1 to A3 are adjacent by path only). Depends on none; On merge none. Covers M13.2 and the UI doc, help text, ARCHITECTURE.md and unit-test parts of M13.3, under design revision 2 (D15 to D18). Scope:
- `chart-markers.ts`: `ChartTimeMark`, `TIME_MARK_COLOR`, `timeMarkLabel`, `timeMarkLabelPosition(at, end, plotWidth, labelWidth, origin = 0)`.
- `result-series.ts`: `populationSeries`, `populationCapMark`.
- `line-chart.tsx`: optional `timeMark` prop, an exported pure in-window decision, one `ReferenceLine` `chart-time-mark`.
- `chart-layout.ts`: fifth id.
- `results.tsx`: record entry and `timeMark` wiring for the current run only.
- Docs and help: UI doc, format doc, page-help Charts section, ARCHITECTURE.md row.
- Existing specs that assume four charts are updated by rule, with the examples the grep found.

Criteria: unit tests for the series, the mark, the label, the label position (boundary and `origin`), the in-window rule (both edges), the colour, layout normalization and the help text. The drawn mark itself is not unit-testable (no recharts SVG at the unit layer), so a criterion has the implementer record observed behavior at 1200, 1280 and 1800 px, and SGS-217 pins it in Playwright.

Diagrams: none (single-component; the "no diagram required" line).

## Findings beyond the outline

- `docs/aoe4-build-order-format.md` also says "The page draws four graphs ... `spawnedPopulation` has no graph" (Outputs) and has a graph diagram listing four graphs. Both go stale. They are in Scope. SGS-215 edits other lines of the same file (the `spawnedPopulation` meaning), so a textual merge neighbour is possible; the ticket tells the implementer to touch only those lines.
- `chart-layout.test.ts` "reads an M8-shaped value unchanged" fails once there are five ids. Scope says to pin its four-id stored layout and add the append case.
- The UI doc says the chart-order status announces a position "out of four", and has the default order sentence. Both are in Scope.
- Specs with hard-coded four-chart lists or orders: `aoe4-chart-layout.spec.ts` (`expectLayout` lists of four, a four-id destructure), `aoe4-chart-row-feedback.spec.ts`, `aoe4-chart-views.spec.ts` (`DEFAULT_Y_LABELS` record), `aoe4-key-results-collapse.spec.ts`, and test titles that say "four" in `aoe4-results-split.spec.ts` and `aoe4-build-order-step-band.spec.ts`. The ticket gives a rule and lists these as examples; the implementer must run each spec file that names `CHART_IDS` or a chart id, one at a time.

## Open questions

none (`owner` 0, `designer` 0).

## Overlap with other tickets

SGS-215 touches disjoint files, apart from the format doc noted above. SGS-217 depends on this ticket and reads these names: test ids `chart-population` and `chart-time-mark` (`data-at`, `data-label`), label text `Population cap m:ss`. The in-window helper's name is left to the implementer, who reports it.

## Not run

Mutation checks and a scratch checkout were not needed (no runnable-command criterion, no search criterion that quotes code). The doc-search criteria are scoped to doc paths and state end states. I confirmed against origin/main (7d74800) that the "four charts", "out of four", "has no graph" and "four graphs" sentences exist today. No scratch checkout was created.
