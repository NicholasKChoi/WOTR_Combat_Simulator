# SGS-138 implementer report 1

Status: needs_review
Branch: sgs-138-pinned-runs-no-tooltip-one-legend-entry, tip 7556a2c82ca14c2e0b5995363da2d5ed694760da (base origin/main 94a439d)
Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-138-pinned-runs-no-tooltip-one-legend-entry

## Files touched
- components/apps/aoe4-build-order/chart-legend.tsx: added `pinnedLegendShown` and `PinnedLegend`; removed `PinnedLineKey` and its use, the `MarkerLegend` `pinnedAgeUps` prop and its item.
- components/apps/aoe4-build-order/line-chart.tsx: `tooltipType="none"` on each pinned `Line`; renders `PinnedLegend` after `MarkerLegend` when `pinnedLegendShown(pinned, hidden, pinnedAgeUps.length)`; stops passing `pinnedAgeUps` to `MarkerLegend`.
- components/apps/aoe4-build-order/chart-legend.test.ts (new): `pinnedLegendShown` table (7 rows).
- components/apps/aoe4-build-order/line-chart.test.ts: rewrote marker-legend and pinned-key cases (listed below).
- components/apps/aoe4-build-order/result-series.test.ts: new per-villager pinned rows case.
- acceptance/aoe4-build-order-pin-compare.spec.ts: rewrote the pinned-key case; added hide/show case and tooltip hover case; imported `plotPoint`.
- acceptance/aoe4-gather-rates-per-villager.spec.ts: pinned case rewritten to path-count checks only.
- docs/aoe4-build-order.md: series-legend / marker-legend paragraph.
- chart-rows.ts: not touched; its comments do not mention the pinned key or legend item.

## Pre-existing tests edited
- line-chart.test.ts `age-up markers > puts the pinned age-up legend item last...` -> replaced by `lists only the current run's marker kinds, and nothing when it has none...` (ticket Scope Tests).
- line-chart.test.ts `age-up markers > has no pinned legend item without pinned age-up markers` -> deleted, folded into the replacement (asserts `pinned-age-up` absent).
- line-chart.test.ts `pinned line key > renders one key labelled...` -> replaced by `pinned legend` describe (5 cases). `lists a shared series once` kept, call adapted to `renderPinned({ pinned })`.
- aoe4-build-order-pin-compare.spec.ts: `each chart lists a series once and explains the line styles in one pinned key...` rewritten for `chart-pinned-legend`.
- aoe4-gather-rates-per-villager.spec.ts: `with a pin, the pinned tooltip value is also per villager...` rewritten (title no longer claims tooltip values). First case untouched; `rawFood`/`perVillagerFood`/`samplesAt` still used by it.

## Tests run
- Targeted Vitest: chart-legend, line-chart, result-series: 42 passed.
- `npm test`: 80 files passed, 1 skipped; 2484 passed, 15 skipped.
- Playwright (I ran the two specs I edited, since the harness files are in the task): 43 passed in pin-compare, plus the gather-rates spec in the same run, all green. Hover case verified to fail without `tooltipType` (see mutations).
- Invariants encoded: pinned legend appears iff a pinned line is visible or a pinned age-up is drawn; follows `hidden` on repeated hide/show; collapsed chart has none; marker legend lists only current kinds; per-villager pinned rows use the pinned run's own rates and gatherers (0 on zero gatherers); tooltip has no `(pinned)` names.

## Doc claims
- docs/aoe4-build-order.md: "The tooltip lists only the current run's series; pinned lines and markers are not in it." True via `tooltipType="none"` on pinned `Line`s (line-chart.tsx); pinned markers are `ReferenceLine`s, which are not tooltip entries (the hover spec checks names only for lines).
- "The marker legend lists only the current run's kinds." `MarkerLegend` in chart-legend.tsx.
- "A chart that draws at least one pinned line or pinned marker has one entry `dashed = pinned build` (`chart-pinned-legend`) after the marker legend; hiding every pinned line through the series legend removes it unless a pinned age-up marker is drawn, and showing a series restores it." `pinnedLegendShown` plus `SeriesChart`; Playwright hide/show case.
- Search criterion `git grep ... ':!*.test.ts' ':!acceptance/' ':!.claude/'` returns nothing; no `pinnedAgeUps` in chart-legend.tsx.
- Remaining test/spec matches of `chart-pinned-key` and `pinned-age-up` are all inside `not.toContain` / `toHaveCount(0)` / `not.toMatch`.

## Mutation checks (all undone; tree verified clean before commit)
- chart-legend.tsx `pinnedLegendShown`: dropped `pinnedAgeUpCount > 0 ||` -> failed `pinnedLegendShown > the only pinned series hidden with a pinned age-up`, `a pinned age-up and no pinned run`, `renders when only a pinned age-up marker is drawn`.
- Replaced `!isLineHidden(...)` with `true` -> failed `the only pinned series hidden and no age-ups`.
- line-chart.tsx condition replaced by `pinned !== undefined` -> failed `renders when only a pinned age-up marker is drawn` and `renders when only a pinned series is given, not when the pinned run has no series...`.
- Rendered `PinnedLegend` additionally whenever not collapsed -> failed 4 `pinned legend` cases (none-without-pinned among them).
- `MarkerLegend` guard `if (false)` -> failed `has no marker legend when markers are empty` and the replacement marker case.
- result-series.ts `perVillagerSeries` returns raw rate -> failed the new pinned-rows case and the existing division cases.
- Removed `tooltipType="none"` -> Playwright hover case failed at `expect(names.filter(n => n.endsWith('(pinned)'))).toEqual([])`.

## Build / lint
- `npx tsc --noEmit && npm run lint:dup`: clean (0 clones). `next build`: succeeded. Codegen: not set.

## Invariant check
No INVARIANTS.md path touched beyond UI components (A1-A3 untouched; no engine or data change).

## Unverified assumptions
None added. The ticket's existing one (recharts `tooltipType="none"` drops the line from the tooltip) held at recharts 3.10.1 in the Playwright hover case.

## Notes
- Static markup cannot set `hidden`, so the hidden-series SeriesChart cases in the criteria are covered by the `pinnedLegendShown` table and the Playwright hide/show case, not by `renderToString`.
- Playwright hide/show uses a pinned `start -> sheep` run (no age-up) against the default paste, hiding all series in the gather-rates chart.

## Out-of-scope findings
- The main checkout (`/home/choin/git/WOTR_Combat_Simulator`) is on branch `debug/named-build-412-diagnostics` whose tip is a "DEBUG ... (do not merge)" commit; not touched.
- `git worktree add -b` created the branch but failed to create the worktree in the sandbox (read-only .git/worktrees); a second `git worktree add` on the existing branch worked.
