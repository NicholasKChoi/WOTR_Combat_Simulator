# SGS-198 ticket author, re-spec 1

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-198-units-chart-unit-lines-and-upgrade-dots.md
Verified at origin/main 87f0cd7. ticket-lint: clean (exit 0).

## Summary

"Draw the Units chart as one line per unit line, with upgrade dots for the current and the pinned run" (aoe4-build-order, M11.2 UI half, Risk standard, about 150 business-logic lines, depends on SGS-191 and SGS-197). It adds `unitLineSeries`, `UpgradeDot`, `unitUpgradeDots` (C16) and `valueAt` (C16a), and draws current and pinned upgrade dots in `SeriesChart` (C13). It covers B-U1 to B-U9 and B-Z7 for dots, plus the existing-test rule and one docs row.

## Gate findings folded in

1. Server render cannot see recharts SVG (gaps 1 and 2): there is a new pure `visibleUpgradeDots(dots, run, shown, hidden)` in `result-series.ts`. It is the only owner of the per-run stale-key rule (B-U3), the hidden-line rule (B-U4), the window rule (B-U8/B-Z7, inclusive edges), the value via `valueAt`, and keeping order and same-instant duplicates. `SeriesChart` draws exactly what it returns and does no filtering itself. A new criterion unit-tests it in `result-series.test.ts`. Every "or `SeriesChart` server-render test" clause is gone. B-U9 overlap (DOM order and radius) now lives only in the acceptance spec.
   - Placement: `result-series.ts`, not `chart-rows.ts`. `UpgradeDot` lives in `result-series.ts`, which already imports from `chart-rows.ts`. Putting it in `chart-rows.ts` would create an import cycle.
2. Docs (gap 3): this ticket now rewrites the `docs/aoe4-build-order-ui.md` "Units produced (Units view)" row, with a matching criterion. Out of scope narrowed to "docs beyond the one table row".
3. Notes:
   - Unverified assumptions rewritten: `data-*` lands on the circle and `<title>` is a sibling in the wrapping `<g>`; one z-layer keeps render order (B-U9); `ifOverflow` defaults to discard.
   - The Current and Pinned dot criteria now check the title text, read from the dot's group.
   - `ifOverflow` is left to the implementer.
   - The legend-name criterion now de-duplicates per `baseId`, in first-appearance order.
   - Scope records that the Buildings cases' `path[data-series]` counts are unaffected.

Changed criteria are tagged `(respec 1)`. A `## Re-spec 1 - 2026-11-16` section was added.

## On merge

`On merge` changed from `none` to: CONTEXT.md Key surfaces gets an entry for `visibleUpgradeDots`. The name is not in the design and only this ticket uses it, so it is not a designer question.

## Diagrams

None (single component, outside the core control loop).

## Open questions

none

## Overlap

SGS-200 Scope (its "Chart series table row 'Units produced (Units view)'" bullet) still plans to rewrite this same row. The manager should trim that bullet to the surrounding sentences and the dot description, so the two tickets do not both edit the row. SGS-200's stale-phrase search for `tier <tier>` stays valid either way.

## Checks run

- None of the criteria name a command, so no search or mutation check applied.
- Confirmed at base: the `unitSeries` definition and its import of `ChartSeries` from `chart-rows.ts`.
- Confirmed the `PinnedSeries { times, series }` shape.
- Confirmed the docs row text at line 114. It is the only per-tier claim in the docs.
- Confirmed the `isLineHidden` use in `line-chart.tsx`.
- Confirmed recharts 3.10.1 in `package.json`.
- Confirmed the pin-compare `unitId` loop.
- `TimeWindow` and `shown` come from the SGS-196/197 tickets and design C10/C11. Those tickets are not integrated, so they were not checked against code.
