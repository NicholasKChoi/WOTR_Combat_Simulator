# SGS-015 implementer report

Branch sgs-015-aoe4-series-chart, tip 7f57bdc (see rev-parse in summary), base main 43a0331.
Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-015-aoe4-series-chart

## Files
- package.json, package-lock.json: recharts 3.10.1 exact in dependencies; no existing version changed.
- vitest.config.mts: include gains components/**/*.test.ts.
- components/apps/aoe4-build-order/chart-rows.ts (36 lines): ChartSeries, toChartRows, formatMinSec, PALETTE (17 colors), seriesColor, toggleHidden.
- components/apps/aoe4-build-order/line-chart.tsx (45 lines): SeriesChart; re-exports ChartSeries, toChartRows.
- chart-rows.test.ts, line-chart.test.ts: unit and SSR smoke tests.

Business logic: 81 lines total (under 150; stays standard).

## Results
- npm test: 6 files, 71 tests pass (new: rows/no series/empty times, formatMinSec cases, palette distinctness and wrap, toggleHidden no-mutation, SSR wrapper+title with and without series).
- npx tsc --noEmit: 0 errors. npm ci + npx next build: succeeded (local Node 22, EBADENGINE only). Codegen: none.
- Manual selector check (npm run dev, throwaway page, Playwright Chromium, 3 series, page not committed): 
  before click: 3 `path.recharts-line-curve[data-series]` (a:#1f77b4, b:#ff7f0e, c:#2ca02c), 0 `.recharts-line-dot`, 0 `li.recharts-legend-item.inactive`, `.recharts-legend-item-text` = Alpha, Beta, Gamma.
  after clicking Beta legend item: paths a and c remain, b gone; 1 `li.recharts-legend-item.inactive`; legend still lists all 3. No console errors or warnings. Selectors match design/M2.md.
  Not observed: m:ss tick text (my probe selector returned no ticks; formatMinSec is unit-tested and wired via tickFormatter).
- Diff touches nothing under lib/aoe4-build-order, pages, acceptance or design docs. Lock diff is additive (recharts and transitive deps).

## Invariants
S1 upheld: component imports only react and recharts.

## Out-of-scope findings
None. Status: needs_review
