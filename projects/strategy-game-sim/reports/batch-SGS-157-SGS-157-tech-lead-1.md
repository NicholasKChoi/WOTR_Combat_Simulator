# Tech-lead: batch SGS-157-SGS-157

## Decision

NEEDS HUMAN REVIEW - no PRs opened

Nothing pushed. No PR created or edited.

## Blockers

- `components/apps/aoe4-build-order/chart-rows.ts:63-68` (with `:76` and `line-chart.tsx:102-103,163`) - correctness bug with production impact - In the Buildings view with a pinned run, `toOffsetChartRows` adds the offset to every key in the row. `toChartRows` leaves a current-series key `undefined` in rows at times only the pinned run has, so `value + offset` makes it `NaN`. Recharts' Tooltip `filterNull` drops only `== null` entries (`recharts/lib/component/Tooltip.js:155-156`), so `NaN` entries stay in the tooltip. `trueCountFormatter` then returns `Math.round(NaN)`, and the tooltip shows "<building>: NaN" for every current building. Before this change those entries were `undefined`, so they were filtered out and the tooltip showed nothing for them. Trigger: pin a run, rerun with a different duration (a supported pin-compare flow: `compare-panel.tsx:61` shows the pinned duration), switch Units produced to Buildings, and hover past the shorter run's end. A pinned run that is longer by even a few seconds adds a final pinned-only sample. I confirmed this in the scratch with a throwaway vitest probe. With current times [0,5], pinned times [0,5,10] and key `b` only in the current run, `toChartRows(...)[2].b` is `undefined`, but `toOffsetChartRows(...)[2].b` is `NaN`. The probe was deleted afterwards. Lines render the same as before (`Curve.js:48` treats NaN as a gap, like null). wholeNumberAxis filters with `Number.isFinite`, so the axis is also unaffected. Only the tooltip regresses. - why a human must decide: every earlier gate passed this code and auto-merge is enabled, so the call is whether a user-visible "NaN" in a niche pin-compare scenario blocks the merge or becomes a follow-up. The fix is small, and I recommend rework before merge. - direction: in `lift`, copy a non-number value through unchanged (for example `lifted[key] = offset === undefined || row[key] === undefined ? value : value + offset`, or skip the key). Add a `chart-rows.test.ts` row: pinned times longer than current times; assert the current key in the pinned-only row is `undefined` (fails today with `NaN`), and that `trueCount` is not called on or returns no number for it.

## Untested hotspots

None beyond the blocker. Every other entry I would put in Review focus has a pinning test:
- `wholeNumberAxis` top and ticks (`chart-rows.ts:84-95`): `chart-rows.test.ts` `wholeNumberAxis` table, including the 1.225 -> [0,2] case and the hidden-key case, plus the acceptance assertion that the largest BARRACKS_PASTE tick is 2.
- `lineOffsets` and slot order, hidden, and pinned-pair rules (`chart-rows.ts:49-60`): the `lineOffsets` and `toOffsetChartRows` unit tests, plus the acceptance tests for legend-hide widening and pinned-line same height.
- `trueCount` (`chart-rows.ts:76`): the `trueCount` unit test, plus the acceptance check that tooltip values are whole numbers.

## Other checks (no flag)

- Invariants A1-A3: display-only. No change under `lib/`, `data/` or `pages/api/`. MAX_LINE_OFFSET is a presentation constant, not a game number. Nothing touches simulation determinism or resource spending.
- Irreversibility: none. A revert fully undoes it. No schema, API, config or persisted-state change.
- Security, concurrency: none.
- Contract: `SeriesChart` gains an optional `offsetLines` prop that defaults to false. With it off, `YAxis` gets `domain`/`ticks` undefined, and recharts resolves those to its defaults, as review-2 confirmed. The Tooltip formatter is unchanged. Other charts and the Units view keep their behavior.
- criticalPaths: none touched.
- Open questions: PROJECT.md and the ticket have none, so none were answered unilaterally.
- Docs: the new `docs/aoe4-build-order.md:991` sentence matches the code (the first slot has offset 0, offsets stay below 0.5, the pinned pair shares an offset, and hidden keys take no slot).

## What I reviewed

- Range: `e50e074..57d342a` on `sgs-157-buildings-chart-overlap` (4 commits: c8cb3b3, 5d97056, a38608c, 57d342a). origin/main is now c5bd608. The two new base commits touch only `acceptance/aoe4-results-split.spec.ts` and `lib/combat-simulator`, so they do not overlap this diff.
- Files: `components/apps/aoe4-build-order/chart-rows.ts` (+55/-1), `line-chart.tsx` (+19/-3), `results.tsx` (+1), `docs/aoe4-build-order.md` (+1), `chart-rows.test.ts` (+92/-2), `acceptance/aoe4-chart-views.spec.ts` (+93/-4). Totals: 251 added, 10 removed. Hand-written production logic: about 75 added lines.
- Recharts 3.10.1 source was read for Tooltip null filtering and Curve gap handling.

## Non-blocking notes

- `trueCount` relies on offsets staying below 0.5 so that `Math.round` recovers the count. That is correct today because `MAX_LINE_OFFSET` = 0.45 and slot i gets i*0.45/n. The comment at `chart-rows.ts:75` states this constraint.
- The acceptance tests read end-y from the last number in the path `d` attribute through a regex. That works for recharts' linear path output, but it would break silently if the curve type changed. Acceptable for this scope.

## Cleanup

The scratch checkout `tech-lead-SGS-157-SGS-157` is removed after this report (the result is noted in the handback).
