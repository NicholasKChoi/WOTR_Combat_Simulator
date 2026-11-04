# SGS-083: Highlight a hovered step's time span as a band on the charts

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: none (owner-chosen backlog triage 2026-11-03)
- **Priority**: medium
- **Risk**: low
  <!-- One component, UI only, no public surface (API, schema, config), no adjacent invariant, about 70 lines of
       business logic. Touches the shared SeriesChart but only adds an optional prop. -->
- **Invariants**: none adjacent (S1 holds: all changes stay under `components/apps/aoe4-build-order/`, plus docs and tests)
- **LOC estimate**: about 70 (`step-timeline-rows.ts` span helper about 15, `step-timeline.tsx` props and row handlers about 20, `results.tsx` state, rows memo and props about 15, `line-chart.tsx` band and zero-length line about 20; tests and docs not counted)
- **Depends on**: none (explored on origin/main `b9481e3`; SGS-076, SGS-077, SGS-078, SGS-081 are integrated there)
- **On merge**: none
- **Source**: `BACKLOG.md` bullet "Highlight a step's time span on the timeline" (owner request 2026-11-03; owner answers 2026-11-04: hover and keyboard focus only, band on all four charts, in-progress runs to the end of the run)

## Context

The step timeline (`components/apps/aoe4-build-order/step-timeline.tsx`) is a table with Started and Finished cells but
no time axis. The only time axes are the charts' X axes (`SeriesChart` in `line-chart.tsx`, `XAxis dataKey="t"` in
seconds, domain `['dataMin','dataMax']`), which sit beside the table at 1200 px and wider (`results.tsx`,
`results-split`). The owner confirmed the reading: pointing at (hover) or focusing a timeline row shades that step's
span on all four charts (Units produced, Gather rates, Gathered resources, Floating resources). There is no
click-to-pin selection.

recharts 3.10.1 facts the design relies on (checked in `node_modules/recharts/es6`):
- `ReferenceArea` renders a `Rectangle`, and `Rectangle` returns `null` when its pixel width is 0
  (`shape/Rectangle.js`), so a span with `from === to` draws nothing as an area.
- `ReferenceArea` default `zIndex` is `DefaultZIndexes.area` (100), below `Line` and `ReferenceLine` (400), so the area
  sits behind the series lines without extra work.
- `ReferenceArea` and `ReferenceLine` pass `data-*` props to the drawn SVG element (`svgPropertiesAndEvents` keeps keys
  starting `data-`), as the existing `chart-marker` lines already rely on.
- Both default to `ifOverflow: 'discard'`, which drops the shape when a coordinate is outside the X domain. The run's
  `times` start at 0 and end at `durationSeconds` (`sampleTimes` in `lib/aoe4-build-order/simulate.ts`), so a span
  clamped to `[0, durationSeconds]` is always inside the domain, also when a pinned run widens it.

Bootstrap 5.3.8 paints table cell backgrounds as `box-shadow: inset 0 0 0 9999px var(--bs-table-bg-state, ...)` over
`background-color: var(--bs-table-bg)`. `table-warning` sets `--bs-table-bg` (and its own `--bs-table-active-bg`);
`table-active` sets `--bs-table-bg-state`. So `table-active` on a row shows on top of `table-warning`, darker than the
warning tint, without new CSS.

## Scope

Paths relative to the repo root.

1. `components/apps/aoe4-build-order/step-timeline-rows.ts`: add an exported pure helper `stepSpan(row, end)`, where
   `row` is a `TimelineRow` and `end` is the run end in seconds (`result.durationSeconds`). It returns
   `{ from: number; to: number } | null`:
   - `startedAt === null` (status `waiting` or `not-reached`): `null`.
   - `completed`: `{ from: startedAt, to: completedAt }`.
   - `in-progress`: `{ from: startedAt, to: end }`.
   - The result is clamped so `0 <= from <= to <= end`.
2. `components/apps/aoe4-build-order/step-timeline.tsx`: `StepTimeline` props become
   `{ rows: TimelineRow[]; activeStep: number | null; onActiveStepChange: (step: number | null) => void }`. It no longer
   takes `steps`, `text`, `landmarks` and no longer calls `timelineRows` (the rows come from `Results`, Scope 3).
   Each `step-timeline-row`:
   - calls `onActiveStepChange(row.step)` on `onPointerEnter` and `onFocus`, and `onActiveStepChange(null)` on
     `onPointerLeave` and `onBlur`;
   - has `tabIndex={0}` so keyboard users can reach it;
   - when `row.step === activeStep`, carries `data-active="true"` and Bootstrap's `table-active` class, alongside
     `table-warning` when the row is flagged or a long wait (`cn(...)` of both). No new CSS rule is needed; see Context
     for why `table-active` shows through `table-warning`.
   The existing `data-*` attributes, the legend, and cell contents do not change.
3. `components/apps/aoe4-build-order/results.tsx`: `Results`
   - computes the rows once: `const rows = useMemo(() => timelineRows(result.steps, text, landmarks), [result.steps, text, landmarks])`
     and passes `rows` to `StepTimeline`;
   - keeps the active step tied to the result it was set for, so a new run clears it without an effect or a remount:
     state `useState<{ result: SimulationResult; step: number } | null>(null)`; the active step is
     `state?.result === result ? state.step : null`; `onActiveStepChange(step)` sets `{ result, step }` or `null`.
     Do not put a `key` on `Results` for this, because a remount also resets each chart's hidden-series state;
   - finds the active row in `rows`, computes `stepSpan(activeRow, result.durationSeconds)`, and passes the result to
     every `SeriesChart` (all four) as a new optional prop `highlight?: { from: number; to: number } | null`.
4. `components/apps/aoe4-build-order/line-chart.tsx`: `SeriesChart` takes `highlight`. When it is set:
   - `from < to`: one recharts `ReferenceArea` with `x1={from}`, `x2={to}`, no `y1`/`y2` (full plot height), a
     translucent fill, and `data-testid="chart-step-band"`, `data-from={from}`, `data-to={to}`.
   - `from === to`: one recharts `ReferenceLine` with `x={from}` and the same `data-testid="chart-step-band"`,
     `data-from`, `data-to`, in the band's colour, so a zero-length step (an instant `move`, `rally` or `pause`) still
     shows. It carries no label.
   Either way exactly one `chart-step-band` element is drawn per chart. The band does not change `markers`,
   `pinnedMarkers`, `pinned`, the legends, the Y domain, the X domain, or `placeMarkers` label rows. The band is for
   the current run only; the pinned run gets none.
5. `docs/aoe4-build-order.md`, paragraph "A step timeline sits above the charts ...": add in prose that hovering or
   keyboard-focusing a row highlights it and shades that step's span on every chart, from Started to Finished; that an
   `in-progress` step's span runs to the end of the run; that a step whose start and finish are the same second shows as
   a single vertical line; that a `waiting` or `not-reached` step (no start) shows no band; and that moving off the row
   or running again clears it. Do not quote measured times.
6. Tests (follow the nearest sibling's table and helper style):
   - `components/apps/aoe4-build-order/step-timeline-rows.test.ts` (exists): add a `describe('stepSpan')` table that
     builds rows with the file's existing `timing` helper and `rowsOf`.
   - `acceptance/aoe4-build-order-step-band.spec.ts` (new): the browser criteria below, on the Results tab. Read all
     geometry in a single `page.evaluate` per check (LESSONS.md). Do not add to `acceptance/aoe4-build-order.spec.ts`,
     which SGS-082 deletes.

**Out of scope:** click-to-pin selection; highlighting from the Build tab's step table (a different tab, never visible
with the charts); a band on the pinned run's axis; a new time axis on the timeline; any change to the simulate API,
`StepTiming`, or the engine; touch gestures beyond focus; changing the timeline columns.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [x] (respec 1) `stepSpan` table in `step-timeline-rows.test.ts`, rows built from `timing(...)` with run end 600:
      completed start 60 finish 100 gives `{ from: 60, to: 100 }`; in-progress start 500 gives `{ from: 500, to: 600 }`
      (fails if the helper reads `completedAt`, which is null); `waiting` and `not-reached` with `startedAt: null` give
      `null`; completed with `startedAt === completedAt === 30` gives `{ from: 30, to: 30 }`; in-progress start 600
      gives `{ from: 600, to: 600 }`.
- [x] (respec 1) Hovering a `step-timeline-row` whose step has `from < to` shows exactly one `chart-step-band` in each of
      the four charts, and its `data-from` and `data-to` equal that step's `startedAt` and `completedAt` (or
      `durationSeconds` when `in-progress`) from the `/api/aoe4-build-order/simulate` response the page received, not
      hand-computed values.
- [x] (respec 1) Zero-length step: hovering the row of a step the simulate response reports with
      `completedAt === startedAt` shows exactly one `chart-step-band` in each chart, its `data-from` equals its
      `data-to`, and its rendered rect has non-zero height and is visible (fails with a bare `ReferenceArea`, which
      renders nothing at zero width).
- [x] (respec 1) Geometry, one `page.evaluate`: hover the row of an Age up step whose `completedAt` equals an `age-up`
      marker's `at` in the simulate response; in each chart the band's right edge is within 1 px of that
      `chart-marker`'s x, and the band's left and right edges lie within the chart's `.recharts-cartesian-grid`
      horizontal extent. Catches a band scaled in pixels or the wrong unit.
- [x] Moving the pointer off the row removes every `chart-step-band`; focusing a row by keyboard (Tab) shows the band
      and blurring removes it.
- [x] Hovering a row with no start (a `waiting` or `not-reached` row) shows no `chart-step-band`. If no shipped build
      yields such a row, use a pasted build the simulate API reports as `waiting` or `not-reached`.
- [x] (respec 1) Active row style: the hovered row carries `data-active="true"`, and the computed `box-shadow` of its
      first `td` differs from the same cell's value before hover. Checked on an unflagged row and on a flagged
      (`data-flagged="true"`) or long-wait row, so a highlight that `table-warning` hides fails.
- [x] (respec 1) After a new Run, no `chart-step-band` is shown and no row has `data-active`, even though the pointer
      stayed over a row (Run triggered without moving the pointer off the row, for example by keyboard, so no
      `pointerleave` fires). Fails if the active step is held in plain `useState<number | null>` with no tie to the result.
- [x] Existing step-timeline tests (row order, columns, flags, kind badges) pass unchanged; the cell text of every row is
      the same with and without hover.
- [x] `docs/aoe4-build-order.md` describes the highlight per Scope 5, and no sentence in it still says or implies the
      timeline has no interaction.
- [ ] `npx tsc --noEmit`, `npm run lint:dup`, `npm test` pass; the new acceptance spec passes via `npm run acceptance`.
- [x] No INVARIANTS.md regressions

## Open questions

None.

## Re-spec 2026-11-04

- Underspecified: a zero-length span drew nothing (recharts `Rectangle` returns null at width 0); the owner questions
  (hover vs select, where the band goes, in-progress span) were open; row sharing, the active style versus
  `table-warning`, and the reset mechanism were left to the implementer.
- Changed: `from === to` draws a `ReferenceLine` with the same testid; owner answers folded in; `Results` memoizes the
  rows and passes them to `StepTimeline`; the active row uses Bootstrap `table-active` and the test compares the
  first cell's computed `box-shadow`; the active step is stored with its result; `stepSpan` clamps to `[0, end]`;
  the existing `step-timeline-rows.test.ts` gets the table; base refreshed to `b9481e3`.
- No branch work exists.
