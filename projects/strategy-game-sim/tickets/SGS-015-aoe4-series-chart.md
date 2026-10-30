# SGS-015: Add the Recharts series chart component

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M2 / M2.6 (chart half; the page, result mapping and landing link are a later ticket)
- **Priority**: medium
- **Risk**: standard (respec 1)
  <!-- One component, adds a runtime dependency and a new vitest include glob in vitest.config.mts, no public API, no
       adjacent invariant beyond S1. Kept standard only under the acceptance criterion that non-test business logic stays
       under 150 lines (the strongModelTrigger threshold); if the implementation needs more, the ticket is high. -->
- **LOC estimate**: ~120-145 business logic (`line-chart.tsx` ~90-110: `SeriesChart`, legend wiring, tick/tooltip
  formatting; `chart-rows.ts` ~30-35: `toChartRows`, `formatMinSec`, `seriesColor`/`PALETTE`, `toggleHidden`); tests on top
- **Depends on**: SGS-012. (respec 1) The manager applies SGS-012's On merge item (the designer switches design/M2.md
  "Charts" from Recharts 2.15.4 to 3.10.1 and re-verifies its test selectors on 3.x) before marking SGS-012 integrated,
  so this dependency also holds the ticket until that design update lands. When this ticket starts, design/M2.md's 3.x
  "Charts" section is authoritative: if it changes a selector or the SSR note relative to the strings below, follow
  design/M2.md.
- **On merge**: none (respec 1)
- **Source**: M2.6; design/M2.md "Charts"; reports/M2-plan.md outline C; reports/SGS-015-spec-gate.md

## Context

M2's whole output is three line charts over time (units produced, gather rates, floating resources), each with m:ss
axes, a toggleable legend, a tooltip and 8-15 series. This ticket adds the one reusable chart component and its pure
helpers, on Recharts 3.10.1 and the stack SGS-012 leaves behind (Next 16, React 19, TypeScript 7, Vitest 5, Vitest
config at `vitest.config.mts`). No page uses it yet; the page ticket wires it, and SGS-022's Playwright specs assert
series presence and toggling in a real layout.

## Scope

All new files; nothing existing is edited except `package.json`, `package-lock.json` and `vitest.config.mts` (respec 1).

1. **Dependency.** `npm install --save-exact recharts@3.10.1` (exact, no caret) into `dependencies`; update
   `package-lock.json`. Do not change the version of any existing dependency. New lock entries that recharts pulls in
   (its `react-is` peer, transitive deps such as `@reduxjs/toolkit`) are expected (respec 1). The design doc's old
   reason for avoiding 3.x (TS 4.7 and `@types/react` 18.0.14) no longer applies after SGS-012.
2. **`components/apps/aoe4-build-order/chart-rows.ts`** (pure, no React, no Recharts import):
   - `ChartSeries { key: string; name: string; values: number[] }` (values aligned with `times`), exported from here.
   - `toChartRows(times: number[], series: ChartSeries[]): Array<{ t: number } & Record<string, number>>`: one row per
     index of `times`, `t = times[i]`, and `row[series.key] = series.values[i]`.
   - `formatMinSec(seconds: number): string` for axis ticks and the tooltip label (`0` -> `0:00`, `65` -> `1:05`,
     `3600` -> `60:00`).
   - (respec 1) `PALETTE: readonly string[]` of at least 15 distinct colors (the ticket picks them) and
     `seriesColor(index: number): string` returning `PALETTE[index % PALETTE.length]`.
   - (respec 1) `toggleHidden(hidden: ReadonlySet<string>, key: string): Set<string>`: returns a new set with `key`
     removed if present, added if absent; never mutates `hidden`.
3. **`components/apps/aoe4-build-order/line-chart.tsx`**: exports `SeriesChart` and re-exports `ChartSeries` and
   `toChartRows` so the names match design/M2.md. Props: `{ testId: string; title: string; yLabel: string; times: number[]; series: ChartSeries[] }`.
   - Markup per design/M2.md "Charts": `<div data-testid={testId}>` wrapping `ResponsiveContainer` (width 100%, fixed
     height) > `LineChart` (`data = toChartRows(times, series)`) with `XAxis dataKey="t" type="number"` and m:ss ticks,
     `YAxis` (label `yLabel`), `Tooltip` with m:ss label, `Legend`, and one `<Line dataKey={key} name={name}
     data-series={key} stroke={seriesColor(i)} dot={false} isAnimationActive={false} hide={hidden.has(key)} />` per
     series. `title` is rendered as a heading above the chart. Chart height and tick spacing are styling left to this ticket.
   - Legend `onClick` calls `setHidden(h => toggleHidden(h, clickedKey))`; `hidden` is local `useState` (respec 1).
   - No `'use client'` directive (pages router).
4. **Vitest include.** Add `'components/**/*.test.ts'` to `include` in `vitest.config.mts` (respec 1; today
   `['utils/**/*.test.ts', 'lib/**/*.test.ts']` at SGS-012 tip 623a5ff). Do not create a `vitest.config.ts`. Chosen
   over relocating the helpers under `lib/`, because `lib/<app>/` is for logic and these helpers exist only for the
   chart. Tests: `components/apps/aoe4-build-order/chart-rows.test.ts` (unit) and
   `components/apps/aoe4-build-order/line-chart.test.ts` (SSR smoke via `renderToString(createElement(SeriesChart, ...))`
   from `react-dom/server`, since Vitest runs `*.test.ts` in node and cannot use JSX).
5. (respec 1) What unit tests do not cover: SSR of `ResponsiveContainer` renders an empty div, so no `Line` reaches
   `renderToString` output, and in jsdom it measures 0x0, so no jsdom test is added. `dot={false}`,
   `isAnimationActive={false}`, `stroke={seriesColor(i)}`, `data-series` on each `Line` and the legend click wiring are
   verified by the manual selector check recorded in the PR description (criterion below), and later by SGS-022's
   Playwright specs, not by unit tests.

**Out of scope:** the page, `results.tsx`, `build-input.tsx`, the `SimulationResult` -> `ChartSeries[]` mapping, any
`lib/aoe4-build-order/` code, `next/dynamic`, a jsdom or ResizeObserver stub, editing design/M2.md, Playwright specs, the
landing link, and any change to existing dependency versions.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] (respec 1) `package.json` `dependencies` has `"recharts": "3.10.1"` (no `^` or `~`); `package-lock.json` resolves
      `recharts` to 3.10.1; `npm ci` succeeds. `git grep -n recharts -- package.json` prints the one dependency line
      (it prints nothing today). Every dependency and devDependency already in `package.json` keeps its version string;
      new lock entries pulled in by recharts (e.g. `react-is`) are allowed.
- [ ] `npx tsc --noEmit` exits 0 and `npx next build` succeeds on the SGS-012 stack.
- [ ] `toChartRows([0, 5, 10], [{ key: 'a', name: 'A', values: [1, 2, 3] }, { key: 'b', name: 'B', values: [4, 5, 6] }])`
      returns `[{ t: 0, a: 1, b: 4 }, { t: 5, a: 2, b: 5 }, { t: 10, a: 3, b: 6 }]`; with no series it returns rows with only
      `t`; with empty `times` it returns `[]`.
- [ ] `formatMinSec` returns `0:00` for 0, `0:05` for 5, `1:05` for 65 and `60:00` for 3600.
- [ ] (respec 1) Palette, unit-tested in `chart-rows.test.ts`: `PALETTE.length >= 15`; `new Set(PALETTE).size === PALETTE.length`;
      `seriesColor(i)` for `i` in `0..PALETTE.length-1` returns `PALETTE.length` distinct values; `seriesColor(PALETTE.length) === seriesColor(0)`
      and `seriesColor(PALETTE.length + 1) === seriesColor(1)`.
- [ ] (respec 1) `toggleHidden`, unit-tested in `chart-rows.test.ts`: `toggleHidden(new Set(['a']), 'b')` equals `{a, b}`;
      `toggleHidden(new Set(['a', 'b']), 'a')` equals `{b}`; `toggleHidden(new Set(), 'a')` equals `{a}`; the input set is
      unchanged after each call.
- [ ] (respec 1) `npm test` runs the new `components/**` tests (the `include` change in `vitest.config.mts` is what makes
      them run), all existing tests still pass, and the repo has no `vitest.config.ts` (`git ls-files 'vitest.config.*'`
      prints only `vitest.config.mts`).
- [ ] Rendering `SeriesChart` to a string in node does not throw and the output contains `data-testid="<testId>"` and the
      title text, with and without series (SSR note in design/M2.md: `ResponsiveContainer` server-renders an empty div).
- [ ] (respec 1) Manual selector check, not unit-tested: on Recharts 3.10.1, render the component in a throwaway page under
      `npm run dev` with 3 series, hide one by clicking its legend entry, and record in the PR description the observed
      selectors (`path.recharts-line-curve[data-series]`, `li.recharts-legend-item.inactive`, `.recharts-legend-item-text`,
      or whatever design/M2.md's 3.x "Charts" section names), that the clicked series' curve disappears while the other two
      remain, that lines have no dots and distinct strokes. If the selectors differ from design/M2.md, stop and report back
      to the designer; do not change the selector in this ticket. The throwaway page is not committed.
- [ ] (respec 1) Non-test business logic (`chart-rows.ts` + `line-chart.tsx`, excluding blank lines and `*.test.ts`)
      stays under 150 lines; if it cannot, report back so the ticket is re-tiered `high` rather than merging at `standard`.
- [ ] The diff does not touch `lib/aoe4-build-order/`, `pages/`, `acceptance/` or design docs.
- [ ] No INVARIANTS.md regressions (S1: nothing imports another app's code; the component is under `components/apps/aoe4-build-order/` only).

## Open questions

None.

## Re-spec 2026-10-30

- Underspecified: the Vitest config name (SGS-012 renames it to `vitest.config.mts`), an untestable palette criterion
  (SSR emits no `Line`), legend toggling with no automated check, design/M2.md gating parked under `On merge`, and a
  dependency criterion that forbade recharts' own new lock entries.
- Changed: pure `PALETTE`/`seriesColor` and `toggleHidden` in `chart-rows.ts` with unit criteria; `Line` props and
  legend wiring explicitly left to the recorded manual check and SGS-022; gating moved to Depends on (On merge none);
  Risk kept `standard` under a <150-line business-logic criterion; lock criterion narrowed to existing versions + exact pin.
- No branch work exists.
