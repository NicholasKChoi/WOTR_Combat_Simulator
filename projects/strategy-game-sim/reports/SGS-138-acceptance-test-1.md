# SGS-138 acceptance-test report 1

Verdict: PASS. No tests written, no commit. The implementer's acceptance specs already cover the Playwright criteria. Tip checked: 7556a2c.

## Harness
`acceptanceSetup` ran (node_modules linked, Chromium installed). I ran `acceptance/aoe4-build-order-pin-compare.spec.ts` and `acceptance/aoe4-gather-rates-per-villager.spec.ts`: 43 passed, 0 failed (1.5 min), including the first gather-rates case, so tooltip time label and current-run values are unchanged.

## Coverage of the criteria (existing specs, all passing)
- One `chart-pinned-legend` per chart, exact text "dashed = pinned build", swatch computed `border-top-style: dashed`, `<p>` with tabIndex -1, placed after the series or marker legend; none after unpin; `chart-pinned-key` and `pinned-age-up` absent: pin-compare spec, "one dashed pinned legend entry".
- Hide every pinned line removes the entry, show one restores it, repeated, no pinned marker: "follows the series legend".
- Tooltip has no `(pinned)` names and includes `Food`, pinned paths still drawn and dashed, asserted first: "hovering a chart with a pinned run".
- Series only the pinned run has is listed once with a dashed swatch, and legend hide and restore of both lines: existing specs, pass.
- Gather-rates pinned case: counts of `path[data-series]` for the hidden series (0) and another series (1) before and after the toggle, no tooltip reads.
- Vitest-only criteria (`pinnedLegendShown` table, static markup, `result-series.test.ts`) are the implementer's and were not run by me.

## Mutation checks (each reverted with `git checkout -- components`; `git diff --exit-code` clean)
1. `line-chart.tsx:147`, deleted `tooltipType="none"`. "hovering a chart" failed on `expect(names.filter(n => n.endsWith('(pinned)'))).toEqual([])` (expected empty, received 5 extra entries).
2. `line-chart.tsx:235`, replaced the `pinnedLegendShown(...)` condition with `pinned &&`. "follows the series legend" failed at spec line 130, `toHaveCount(0)` received 1.
3. `chart-legend.tsx` (PinnedLegend swatch), dashed changed to solid. "one dashed pinned legend entry" failed at spec line 99, `toHaveCSS border-top-style` expected dashed, received solid.
4. `line-chart.tsx:154`, pinned `hide={false}`. Gather-rates "hidden legend entry" failed at spec line 129, `toHaveCount(0)` received 1.

## Failures
None.

## Not expressible
Nothing. The pinned age-up marker with no pinned series is covered in Vitest static markup, not Playwright (the criteria do not require it there).

Working tree clean, no processes left running.
