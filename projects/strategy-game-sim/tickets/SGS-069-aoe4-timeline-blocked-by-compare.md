# SGS-069: Timeline "Blocked by" column, ongoing steps, compare deltas, omitted empty rows, blank-key reasons

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M4 / M4.10, M4.12 (the reason shown for a blank key number only)
- **Priority**: medium
- **Risk**: standard
  <!-- Display-only change in the site components; no engine, API or schema change; over 100 lines, so not low. -->
- **Invariants**: none (A1 to A3 cover the simulation; this reads the response and adds no number to it)
- **LOC estimate**: about 150 (`step-timeline-rows.ts` ~30, `step-timeline.tsx` ~20, `compare.ts` ~45, `compare-panel.tsx` ~50, tests and docs excluded)
- **Depends on**: SGS-056 (strictNullChecks precursor, outline A; `KeyValue` and `TimelineRow` are written against `strictNullChecks`)
- **On merge**: none
- **Source**: design/M4.md C10, C11, Behavior rules "Timeline (M4.10)" and "Compare and pin (M4.10, M4.12)"; plans/M4-20261102.md outline M

## Context

The step timeline shows "Waited on" and "Stuck on" as two columns, and the compare table shows seven rows
even when both sides are blank, with a bare dash for a missing number. M4.10 folds the wait columns into one
"Blocked by" column, shows in-progress steps as ongoing, highlights long waits, and gives the compare table
deltas with a direction and a reason for each blank key number. This ticket defines the `compare.ts` side of C11
and the M4.10 panel changes. `ComparePanel` keeps today's four props; the pin-persistence ticket (SGS-072, M4.12)
adds `pinnedName` and `alreadyPinned` together with their use.

## Scope

All paths are in `components/apps/aoe4-build-order/` unless stated (verified on origin/main d5c2549; the lib
folder has no timeline or compare file).

### Timeline (C10)

- `step-timeline-rows.ts`: `TimelineRow` gains `blockedBy: string` and `longWait: boolean`. Export
  `LONG_WAIT_SECONDS = 60`. `longWait = waitSeconds >= LONG_WAIT_SECONDS` (exactly 60 s is highlighted, 59.9 s is
  not). The existing `waitBreakdown` array is still computed (it is the input of `blockedBy`); `waitingOn`
  stays. The separate-column use of `flagged` goes; the `flagged` field and `data-flagged` stay (they mean
  `waiting` or `not-reached`).
- `blockedBy` rules:
  - `completed` or `in-progress`: the non-zero breakdown reasons as `<reason> <m:ss>` in the order resources,
    villagers, population, prerequisite, joined with `, ` (as `formatWaitBreakdown` does today); empty string
    when none.
  - `waiting`: that text followed by `still waiting on <waitingOn>` (joined with `, ` when the breakdown is not
    empty; the phrase alone when it is).
  - `not-reached`: `not reached (<waitingOn>)`, where `waitingOn` is `trigger` or `earlier-step`. The engine sets
    it for every `not-reached` step (`simulate.ts` line 903), so no null case is handled.
- `step-timeline.tsx`: columns are Step, Started, Finished, Waited, Blocked by (the "Waited on" and "Stuck on"
  columns are removed). Finished reads `ongoing` for an `in-progress` row and an en dash for `waiting` and
  `not-reached` rows (as Started already does). Rows with `longWait` get `data-long-wait="true"` and class
  `table-warning`; flagged rows keep `data-flagged` and `table-warning`. Existing test ids and attributes
  (`step-timeline`, `step-timeline-row`, `data-step`, `data-status`, `data-flagged`, `data-reaction`) are kept.
  The table sits in a wrapper with test id `step-timeline-scroll` and `overflow-x: auto` (replacing the
  current `table-responsive` wrapper).

### Compare (C11)

- `compare.ts`: export `KeyValue = { value: number } | { value: null; reason: 'run-ended' | 'not-reached' }`.
  `KeyNumbers` fields become `KeyValue` (`militarySpent: Record<KeyTime, KeyValue>`, `ageReachedAt: Record<KeyAge, KeyValue>`,
  `populationCapReachedAt: KeyValue`).
  - `keyNumbers(result)`: military at T is `{ value: spent.military at T }` when `T <= result.durationSeconds` and the
    sample exists, else `{ value: null, reason: 'run-ended' }`. An age or the population cap that was not reached is
    `{ value: null, reason: 'not-reached' }`; `populationCapReachedAt` `0` is a value.
  - `CompareRow` is `{ key, label, current: KeyValue, pinned: KeyValue, delta: number | null, direction: 'better' | 'worse' | 'same' | null }`.
    `delta = current - pinned` only when both have values. `direction`: military, higher is better; `age-2` to `age-4` and
    `pop-cap`, earlier is better; `delta === 0` gives `same`; a missing value gives `null` for both.
  - `compareRows(current, pinned)` omits every row whose `current` and `pinned` both have `value: null`. Row keys
    stay `military-600`, `military-900`, `military-1200`, `age-2`, `age-3`, `age-4`, `pop-cap` in that order.
- `compare-panel.tsx`:
  - Props stay exactly `{ current, pinned, onPin, onUnpin }`: `current` and `pinned` `SimulationResult | null`, `onPin` and
    `onUnpin` `() => void`. This ticket does not add `pinnedName` or `alreadyPinned` (SGS-072 adds them with their use).
  - Each row gets `data-direction` (`better`, `worse`, `same`, or absent for `null`) beside the existing `data-testid="compare-row"`
    and `data-key`. Table test id `compare-key-numbers` is kept. The table sits in a wrapper with test id `compare-scroll`
    (`overflow-x: auto`).
  - A value cell shows: military as the rounded number, ages and `pop-cap` as `m:ss`; a null value shows `run ends at <m:ss>`
    (that run's `durationSeconds`, so the panel reads it from `current` / `pinned`) for `run-ended`, and `not reached`
    for `not-reached`.
  - The delta cell shows: military `+120 resources` / `−120 resources` (U+2212 minus; rounded magnitude); times
    `0:35 earlier` / `0:35 later` (negative delta is earlier); zero `same`; a missing delta the dash `—`. Colour class `text-success`
    for `better`, `text-danger` for `worse`, none otherwise.
  - When every row is omitted (both runs present), render `compare-empty` with the text "Nothing to compare yet" instead of the table.
- `docs/aoe4-build-order.md`: rewrite the step timeline paragraph (lines 806 to 812: columns, `ongoing`, Blocked by text, long-wait
  highlight at 60 s, scroll wrapper) and the compare paragraph (lines 822 to 828: omitted rows, reasons, delta text and direction,
  `compare-empty`, `compare-scroll`, `data-direction`). Grep `docs/` for "Waited on", "Stuck on" and "a dash when" and fix any other hit.
- Tests (rule, not a list): a test of the changed behavior gets the new expected value; any other test keeps its value. The implementer lists
  every test it edits. Expected to change: `step-timeline-rows.test.ts` (new `blockedBy`, `longWait` cases, 59.9 s vs 60 s boundary),
  `compare.test.ts` (`KeyValue` shapes, reasons, omitted rows, direction), `acceptance/aoe4-build-order-pin-compare.spec.ts` (it
  asserts seven rows, dash cells and `signed()` delta text), `acceptance/aoe4-build-order-m3-flow.spec.ts` (asserts `COMPARE_KEYS`
  rows), and `acceptance/aoe4-build-order.spec.ts` "step timeline" tests only if they read the removed columns. Add acceptance
  coverage for `data-long-wait`, `ongoing`, `compare-empty` and `data-direction`.

**Out of scope:** the `pinnedName` and `alreadyPinned` props, `pinned-label`, Pin disabled from `alreadyPinned`, stale results, pin storage and the page state for `pinnedName`
(SGS-072); the 390 px layout rule beyond adding the two scroll wrapper ids (narrow-layout ticket); any engine, API or
OpenAPI change (`StepTiming` is unchanged); chart code.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [x] A `completed` row with `waitBreakdown` `{ prerequisite: 4, resources: 2, villagers: 3 }` has `blockedBy` `resources 0:02, villagers 0:03, prerequisite 0:04`; with `{}` it is empty.
- [x] A `waiting` row has `blockedBy` ending `still waiting on <waitingOn>`, and equal to that phrase alone with an empty breakdown; a `not-reached` row has `not reached (trigger)` or `not reached (earlier-step)`.
- [x] A row with `waitSeconds` 60 has `longWait` true, `data-long-wait="true"` and class `table-warning`; one with 59.9 has `longWait` false and no `data-long-wait`.
- [x] An `in-progress` row's Finished cell reads `ongoing`; `waiting` and `not-reached` rows show an en dash.
- [x] The timeline header cells are exactly Step, Started, Finished, Waited, Blocked by, and `step-timeline-scroll` wraps the table. `git grep -n "Waited on\|Stuck on" -- components acceptance docs` finds nothing after the change (it finds two lines in `step-timeline.tsx` today).
- [x] `git grep -n "LONG_WAIT_SECONDS = 60" -- components` finds exactly one line.
- [x] `keyNumbers` on a 700 s run gives military 900 and 1200 as `{ value: null, reason: 'run-ended' }`, an age not reached as `{ value: null, reason: 'not-reached' }`, and `populationCapReachedAt` 0 as `{ value: 0 }`.
- [x] `compareRows` omits a row whose current and pinned are both null and keeps the key order of the rest; `delta` is `current - pinned` only when both have values.
- [x] `direction` is `better` for a higher military value and for an earlier age or `pop-cap`, `worse` for the reverse, `same` for a zero delta, and `null` when either value is missing.
- [x] In the browser, a pinned 1200 s run against a current 300 s run shows `run ends at 5:00` in the current cell of `military-900` and `military-1200`, `not reached` for an age missing on one side, and a dash delta for those rows.
- [x] Delta text reads `+120 resources` / `−120 resources` for military, `0:35 earlier` / `0:35 later` for times, `same` for zero; a `better` row has class `text-success` and a `worse` row `text-danger`.
- [x] Pinning the shown result gives `same` on every row with a value; when both runs are blank on all seven rows, `compare-empty` reads "Nothing to compare yet" and no `compare-row` renders.
- [x] `compare-scroll` wraps the compare table; `ComparePanel` accepts exactly the props `{ current, pinned, onPin, onUnpin }` (`git grep -n "pinnedName\|alreadyPinned" -- components pages` finds nothing) and the page compiles unchanged with `npx tsc --noEmit`.
- [ ] `npm test` and `npm run acceptance` pass; every edited existing test is listed in the PR description.
- [x] `docs/aoe4-build-order.md` describes the new timeline and compare behavior and no sentence still describes the removed columns or seven always-present rows.
- [x] No INVARIANTS.md regressions

## Open questions

None.

## Re-spec 2026-11-02

- Underspecified: `pinnedName` and `alreadyPinned` were declared unused here; designer pass 4 (C11) assigns them to M4.12.
- Changed: props stay the four existing ones; page call edit, Scope lines, criterion and both Open questions removed.
- Stands: all timeline, `compare.ts`, panel rendering and docs scope.

## Rework 1 - 2026-11-02 (review)

Gate that bounced: review (reports/SGS-069-review-1.md). Tip reviewed: 201238a47e9dea501853530c1d4a7b1434c08d38. No earlier gate had passed it.

Findings:
- `acceptance/aoe4-build-order-pin-compare.spec.ts:100-142`: the test named "omits rows blank on both sides" asserts only that there are at least 4 keys and that they are in `ROW_KEYS` order. Removing the omit `.filter` from `compareRows` leaves it green, so the name claims a check the assertions do not make. Omission is covered only by the other two compare tests.
- `acceptance/aoe4-build-order-m3-flow.spec.ts`: the compare assertion was weakened to "an in-order subset" of the keys and cannot catch a wrongly omitted row.

Required fixes:
- [x] (rework 1) In the test at pin-compare spec lines ~100-142, build the expected key list from `pinnedRun` and `current` (rows with a number on at least one side) and assert it equals the rendered keys exactly. Mutation check: removing the omit filter must fail this test. Keep the test name only if it is now true.
- [x] (rework 1) In the m3-flow spec, replace the "in-order subset" assertion with an exact expected key list derived the same way, so a wrongly omitted or wrongly kept row fails.
- [x] Production code is unchanged; no other test changes.
