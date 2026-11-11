# SGS-114 spec gate 1

Verdict: NEEDS_SPEC

Read at origin/main. Spot-checked: results.tsx, line-chart.tsx, pages/apps/aoe4-build-order.tsx (browserStorage at line 71, three call sites), pin-storage.ts, acceptance/helpers.ts, the docs anchor paragraph ("A 200 draws four line charts", line 927), and design/M8.md C9 and Charts (M8.2). Scope is grounded, criteria are mostly testable, there are no open questions, and risk, invariants, diagrams, on-merge and zod use are fine.

## Gaps

1. Scope `acceptance/helpers.ts` vs design C9 vs the criterion on existing specs - the ticket contradicts itself and the design on what happens to `CHART_IDS`.
   - Scope says "`CHART_IDS` becomes `RESULT_CHART_IDS` (imported from `chart-layout.ts`)", which reads as a rename.
   - Design C9 says helpers "re-exports `CHART_IDS = RESULT_CHART_IDS`".
   - The new spec's Scope line still locates charts "from `CHART_IDS`".
   - The existing-specs criterion allows "edits other than `CHART_IDS` imports", which implies a rename that touches about six spec files. Those are pin-compare, chart-readability, per-villager, gathered-resources and split-layout.
   - SGS-115 edits split-layout and helpers, so a rename also causes merge conflicts.
   - The implementer has to guess between rename and re-export.
   - Fix: state `export const CHART_IDS = RESULT_CHART_IDS` in helpers.ts (the design's rule), and remove the "edits other than `CHART_IDS` imports" allowance so existing specs are untouched.
   - Also say whether `RESOURCE_CHARTS` stays a standalone literal or derives from `CHART_IDS` (`CHART_IDS.slice(1)`). Today `CHART_IDS` is built from it.
   - Also say what happens to `aoe4-results-split.spec.ts`, which has its own local `CHART_IDS` literal. The simplest rule is to leave it alone.

2. Scope `line-chart.tsx` - `aria-controls` points at the body id, but a collapsed chart "does not render" the plot and `chart-body` content. The ticket does not say whether the `chart-body` wrapper is unmounted or kept in the DOM and hidden.
   - The choice decides whether `aria-controls` references an existing element and what the SSR test sees. The test says "no `chart-body` content (series legend)", which fits either.
   - The choice also decides where the measuring `<svg><text ref={measureRef}/>` lives, because the label-width effect depends on that ref.
   - Fix: say "when collapsed the wrapper element stays, with an id and `hidden`, and its children are not rendered", or "the wrapper is not rendered and `aria-controls` is omitted". State where the measure svg goes (outside the body, so the effect keeps its ref).

3. Scope `line-chart.tsx` and `results.tsx` - the existing header markup (`d-flex flex-wrap ... column-gap-3` Bootstrap utilities around the `h3` and `headerControls`) is replaced. Scope says the new header row uses module CSS and `headerControls` moves into the body, but it never says the old utility-classed wrapper is removed.
   - Fix: add one clause saying the wrapper is replaced by a module-CSS header row, so no utility classes remain on that element (REPO.md review rule).

## Notes (non-blocking)

- The focus rule after a move needs an explicit focus restore, because keyed DOM moves can blur the focused node in Chromium. The spec criterion already catches this, so no change is needed. A one-line hint such as "restore focus in an effect after the order changes" would save a rework round.
- The criterion "all at a viewport where the charts show" should name `TABS_VIEWPORT` or `SPLIT_VIEWPORT` and the tab to show (`showTab`), as the other specs do.
- The ticket correctly says Per villager moves into the collapsible body. This is consistent with design M8.2.
