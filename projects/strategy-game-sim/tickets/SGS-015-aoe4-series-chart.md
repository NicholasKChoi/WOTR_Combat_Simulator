# SGS-015: Add the Recharts series chart component

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M2 / M2.6 (chart half; the page, result mapping and landing link are a later ticket)
- **Priority**: medium
- **Risk**: standard
  <!-- One component, adds a dependency and a new vitest include glob (config), no public API, no adjacent invariant
       (S1 only: the component is imported by the same app). Standard because it adds a runtime dependency. -->
- **LOC estimate**: ~120-180 (`line-chart.tsx` ~110-140: `SeriesChart`, palette, legend toggle, tick/tooltip formatting; `chart-rows.ts` ~20-30: `toChartRows`, m:ss formatter; tests on top)
- **Depends on**: SGS-012
- **On merge**: none. (Gating, not a merge update: this ticket is blocked until the designer has switched design/M2.md "Charts" from Recharts 2.15.4 to 3.10.1 and re-verified its test selectors on 3.x, which SGS-012's On merge assigns to the designer. If that re-verification changes a selector or the SSR note, this ticket follows the updated design/M2.md, not the selector strings below.)
- **Source**: M2.6; design/M2.md "Charts"; reports/M2-plan.md outline C

## Context

M2's whole output is three line charts over time (units produced, gather rates, floating resources), each with m:ss
axes, a toggleable legend, a tooltip and 8-15 series. This ticket adds the one reusable chart component and its pure
row-building helper, on Recharts 3.10.1 and the stack SGS-012 leaves behind (Next 16, React 19, TypeScript 7, Vitest 5).
No page uses it yet; the page ticket wires it and asserts series presence and toggling in Playwright.

## Scope

All new files; nothing existing is edited except `package.json`, `package-lock.json` and `vitest.config.ts`.

1. **Dependency.** `npm install --save-exact recharts@3.10.1` (exact, no caret) into `dependencies`; update
   `package-lock.json`. Do not touch any other dependency. The design doc's reason for avoiding 3.x (old TS 4.7 and
   `@types/react` 18.0.14) no longer applies after SGS-012 (`@types/react` ^19.3.0, TS ^7.0.2).
2. **`components/apps/aoe4-build-order/chart-rows.ts`** (pure, no React, no Recharts import):
   - `toChartRows(times: number[], series: ChartSeries[]): Array<{ t: number } & Record<string, number>>`: one row per
     index of `times`, `t = times[i]`, and `row[series.key] = series.values[i]`.
   - `formatMinSec(seconds: number): string` for axis ticks and the tooltip label (`0` -> `0:00`, `65` -> `1:05`,
     `3600` -> `60:00`).
   - `ChartSeries { key: string; name: string; values: number[] }` (values aligned with `times`), exported from here.
3. **`components/apps/aoe4-build-order/line-chart.tsx`**: exports `SeriesChart` and re-exports `ChartSeries` and `toChartRows`
   so the names match design/M2.md. Props: `{ testId: string; title: string; yLabel: string; times: number[]; series: ChartSeries[] }`.
   - Markup per design/M2.md "Charts": `<div data-testid={testId}>` wrapping `ResponsiveContainer` (width 100%, fixed
     height) > `LineChart` (`data = toChartRows(times, series)`) with `XAxis dataKey="t" type="number"` and m:ss ticks,
     `YAxis` (label `yLabel`), `Tooltip` with m:ss label, `Legend`, and one `<Line dataKey={key} name={name}
     data-series={key} dot={false} isAnimationActive={false} hide={hidden.has(key)} />` per series. `title` is rendered
     as a heading above the chart.
   - Stroke color is `PALETTE[index % PALETTE.length]` with a palette of at least 15 distinct colors (the ticket
     picks them; chart height and tick spacing are likewise styling left to this ticket).
   - Clicking a legend entry toggles that series' membership in a local `hidden` set (`useState`); state is local to the chart.
   - No `'use client'` directive (pages router).
4. **Vitest include.** Add `'components/**/*.test.ts'` to `include` in `vitest.config.ts` (chosen over relocating the
   helpers under `lib/`, because `lib/<app>/` is for logic and these helpers exist only for the chart). Tests:
   `components/apps/aoe4-build-order/chart-rows.test.ts` (unit) and `components/apps/aoe4-build-order/line-chart.test.ts`
   (SSR smoke via `renderToString(createElement(SeriesChart, ...))` from `react-dom/server`, since Vitest runs `*.test.ts`
   in node and cannot use JSX).
5. Follow the design for what is not asserted here: series presence and toggling in real layout are asserted by the page
   ticket's Playwright specs. In jsdom `ResponsiveContainer` measures 0x0, so no jsdom test is added.

**Out of scope:** the page, `results.tsx`, `build-input.tsx`, the `SimulationResult` -> `ChartSeries[]` mapping, any
`lib/aoe4-build-order/` code, `next/dynamic`, a jsdom or ResizeObserver stub, editing design/M2.md, Playwright specs, the
landing link, and any other dependency change.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `package.json` `dependencies` has `"recharts": "3.10.1"` (no `^` or `~`); `package-lock.json` resolves `recharts` to
      3.10.1; `npm ci` succeeds. `git grep -n recharts -- package.json` prints the one dependency line (it prints nothing today).
- [ ] `npx tsc --noEmit` exits 0 and `npx next build` succeeds on the SGS-012 stack.
- [ ] `toChartRows([0, 5, 10], [{ key: 'a', name: 'A', values: [1, 2, 3] }, { key: 'b', name: 'B', values: [4, 5, 6] }])`
      returns `[{ t: 0, a: 1, b: 4 }, { t: 5, a: 2, b: 5 }, { t: 10, a: 3, b: 6 }]`; with no series it returns rows with only
      `t`; with empty `times` it returns `[]`.
- [ ] `formatMinSec` returns `0:00` for 0, `0:05` for 5, `1:05` for 65 and `60:00` for 3600.
- [ ] `npm test` runs the new `components/**` tests (the vitest `include` change is what makes them run) and all existing
      tests still pass.
- [ ] Rendering `SeriesChart` to a string in node does not throw and the output contains `data-testid="<testId>"` and the
      title text, with and without series (SSR note in design/M2.md: `ResponsiveContainer` server-renders an empty div).
- [ ] The palette has at least 15 distinct colors, and a chart with 16 series gets a defined stroke for every series (index wraps).
- [ ] Each `Line` gets `dot={false}`, `isAnimationActive={false}` and `data-series={key}`; the legend click handler toggles
      `hide` for exactly the clicked series and leaves others unchanged. These hold in the component source; the rendered
      selector contract (`path.recharts-line-curve[data-series]`, `li.recharts-legend-item.inactive`,
      `.recharts-legend-item-text`) is verified on Recharts 3.10.1 by manually rendering the component in a throwaway page under
      `npm run dev` with 3 series, hiding one by clicking its legend entry, and recording the observed selectors and result in
      the PR description (if they differ from design/M2.md, stop and report back to the designer; do not change the selector in this ticket). The throwaway page is not committed.
- [ ] No other dependency version in `package.json` changes, and the diff does not touch `lib/aoe4-build-order/`,
      `pages/`, `acceptance/` or design docs.
- [ ] No INVARIANTS.md regressions (S1: nothing imports another app's code; the component is under `components/apps/aoe4-build-order/` only).

## Open questions

None.
