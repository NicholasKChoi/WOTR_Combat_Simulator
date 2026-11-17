# SGS-198: Draw the Units chart as one line per unit line, with upgrade dots for the current and the pinned run

- **Type**: Feature
- **Component**: aoe4-build-order
- **Milestone**: M11
- **Priority**: medium
- **Risk**: standard
- **Invariants**: none adjacent (A1 to A3 guard engine results and data; this changes chart series selection and drawing only)
- **Unverified assumptions**: recharts (the pinned version in `package.json`) `ReferenceDot` forwards `data-*` attributes and a `<title>` child to its rendered SVG element, as the existing `ReferenceLine` markers in `line-chart.tsx` rely on for `ReferenceLine`, and places a dot at numeric `x`/`y` on a number x axis and the chart's y axis. The acceptance cases load the page in Chromium and read the real DOM, so this is exercised for real
- **LOC estimate**: 130 (`result-series.ts` about 40, `valueAt` in `chart-rows.ts` about 15, dots in `line-chart.tsx` about 60, `results.tsx` about 10; tests excluded)
- **Depends on**: SGS-191, SGS-197
- **On merge**: none
- **Source**: design/M11.md M11.2 UI half (B-U1 to B-U9, C16, C16a, C13 `upgradeDots` and `pinnedUpgradeDots`); plans/M11-20261116.md outline H

## Context

The Units chart draws one line per unit tier (`Veteran Spearman (tier 3)` and so on), so one unit line splits into several colours and a veterancy upgrade is not visible on it (M11.2). This ticket draws one line per unit line, all tiers summed, named by the `lineName` SGS-191 adds, and puts a dot on the line where each upgrade of that line finished (SGS-191's `ChartMarker.unit`). A pinned run gets the same dots as dashed-outline rings on its dashed lines.

## Scope

All paths under `components/apps/aoe4-build-order/` unless noted. Read at the end state of the Depends-on tickets (SGS-191 for the result fields; SGS-197, with SGS-195, SGS-196 and SGS-194 under it, for `line-chart.tsx` and `results.tsx`): `UnitSeries.lineName` and `ChartMarker.unit?` exist; `SeriesChart` is a `tbody`, takes `markerView`, holds the time window of `useChartZoom` (`shown`) and draws only what lies in it. Use the design's names exactly.

- `result-series.ts` (C16): add `unitLineSeries(run): ChartSeries[]`, one series per `baseId` in order of first appearance in `run.unitsProduced`, `key` = `baseId`, `name` = that entry's `lineName`, `values[i]` = the sum of `counts[i]` over every entry of the `baseId`. `unitsProducedSeries('units', run)` returns it. Add `interface UpgradeDot { key: string; label: string; at: number }` and `unitUpgradeDots(run): UpgradeDot[]`: one dot per `run.markers` entry that has `unit` whose value is a key of `unitLineSeries(run)`, in marker order, `key` = `unit`, `label` = the marker's label, `at` = the marker's `at`. Delete `unitSeries`; `results.tsx` (it uses `ReturnType<typeof unitSeries>` as a type) and the tests that import it follow.
- `chart-rows.ts` (C16a): add `valueAt(times, values, at): number`, linear interpolation between the samples around `at` (the line recharts draws), `values[i]` when `at === times[i]`, the last value past the last sample.
- `line-chart.tsx` `SeriesChart` (C13, dot parts only): new optional props `upgradeDots?: readonly UpgradeDot[]` and `pinnedUpgradeDots?: readonly UpgradeDot[]` (both default none; `pinnedUpgradeDots` is ignored without `pinned`). Draw, in this order inside the plot after the lines: pinned dots, then current dots (B-U9).
  - Current dot (B-U2): `ReferenceDot[data-testid=chart-upgrade-dot]` with `data-series` (line key), `data-label`, `data-at`, a `<title>` in `markerLabel` form (`chart-markers.ts`), at `(at, valueAt(times, that series' values, at))`, radius 4, filled in the line's colour (`seriesColor` of the series' index) with a white stroke.
  - Pinned dot (B-U5): `ReferenceDot[data-testid=chart-pinned-upgrade-dot]` with `data-series` = `pinnedKey(key)` (the pinned path's own `data-series`), `data-label`, `data-at`, a `<title>` of the form `<label> (pinned) <m:ss>` (the `chart-pinned-marker` title form), at `(at, valueAt(pinned.times, the pinned series' values, at))`, radius 5, white fill, a dashed stroke of width 2 in the pinned line's colour (`pinnedColor`). The dash pattern and the stroke details beyond that are the implementer's choice (design: open styling).
  - A dot is drawn only when its line is drawn in that run: a current dot needs a series with its key in `series`; a pinned dot needs a series with its key in `pinned.series`. Judged per run (B-U3): a pinned upgrade of a line the pinned run never produced has no pinned dot even if the current run has that line, and the reverse. (`unitUpgradeDots` already drops markers with no line; this rule also covers a dot list passed with a stale key.)
  - Hiding a line in the series legend hides its current and its pinned dots with it, and showing it brings them back (B-U4; one legend key already hides both lines).
  - A dot or pinned dot whose `at` lies outside the shown window `[from, to]` is not drawn (B-U8, B-Z7).
  - The marker control (`markerView`) does not affect dots (B-U7).
- `results.tsx`: in the Units view the Units chart passes `unitUpgradeDots(result)` as `upgradeDots` and, only when a run is pinned, `unitUpgradeDots(pinned)` as `pinnedUpgradeDots`; computed once per run. The Buildings view and every other chart pass neither (B-U6).
- Tests the change can break (search found these; the rule is general): every unit test of `unitSeries` and of the Units view series (examples: `result-series.test.ts` cases for `unitSeries`, and `unitsProducedSeries('units', ...)` equal to it) is rewritten for `unitLineSeries`; every acceptance assertion that keys the Units chart's paths by per-tier `unitId` is rewritten to key by `baseId` (example, named by the plan: `acceptance/aoe4-build-order-pin-compare.spec.ts` lines 75-79, which loop over `first.unitsProduced` `unitId`, and lines 198-209, the pinned-only-series case, which must be rechecked against the new keys). `acceptance/aoe4-chart-views.spec.ts` "Units produced starts as Units; ..." compares Units legend names with the Buildings names and keeps its assertions. Any other test keeps its expected values.
- Docs: `docs/aoe4-build-order-ui.md` row "Units produced (Units view)" in the chart series table says each `unitsProduced` `unitId` is a series named `<name> (tier <tier>)`, which becomes untrue. SGS-200 (the M11 docs ticket) owns that edit and the new unit-line and dot description, so it is not edited here; the sentence is wrong on `main` between the two merges.

**Out of scope:** the engine and API (`lineName` and `unit` come from SGS-191); the marker control, zoom and window math (their tickets); the Buildings view; Gather rates and resource charts; storing dots in `StoredPin` or any schema, OpenAPI or pin-storage change (a pinned run is re-simulated from its text and already carries `markers[].unit` and `lineName`); a vertical line per upgrade; docs.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `unitLineSeries` (B-U1): one series per `baseId` in order of first appearance in `unitsProduced`, `key` = `baseId`, `name` = `lineName`, `values` = the per-sample sum over the `baseId`'s entries. A unit test uses a result with one `baseId` in two tiers whose counts differ per sample and a second `baseId`, and fails if the series are keyed by `unitId`, ordered by tier or by key, or take one tier's counts instead of the sum. An empty `unitsProduced` gives no series. `unitsProducedSeries('units', run)` equals `unitLineSeries(run)`; `'buildings'` is unchanged.
- [ ] `unitUpgradeDots`: a unit test covers a marker with `unit` set to a produced line (a dot, `key` = `unit`, with the marker's `label` and `at`, in marker order), two upgrades of one line (two dots), a marker with `unit` whose line the run never produced (no dot), and markers without `unit` including age-ups (no dot). It includes a second run whose upgraded line the first run lacks: that run's dot is kept, keyed by its own line.
- [ ] `valueAt` rows: exactly on a sample, between two samples (the interpolated value, with a non-integer result), and past the last sample (the last value). A test fails if the function returns the previous sample's value between samples.
- [ ] Units view lines (B-U1): on the `ENG Knight/Longbow (King's Palace)` template at its default duration, the acceptance spec first asserts from the API result that `longbowman` has entries in two or more tiers, then checks exactly one `path[data-series="longbowman"]` in the Units chart, no path keyed by a `unitId`, and that the legend item names equal the `lineName`s in `unitsProduced`; the y label stays `Count`.
- [ ] Current dots (B-U2, B-U3): on that template the spec first asserts the API result has a marker with `unit: 'longbowman'` (for example `veteran-longbowmen`), then checks one `chart-upgrade-dot` per such marker, `data-at` equal to the marker's `at`, `data-series="longbowman"`, and that each dot's centre lies on that line's drawn path (centre and path read in one `evaluate` under `expect.poll`; the dot's y is `valueAt` of the line, so it fails if a dot is drawn at the previous sample's value or at y 0). The dot is filled in the line's stroke colour with a white stroke (computed attributes). A test with several upgrades of one line yields several dots, and two upgrades at the same instant yield two dots at one point (unit or `SeriesChart` server-render test).
- [ ] Pinned dots (B-U5): the spec pins that run (`pin-run`) then runs the same template at a shorter duration whose end is past the first `unit: 'longbowman'` marker (asserted from the API first, and before the last if there are two). It checks one `chart-pinned-upgrade-dot[data-series="pinned:longbowman"]` per pinned marker, each at its `data-at` and lying on `path[data-series="pinned:longbowman"]`, drawn with a white fill and a dashed stroke in that path's colour; `chart-upgrade-dot` appears only for the current run's markers before its end. Unpinning removes every pinned dot; re-running recomputes both kinds. A pinned-only line (one the current run never produced) gets its pinned dots; a pinned dot of a line the pinned run never produced is absent even when the current run has the line, and the reverse (a `SeriesChart` or series-level unit test covers the per-run rule, B-U3).
- [ ] Hidden line (B-U4): in the same spec, hiding `Longbowman` in the series legend removes both kinds of dot and its two paths; showing it brings them all back.
- [ ] Marker control (B-U7): hiding the `unit-tier` kind in the marker control removes the `unit-tier` vertical lines and leaves both kinds of dot drawn.
- [ ] Buildings view (B-U6): with the Buildings view selected, no `chart-upgrade-dot` or `chart-pinned-upgrade-dot` exists, and the other charts have none in either view.
- [ ] Window (B-U8): with the Units chart zoomed so that a dot's `at` falls outside `[from, to]` (asserted from `data-zoom-from` and `data-zoom-to` and the API markers first), that dot and, with a pin, its pinned dot are not in the DOM, and a dot inside the window is. A test fails if dots ignore the window.
- [ ] Overlap (B-U9): when a current and a pinned dot share a point (the same build pinned and shown again), both are in the DOM and the pinned dot precedes the current dot in DOM order within the plot, so the current dot paints above; the pinned ring radius exceeds the current dot's radius (a `SeriesChart` server-render test or the spec).
- [ ] Existing tests: `acceptance/aoe4-build-order-pin-compare.spec.ts` keys the Units chart's paths by `baseId` and still asserts that each pinned line is dashed and the current line is not, and that a pinned-only series gets one dashed legend item that hides its dashed line (its assertions are unchanged apart from the key). Every other test keeps its assertions apart from the `unitSeries` tests rewritten for `unitLineSeries`.
- [ ] No INVARIANTS.md regressions

## Open questions

none
