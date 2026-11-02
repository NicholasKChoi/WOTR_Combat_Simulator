# SGS-048: Pin a run and compare key numbers and chart overlays

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M3 / M3.6 (pin + compare: overlay, military spent at 10/15/20 min, age-up times, time to 200 pop)
- **Priority**: medium
- **Risk**: standard
  <!-- Plan said medium. One component, no API change, no engine file, no adjacent invariant, but over ~100 lines
       of business logic and it edits three shared UI files. No strongModelTrigger; `components/**` is not a criticalPath. -->
- **Invariants**: none adjacent (client-side only; no engine number, no resource check, no randomness)
- **LOC estimate**: ~190 (`compare.ts` ~55, `compare-panel.tsx` ~65, `chart-rows.ts` ~25, `line-chart.tsx` ~25, `results.tsx` and page wiring ~20; tests excluded)
- **Depends on**: SGS-043 (adds `SimulationResult.spent` and `populationCapReachedAt`), SGS-052 (Y-axis fix in `line-chart.tsx`). SGS-035 (`SpendCategory`, and moves `formatMinSec` to `lib/aoe4-build-order/format-time.ts`).
- **On merge**: none
- **Source**: design/M3.md "Key numbers (compare.ts)", "Overlay (chart-rows.ts)", Behavior rules rows `pin | *`, `compare | values`, `overlay | charts`, "Page props and test ids", Data flow; plan M3-20261101 outline N; owner answers (9) N before O, N depends on I and R.

## Context

The page shows one run at a time. M3.6 lets the user pin the shown run, change the build, run again, and see the new run
beside the pinned one: the three charts draw the pinned series dashed, and a table lists military spent at 10, 15 and 20
minutes, the Feudal/Castle/Imperial times and the time the population cap was reached, each with a delta. Everything is
computed in the browser from two `SimulationResult`s; the route and OpenAPI are unchanged.

## Scope

Prerequisites from SGS-043 and SGS-052 (not on `main` yet; use their names if they differ): `result.spent.military`
(cumulative paid, one value per `times` entry), `result.populationCapReachedAt` (`number | null`), and the Y-axis fix already
in `line-chart.tsx`.

1. **`components/apps/aoe4-build-order/compare.ts`** (new, pure, types-only imports from `lib/aoe4-build-order/model`; the
   bundle must not import `data.ts`):
   - `KEY_TIMES = [600, 900, 1200]`.
   - `KeyNumbers = { militarySpent: Record<600|900|1200, number|null>; ageReachedAt: Record<2|3|4, number|null>; populationCapReachedAt: number|null }`.
   - `keyNumbers(result)`: `militarySpent[t]` is `result.spent.military` at the index where `result.times[i] === t`, else `null`
     (a run with `durationSeconds < t`); `ageReachedAt[a]` is the `reachedAt` of the `result.ages` entry with `age === a`, else
     `null`; `populationCapReachedAt` is copied.
   - `CompareRow = { key: string; label: string; current: number|null; pinned: number|null; delta: number|null }` and
     `compareRows(current, pinned)`, seven rows in this `key` order: `military-600`, `military-900`, `military-1200`, `age-2`,
     `age-3`, `age-4`, `pop-cap`. `delta = current - pinned` when both are numbers, else `null`.
2. **`components/apps/aoe4-build-order/compare-panel.tsx`** (new): `ComparePanel({ current, pinned, onPin, onUnpin })` with
   `current: SimulationResult | null`, `pinned: SimulationResult | null`.
   - `data-testid="pin-run"` button, enabled only while `current !== null`; click calls `onPin`.
   - `data-testid="unpin-run"` button, enabled only while `pinned !== null`; click calls `onUnpin`.
   - Only when both are non-null: a table `data-testid="compare-key-numbers"` with one `data-testid="compare-row"` per
     `compareRows` entry, carrying `data-key`. Each row shows label, pinned value, current value and delta; a `null` shows as
     a dash. Seconds shown as `m:ss` with `formatMinSec` imported from `lib/aoe4-build-order/format-time` (not from `chart-rows.ts`, which no longer has it), military spent as a plain number, delta with an explicit sign;
     exact layout and wording are the implementer's.
3. **`components/apps/aoe4-build-order/chart-rows.ts`**:
   - `PinnedSeries = { times: number[]; series: ChartSeries[] }` (the pinned run's ordinary series, original keys and names).
   - `pinnedKey(key) = 'pinned:' + key`.
   - `toChartRows(times, series, pinned?)`: with `pinned`, returns one row per time in the ascending, de-duplicated union of
     `times` and `pinned.times`; each current series keeps its key, each pinned series is written under `pinnedKey(key)`; a series
     has no value (the key is absent from the row, not `undefined`-valued or 0) at a time outside its own `times`. Without
     `pinned` the result equals today's.
4. **`components/apps/aoe4-build-order/line-chart.tsx`**: `SeriesChart` gains `pinned?: PinnedSeries`. For each pinned series add
   a `<Line dataKey={pinnedKey(key)} name={`${name} (pinned)`} data-series={pinnedKey(key)} strokeDasharray=...>`, same color as
   the current series with that key when one exists, else the next palette color (color and dash pattern are the implementer's);
   `connectNulls={false}` so gaps show. The pinned lines use the existing `hidden` set and legend click handler (key =
   `pinnedKey(key)`), so each toggles like any series. Do not touch the `YAxis` element or its margin (SGS-052's lines), nor
   add marker props (SGS-049).
5. **`components/apps/aoe4-build-order/results.tsx`**: `Results` gains `pinned: SimulationResult | null`. Each chart gets
   `pinned={pinned ? { times: pinned.times, series: <same helper> } : undefined}` using `unitSeries` for units produced and
   `resourceSeries` on `gatherRates` and `floating`.
6. **`pages/apps/aoe4-build-order.tsx`**: `useState<SimulationResult | null>(null)` for `pinned`; render `ComparePanel` under the
   "Results" heading with `onPin={() => setPinned(result)}` and `onUnpin={() => setPinned(null)}`; pass `pinned` to `Results`.
   The pin survives later runs, text edits, prebuilt changes and failed runs (a failed run sets `result` to null as in M2 and
   leaves `pinned`). Pin stores the result object as is (pinning the shown result again replaces the pin with an equal copy).
7. **`docs/aoe4-build-order.md`** "Page" section (line ~553): add the pin button, the dashed overlay in all three charts over
   the union of times with gaps, and the compare table (seven rows, how each value is read, delta rule, table hidden without
   both results). Fix the sentence "Each series' line carries its key as `data-series`" to cover the pinned key
   (`pinned:<key>`). `git grep -n -i "pinned run\|pin-run\|compare-key" -- docs` finds nothing today.

**Order with SGS-049:** SGS-049 (chart markers UI) edits `line-chart.tsx`, `chart-rows.ts` and `results.tsx` too and depends on
this ticket (N before O). SGS-049 rebases on this ticket's lines; do not pre-empt its `markers` prop. SGS-045 and SGS-047 also
edit `results.tsx` and the page; whichever merges later rebases, neither rewrites the other's lines.

**Out of scope:** pinned-run markers (the design draws only the current run's markers); persisting or sharing the pin (URL,
localStorage); more than one pin; engine, route and OpenAPI changes; any change to `spent` or `populationCapReachedAt` (SGS-043);
the Y-axis layout (SGS-052).

## Diagrams

Single-component change outside the core control loop; no diagram required. (Client-only state: the page holds `result` and
`pinned`; both feed `compare.ts` and the charts, as in design/M3.md "Data flow".)

## Acceptance criteria

- [ ] `keyNumbers` reads `militarySpent[600|900|1200]` from `spent.military` at the sample whose time equals the key time, and
  returns `null` for each key time greater than `durationSeconds` (unit test on a 700 s result: 600 is a number, 900 and 1200 are `null`).
- [ ] `keyNumbers` returns `ageReachedAt[a]` from the matching `ages` entry and `null` for an age not reached; it returns
  `populationCapReachedAt` as given, including `null` and `0`.
- [ ] `compareRows` returns exactly seven rows with `key` `military-600, military-900, military-1200, age-2, age-3, age-4, pop-cap`
  in that order; `delta` is `current - pinned` when both are numbers and `null` when either is `null` (a unit test covers number/number,
  number/null, null/number and null/null).
- [ ] `toChartRows(times, series, pinned)` with current times `[0,5,10]` and pinned times `[0,5,10,15]` returns four rows `t=0,5,10,15`;
  the `t=15` row has the pinned keys but no current keys (key absent), and with pinned times `[0,10]` the `t=5` row has no pinned keys.
- [ ] `toChartRows(times, series)` without `pinned` returns what it returns today (the three existing `toChartRows` tests pass unedited).
- [ ] The pinned series key is `pinnedKey(key)` (`pinned:<key>`) and its legend name is `<name> (pinned)`.
- [ ] Playwright: run the default build, click `pin-run`, run again with a different duration (for example 300 s then 600 s): each chart
  has `path[data-series="pinned:food"]` (gather rates, floating) and `path[data-series="food"]`, the pinned path has a non-empty
  `stroke-dasharray` and the current path has none; the units chart has a `pinned:<unitId>` path for each pinned unit series.
- [ ] Playwright: clicking the legend item `Food (pinned)` hides `pinned:food` only, and clicking it again restores it.
- [ ] Playwright: with no result, `pin-run` is disabled; after a run it is enabled; `compare-key-numbers` is absent until a
  second run exists with a pin, then shows seven `compare-row` elements with the `data-key` values above.
- [ ] Playwright: pin a run, change the text or the prebuilt select, run again: the pin and its overlay remain. Pin, then run with an
  invalid paste (400): charts and `compare-key-numbers` disappear, then a valid run brings the overlay and table back with the same pin.
- [ ] Playwright: click `pin-run` on the shown result, then read the table: every row's delta displays as zero or a dash (a dash where
  the value is null on both); `unpin-run` removes the overlay paths and the table, and `unpin-run` is disabled afterwards.
- [ ] Playwright: pin a 1200 s run, then run a 300 s run: the `military-900` and `military-1200` rows show a dash for the current value
  and a dash for the delta, and the charts draw the pinned lines out to 1200 s with a gap in the current lines past 300 s.
- [ ] Mutation check: changing `compareRows` to compute `pinned - current` fails the delta unit test; changing `toChartRows` to use
  the intersection of times instead of the union fails the union test (both run in a throwaway worktree once the tests exist).
- [ ] `docs/aoe4-build-order.md` Page section describes the pin, the overlay and the compare table:
  `git grep -n -i "pin-run\|pinned run" -- docs/aoe4-build-order.md` finds a match (0 matches today).
- [ ] `components/apps/aoe4-build-order/compare.ts` and `compare-panel.tsx` import nothing from `lib/aoe4-build-order/data.ts` (`npx next build` succeeds); `compare-panel.tsx` imports `formatMinSec` from `lib/aoe4-build-order/format-time` (`git grep -n "chart-rows" -- components/apps/aoe4-build-order/compare-panel.tsx` finds no `formatMinSec`).
- [ ] No INVARIANTS.md regressions

## Open questions

None.
