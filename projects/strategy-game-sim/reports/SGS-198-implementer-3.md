# SGS-198 implementer report 3

Status: needs_review
Branch: sgs-198-units-chart-unit-lines, tip 55c83d7a28a9d81e2f7f1c62db3a75da91f76db3 (base origin/main 683991c)
Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-198-units-chart-unit-lines

## Files touched
- components/apps/aoe4-build-order/result-series.ts: `unitLineSeries`, `UpgradeDot`, `unitUpgradeDots`, `PlacedUpgradeDot`, `visibleUpgradeDots`; `unitSeries` deleted; `unitsProducedSeries('units')` returns `unitLineSeries`.
- components/apps/aoe4-build-order/chart-rows.ts: `valueAt`.
- components/apps/aoe4-build-order/line-chart.tsx: `upgradeDots`/`pinnedUpgradeDots` props; pinned then current `ReferenceDot`s from `visibleUpgradeDots`.
- components/apps/aoe4-build-order/results.tsx: dots computed once per run (useMemo), passed only to the Units view of the Units chart (not Buildings, no other chart); `unitSeries` type use replaced by `ChartSeries[]`.
- components/apps/aoe4-build-order/result-series.test.ts, chart-rows.test.ts: tests.
- acceptance/aoe4-build-order-pin-compare.spec.ts: Units loop keys by `baseId` (only change).
- docs/aoe4-build-order-ui.md: "Units produced (Units view)" row.

## Tests
- `npm test`: 90 files passed, 2844 tests passed, 15 skipped (pre-existing skips). New/rewritten: `unitLineSeries` (sum, order, key, lineName, empty, no mutation), `unitUpgradeDots` (two upgrades of one line, no-line/no-unit/age-up dropped, second run's own line kept), `visibleUpgradeDots` (order, same-instant, stale key, pinned-only line, hidden, window edges, interpolated value), `valueAt` table (on sample, between with non-integer 5.75, past end).
- Acceptance run (existing specs only): pin-compare "dashed", "each chart lists a series once", "series only the pinned run has", chart-views "Units produced starts as Units" and "with a pin, Buildings..." : 5 passed.
- I authored no new acceptance specs for B-U1..B-U9 (the separate acceptance gate owns them). Scratch browser probe (deleted, not committed) on the Knight/Longbow template with a pin: one `chart-upgrade-dot` (circle, `data-series=longbowman`, r 4, fill #ff7f0e, stroke #fff, title `veteran-longbowmen 13:58` in the dot's `<g>`) and one `chart-pinned-upgrade-dot` (r 5, fill #fff, stroke #ff7f0e, dasharray `3 2`, `data-series=pinned:longbowman`, title `... (pinned) 13:58`), one `path[data-series=longbowman]`.

## Pre-existing tests edited
- `result-series.test.ts` `unitSeries` describe rewritten for `unitLineSeries`, and `unitsProducedSeries` case now compares to `unitLineSeries` (ticket rule: rewritten for `unitLineSeries`).
- `aoe4-build-order-pin-compare.spec.ts` "pinned lines are dashed...": loop over `unitId` became loop over de-duplicated `baseId` (ticket rule: key by `baseId`); assertions unchanged.

## Doc claims
- docs/aoe4-build-order-ui.md row: "each `unitsProduced` `baseId`, in order of first appearance (one line per unit line, every tier summed)" / "the entry's `lineName`" - true per `unitLineSeries`.
- line-chart.tsx comment: "Recharts orders same-layer reference dots by registration, which put the current dots first in the DOM; explicit layers keep the filled dot above the pinned ring." - observed in browser (without zIndex, current preceded pinned in the DOM despite pinned being rendered first); with zIndex 600/601 pinned precedes current.

## Mutation checks (result-series.ts / chart-rows.ts, each undone by restoring the file copy)
- sum `v + u.counts[i]` -> `v`: failed "draws one series per baseId... tiers summed" and "aligns the summed values".
- `key: u.baseId` -> `u.unitId`: failed the same two plus a unitUpgradeDots case.
- hidden check removed: failed "drops a dot of a hidden key".
- `dot.at < shown.from` check removed: failed window-edges test (`before` kept).
- `dot.at > shown.to` -> `>=`: failed window-edges test (`to` dropped).
- `!line` check removed: failed "drops a dot whose key the run has no series for".
- `lines.has(m.unit)` -> `true`: failed "drops a marker whose line the run never produced" and "judges each run by its own lines".
- interpolation -> previous sample: failed `valueAt` rows at 4 and 12.5 and the visibleUpgradeDots value test.
- past-end return -> 0: failed `valueAt` at 25.
- Not mutated: same-instant duplicate test (no dedupe code exists to break), pinned-only-line keep (covered by the `!line` mutation's second assertion).

## Results
- codegen: none set. `npx next build`: pass. lint (`tsc --noEmit` + `lint:dup`): pass, 0 clones.
- Final diff reviewed: only the 8 listed files; no tool-made changes.

## Deviations and notes
- Explicit `zIndex` (600 pinned, 601 current) on the `ReferenceDot`s: needed because the default z-layer put current dots before pinned in the DOM, contradicting B-U9. This contradicts the ticket's Unverified assumption that same-layer dots follow render order; update that assumption. `ifOverflow` left at the recharts default.
- Title strings use `${label} ${formatMinSec(at)}` directly (`markerLabel` needs a `ChartMarker` with `kind`).
- Pinned dot colour: `pinnedColor(series, key, index in pinned.series)`.

## Invariant check
No adjacent invariants (A1..A3 untouched; no engine, data or schema change).

## Unverified assumptions added
None beyond the ticket's list; the one that was wrong (z-layer order) is corrected above and exercised in a real browser.

## Out-of-scope findings
None.

## Required for merge
CONTEXT.md Key surfaces entry for `visibleUpgradeDots` is the manager's On-merge action.
