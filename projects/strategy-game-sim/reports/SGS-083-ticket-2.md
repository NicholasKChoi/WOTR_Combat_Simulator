# SGS-083 ticket 2 (re-spec)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-083-aoe4-highlight-step-span-on-charts.md

## Summary
"Highlight a hovered step's time span as a band on the charts", component aoe4-build-order, risk low, about 70
business-logic lines, no dependencies (base origin/main b9481e3). Hover or keyboard focus on a step-timeline row
highlights the row and draws one `chart-step-band` on all four charts: a `ReferenceArea` when from < to, a
`ReferenceLine` with the same testid and data-from/data-to when from === to. New `stepSpan(row, end)` helper (clamped
to [0, end]; in-progress runs to `durationSeconds`). Criteria cover the helper table, band data vs the API response,
the zero-length line, geometry against the age-up marker, leave/blur, no-start rows, active style through
table-warning, reset after a new Run, unchanged rows, docs, and the standard commands.

## Gate findings folded in
- Blocking zero-width gap: from === to draws a ReferenceLine (same testid); new acceptance row for a step with
  completedAt === startedAt. Verified Rectangle.js returns null at width 0 in recharts 3.10.1.
- Owner answers: hover and focus only, all four charts, in-progress to run end. Open questions removed.
- Row sharing: one way. `Results` memoizes `timelineRows` and passes `rows`; `StepTimeline` drops steps/text/landmarks
  (results.tsx is its only caller; no component tests use it).
- Active style vs table-warning: Bootstrap 5.3.8 `table-active` sets `--bs-table-bg-state`, which paints the cell
  box-shadow over table-warning's `--bs-table-bg`. The criterion compares the first td's computed `box-shadow`, on an
  unflagged row and on a flagged or long-wait row.
- Reset mechanism: active state stored as `{ result, step }`, read as null when `state.result !== result`. No key
  remount, because a remount would also reset the charts' hidden-series state. No effect.
- Base reference refreshed from cc9bb04 to b9481e3. Also fixed: `step-timeline-rows.test.ts` already exists (it was
  listed as new).
- Also checked: ReferenceArea zIndex 100 is below Line 400 (behind series); data-* pass through
  svgPropertiesAndEvents; times end at durationSeconds, so the default `ifOverflow: 'discard'` never drops a clamped span.

## Diagrams
None (single component, not a control loop).

## Open questions
None.

## Overlap
SGS-082 deletes acceptance/aoe4-build-order.spec.ts; this ticket's spec is a new file, so there is no conflict. No
command criteria to run (no grep, diff, or mutation checks).
