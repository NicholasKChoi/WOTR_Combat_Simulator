# SGS-138 spec gate 2

Verdict: READY

Read at origin/main plus the SGS-135 end state as the ticket describes it. Nothing here touches the header code.

## Round 1 gaps

1. Search criterion vs absence tests: closed. The grep now excludes `*.test.ts`, `acceptance/` and `.claude/`. Tests and specs may name the removed ids only inside absence assertions, which matches the design M9.5 row. At the base the grep matches only `chart-legend.tsx` and `docs/aoe4-build-order.md` (lines 981 and 989), as the ticket says.
2. Gather-rates spec pinned values: closed. The per-villager division moves to Vitest in `result-series.test.ts`. `toChartRows(times, series, pinned?)` and `perVillagerSeries(rates, gatherers)` both exist at the base, and `results.tsx` line 31 applies the same `gatherRateSeries` function to both runs. The Playwright case keeps only `path[data-series]` count checks, asserted before and after the toggle.
3. Throwaway overlap with SGS-137: closed. Scope says to keep the rewrite minimal, and SGS-137 retargets the spec once.

## New checks

- Scope and C6 agree: `PinnedLegend` markup and ids, `pinnedLegendShown` signature, the removal of `PinnedLineKey` and the `MarkerLegend` `pinnedAgeUps` prop. These match design M9.md C6 and the M9.5 criteria row.
- Criteria are testable and can fail on the old code. The `pinnedLegendShown` table has no stale numbers. The respec-2 tooltip criterion requires a hover inside the plot and asserts the pinned lines first.
- Other specs and tests that mention the removed ids or `(pinned)` exist: `aoe4-split-layout.spec.ts`, `compare.test.ts` and `simulate-house-gate.test.ts`. The generic Scope sentence ("any other test or spec ... moves to the new behavior") covers them. A match that is only a name containing "(pinned)" is not affected.
- Unverified assumption (recharts `tooltipType="none"`) is listed, and round 1 confirmed it for recharts 3.10.1.
- Risk low, LOC about 60, Depends-on SGS-135, On merge `none`, Open questions `none` are consistent. SGS-139 and SGS-137 depend on this ticket, which TASK-GRAPH records.

## Notes (non-blocking)

- The criterion sentence "Today it matches in `chart-legend.tsx` and `docs/aoe4-build-order.md`" describes the current state and is not a requirement. It is fine as written.
- Whoever implements it should list the other specs and tests it edits (`aoe4-split-layout.spec.ts` and the others above), as Scope already asks.
