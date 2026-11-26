# SGS-219 spec-gate report 4

**Verdict: READY**

ticket-lint (graph and spec, at origin/main): exit 0, no errors, no warnings. No scratch checkout made; judged from file reads at origin/main after `git fetch`.

Both gaps from report 2 are closed:
- The acceptance rule now covers every spec reading the Units chart by literal id, `UNITS`, or `CHART_IDS`/an index. The five named specs are listed as examples, and the rule says the list is not closed. A repo search finds many more specs that touch these names (chart-row-feedback, chart-views, chart-zoom, and others), and the rule covers them.
- The label criterion (tagged respec 1) now states a rule: `data-label-rows` equals the marker-label row count, lines, series paths and dots equal those of the same run without the mark, and the mark label is the only extra `text.recharts-label`.
- The overlap stop condition is concrete (clipped by plot or chart body, or on the x-axis line; otherwise report overlap only). The unit bullet states "no unit case".

Checked at origin/main:
- `results.tsx` line 82 has `chart-population` with `timeMark: populationCapMark`, and `chart-units-produced` has none. `line-chart.tsx` takes `timeMark` per chart and `timeMarkDrawn` follows each chart's own zoom window. Line 144 passes `chart.timeMark?.(result)`.
- Docs the change makes untrue are all in Scope: `docs/aoe4-build-order-ui.md` lines 131, 139, 191, 197 (205 as a possible edit), `docs/aoe4-build-order-format.md` line 476, `page-help.tsx` line 105. `docs/aoe4-build-order.md` and `ARCHITECTURE.md` need no edit, and the ticket says to confirm.
- Tests tied to the change: only `acceptance/aoe4-population-cap-mark.spec.ts` assumes Population-only. The unit tests (`chart-markers.test.ts`, `line-chart.test.ts`, `result-series.test.ts`) cover pure functions and do not depend on it. `page-help.test.ts` has a Charts-section test (line 48) to extend.
- Risk `standard` fits a Chore that touches no critical path. Invariants A1 to A3 are named. No open questions, no dependencies, ~5 LOC, no exception clauses (item 17 n/a), no trust-boundary input, no external-service assumptions.

## Notes (non-blocking)
- Criterion 6 mixes a doc search with a `page-help.test.ts` test. The doc searches need no match count and none is pinned, so it is fine.
- Criteria 1 and 2 use the default 1200 s and 600 s runs, which match the existing spec's inputs.
