# SGS-052: Stop the chart Y-axis label overlapping 4-digit ticks

- **Type**: Bug
- **Component**: aoe4-build-order
- **Milestone / criteria**: M3 / M3.8 (Y-axis overlap)
- **Priority**: medium
- **Risk**: low
- **Invariants**: none (display only; A1 to A3 are not touched)
- **LOC estimate**: 10 (`line-chart.tsx` YAxis props or chart margin; business logic only, the Playwright test is excluded)
- **Depends on**: none
- **On merge**: none
- **Source**: design/M3.md Behavior rules row "chart | Y-axis label" and the Left to tickets item on how the fix is done; plan M3-20261101 outline R

## Context

`SeriesChart` draws the Y-axis label with `position: 'insideLeft'` (`components/apps/aoe4-build-order/line-chart.tsx:23`). The label sits inside the plot area's left edge, so with 4-digit tick labels (for example `floating` at a 3600 s run, which is the `durationSeconds` maximum in `validate.ts:20`) the rotated label overlaps the ticks. This ticket is a root so that the pin/compare ticket (SGS-048) and the chart-markers ticket (SGS-049) both start from the fixed file.

## Scope

- `components/apps/aoe4-build-order/line-chart.tsx`: change the `<YAxis>` label placement (a reserved axis `width`, a left chart margin, or label `position`/`offset`) so no Y-axis label overlaps a tick label at a 1280 px wide viewport with 4-digit ticks. The method is the implementer's choice (design: "Left to tickets"), provided the rule holds for all three charts (`yLabel` values "Units", "Per minute", "Resources" in `results.tsx`).
- Keep the change to the `YAxis` element and the `LineChart` margin. Do not touch `Legend`, `Line`, series props or the `SeriesChartProps` interface: SGS-048 and SGS-049 add `pinned` and `markers` to the same file and must not need to rewrite this ticket's lines.
- `acceptance/aoe4-build-order.spec.ts`: add a Playwright test at a 1280 px wide viewport. It pastes a build whose floating resources reach 4 digits by 3600 s (for example `start -> sheep` with no steps), sets `duration-seconds` to 3600, runs, then for `chart-floating-resources` compares bounding boxes of the Y-axis label (`.recharts-yAxis .recharts-label`) and each Y tick label (`.recharts-yAxis .recharts-cartesian-axis-tick-value`) and asserts none intersect. Confirm in the implementation that the chosen paste really produces a tick of 1000 or more; otherwise pick a paste that does.
- Docs: grep for `insideLeft` and "Y-axis" in `README`, `docs/aoe4-build-order.md` and `design/M2.md` found nothing outside design/M3.md on current main, so no doc changes are needed. Re-grep before finishing.

**Out of scope:** pinned series, markers, legends, chart colors, tick formatting or number abbreviation, X-axis changes, other viewports.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] At a 1280 px wide viewport, on a 3600 s run with 4-digit Y ticks, the Playwright test finds no Y-axis label bounding box that intersects any Y tick label bounding box, for `chart-floating-resources`. The same check also passes for `chart-gather-rates` and `chart-units-produced` on that run.
- [ ] The new Playwright test fails against `main`'s `line-chart.tsx` (revert the fix in a throwaway worktree and run it) and passes with the fix.
- [ ] The Y-axis label is still present and shows each chart's `yLabel` text.
- [ ] The existing `line-chart.test.ts` server-render tests and the existing chart acceptance tests (`expectChartsDrawn`) still pass.
- [ ] `git diff main -- components/apps/aoe4-build-order/line-chart.tsx` touches only the `YAxis` element and `LineChart` props, so SGS-048 and SGS-049 rebase without conflicts.
- [ ] No INVARIANTS.md regressions

## Open questions

None.
