# SGS-083: Highlight a hovered step's time span as a band on the charts

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: none (owner-chosen backlog triage 2026-11-03)
- **Priority**: medium
- **Risk**: low
  <!-- One component, UI only, no public surface (API, schema, config), no adjacent invariant, about 60 lines of
       business logic. Touches the shared SeriesChart but only adds an optional prop. -->
- **Invariants**: none adjacent (S1 holds: all changes stay under `components/apps/aoe4-build-order/`)
- **LOC estimate**: about 60 (`step-timeline-rows.ts` span helper about 15, `step-timeline.tsx` row handlers about 15, `results.tsx` state and props about 10, `line-chart.tsx` band about 20; tests and docs not counted)
- **Depends on**: none (explored on main `cc9bb04`; SGS-076, SGS-077, SGS-078 are integrated there)
- **On merge**: none
- **Source**: `BACKLOG.md` bullet "Highlight a step's time span on the timeline" (owner request 2026-11-03)

## Context

The step timeline (`components/apps/aoe4-build-order/step-timeline.tsx`) is a table: it has rows with Started and
Finished cells but no time axis, so there is nothing on it to shade as a vertical band. The only time axes are the
charts' X axes (`SeriesChart` in `line-chart.tsx`, `XAxis dataKey="t"` in seconds), which sit beside the table on wide
screens (`results.tsx`, `results-split`). This ticket reads the backlog request as: pointing at a timeline row shades
that step's span, from its start to its finish, on the charts, so the user can see which bends in the curves
belong to the step. The owner may have meant something else; see Open questions.

## Scope

Paths relative to the repo root.

1. `components/apps/aoe4-build-order/step-timeline-rows.ts`: add an exported pure helper `stepSpan(row, end)`, where
   `row` is a `TimelineRow` and `end` is the simulation end in seconds (`result.durationSeconds`). It returns
   `{ from, to }` in seconds or `null`:
   - `startedAt === null` (status `waiting` or `not-reached`): `null`.
   - `completed`: `{ from: startedAt, to: completedAt }`.
   - `in-progress`: `{ from: startedAt, to: end }` (the step is "ongoing" in the table).
   - `to` is never less than `from`, and neither exceeds `end`.
2. `components/apps/aoe4-build-order/step-timeline.tsx`: `StepTimeline` takes `activeStep: number | null` and
   `onActiveStepChange: (step: number | null) => void`. Each `step-timeline-row` calls `onActiveStepChange(row.step)` on
   pointer enter and on focus, and `onActiveStepChange(null)` on pointer leave and blur. Rows get `tabIndex={0}` so keyboard
   users can reach them. The active row is marked `data-active="true"` and has a visible highlight style in
   `results.module.css`. The existing `data-*` attributes and cell contents do not change.
3. `components/apps/aoe4-build-order/results.tsx`: `Results` owns `activeStep` state (`useState<number | null>(null)`),
   passes it and its setter to `StepTimeline`, computes `stepSpan` for the active step's row, and passes the result to
   every `SeriesChart` as a new optional prop `highlight?: { from: number; to: number } | null`. Reset `activeStep`
   to `null` when `result` changes, so a stale index never points into a new run. Rows come from the same
   `timelineRows(result.steps, text, landmarks)` call `StepTimeline` makes; share it (compute once in `Results`
   and pass the rows down, or lift a memo) rather than parsing the text twice.
4. `components/apps/aoe4-build-order/line-chart.tsx`: when `highlight` is set, `SeriesChart` draws one recharts
   `ReferenceArea` (`x1=from`, `x2=to`, full plot height) with `data-testid="chart-step-band"`, `data-from`, `data-to`,
   a translucent fill and a `stroke` so a zero-length span still shows as a line. It is drawn behind the series lines and
   does not change the `markers`, `pinned` or legend behavior, the Y domain, or the X domain
   (`['dataMin','dataMax']`). The band applies to the current run's time axis only; the pinned run draws no band.
5. `docs/aoe4-build-order.md`, paragraph "A step timeline sits above the charts ...": add the behavior in prose:
   hovering or focusing a row shades that step's span on every chart; which statuses have a span; that a step with
   no start shows no band; that in-progress runs to the end of the run. Do not quote measured numbers.
6. Tests (new files; follow the nearest sibling's table and helper style):
   - `components/apps/aoe4-build-order/step-timeline-rows.test.ts`: a `stepSpan` table (see criteria).
   - `acceptance/aoe4-build-order-step-band.spec.ts`: one spec on the Results tab (see criteria). Read the geometry
     in a single `page.evaluate` (house rule in LESSONS.md). Do not add it to `acceptance/aoe4-build-order.spec.ts`,
     which SGS-082 deletes.

**Out of scope:** click-to-pin selection (see Open questions); highlighting from the Build tab's step table (it is on a
different tab and never visible together with the charts); a band on the pinned run's axis; any change to the
simulate API, `StepTiming`, or the engine; touch-specific gestures beyond focus; changing the timeline columns.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `stepSpan` table test in `step-timeline-rows.test.ts`: `completed` row (start 60, end 100, run end 600) returns
      `{ from: 60, to: 100 }`; `in-progress` row (start 500, run end 600) returns `{ from: 500, to: 600 }`;
      `waiting` and `not-reached` rows (startedAt null) return `null`; a row whose `completedAt` equals `startedAt`
      returns `from === to`. The in-progress case fails if the helper uses `completedAt` (null) instead of the run end.
- [ ] Hovering a `step-timeline-row` whose step has a span shows exactly one `chart-step-band` in each of the charts
      present, and its `data-from` and `data-to` equal that row's Started and Finished seconds (compare against the
      `/api/aoe4-build-order/simulate` response's `steps[i].startedAt`/`completedAt`, not hand-computed values).
- [ ] The band's rendered horizontal extent lies inside the chart plot area, and its left edge is at the same x as a
      `chart-marker` at the same `data-at` would be (one `page.evaluate` reading both rects; catches a band drawn in
      pixels or seconds mis-scaled).
- [ ] Moving the pointer off the row removes every `chart-step-band`; focusing a row by keyboard (Tab) shows it and
      blurring removes it.
- [ ] Hovering a row that has no start (a `waiting` or `not-reached` row) shows no `chart-step-band`. If no shipped
      build yields such a row, drive it with a pasted build the simulate API reports as `waiting` or `not-reached`.
- [ ] The active row carries `data-active="true"` and a different computed background or outline from an inactive row.
- [ ] After a new Run, no `chart-step-band` is shown and no row has `data-active`, even when the pointer was over a row
      before the run.
- [ ] Existing step-timeline tests (row order, columns, flags, kind badges) pass unchanged; the cell text of every
      row is the same with and without hover.
- [ ] `docs/aoe4-build-order.md` describes the highlight, and `git grep -n "step timeline" docs/aoe4-build-order.md`
      finds no sentence that now contradicts it (for example one saying the timeline is only a table).
- [ ] `npx tsc --noEmit`, `npm run lint:dup`, `npm test` pass; the new acceptance spec passes via `npm run acceptance`.
- [ ] No INVARIANTS.md regressions

## Open questions

- `owner`: Hover or select? The backlog says "selecting or hovering". Default in this ticket: hover and keyboard
  focus only, with no sticky selection, because the table has no other click action and hover needs no extra state or
  way to clear it. Hover does not work on touch screens; a tap does focus a `tabIndex=0` row in most browsers, which
  gives a rough equivalent. If the owner wants click-to-pin, say so and a follow-up adds a selected state that persists
  until the same row or an empty area is clicked.
- `owner`: Where does the band go? The step timeline has no time axis, so the band cannot go "on the timeline" as
  written. Default: on all four charts (Units produced, Gather rates, Gathered resources, Floating resources).
  Alternative: add a thin horizontal time axis above or below the table (a new component, larger ticket) and shade
  that instead.
- `owner`: What span for an `in-progress` step? Default: from its start to the end of the run. Alternative: no band
  for steps that have not finished.
