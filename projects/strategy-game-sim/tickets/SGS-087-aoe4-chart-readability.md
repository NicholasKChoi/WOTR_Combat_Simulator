# SGS-087: Make the AoE4 charts readable: uncrowded marker labels and rounded tooltip values

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: none (owner-chosen backlog triage 2026-11-03: post-M4 UX fixes)
- **Priority**: medium
- **Risk**: low
  <!-- One component, no public surface (API, schema, CLI, config), no adjacent invariant, well under 100 lines of business logic. -->
- **Invariants**: none
- **LOC estimate**: 30 (components/apps/aoe4-build-order/line-chart.tsx marker rendering, one value formatter in chart-rows.ts; tests and the doc paragraph excluded)
- **Depends on**: SGS-082 (it deletes `acceptance/aoe4-build-order.spec.ts`, whose "marker labels stay apart" tests assert a text label on every marker; start from main after it merges)
- **On merge**: none. Manager follow-up: delete the `BACKLOG.md` bullets beginning "Chart marker labels:" (line 63) and "Chart tooltips show raw floats" (line 73).
- **Source**: BACKLOG.md line 63 (post-M4 end-to-end pass 2026-11-02) and line 73 (SGS-077 review); both verified against origin/main `cc9bb04`.

## Context

Both defects sit in the one shared chart component, `SeriesChart` in `components/apps/aoe4-build-order/line-chart.tsx`, which draws all four charts (Units produced, Gather rates, Gathered resources, Floating resources). On the Knight/Longbow build every research marker (economy, unit tier, blacksmith) gets a text label, and `placeMarkers` stacks the labels into rows, so the 10:00 to 17:00 stretch makes a tall dense column above the plot. The `<Tooltip>` has no value formatter, so hovering shows recharts' raw float, for example `Food : 92.630712227254`.

## Scope

Paths relative to the repo root. Explored on origin/main `cc9bb04`.

1. Marker labels (`components/apps/aoe4-build-order/line-chart.tsx`, `SeriesChart`). Default approach, pending the owner question below: only `age-up` markers keep their text label and their row in `placeMarkers`. Every other marker kind is still drawn as its solid coloured `ReferenceLine` (same `data-testid="chart-marker"`, `data-kind`, `data-label`, `data-at`, same `MARKER_COLORS`) but without text, and carries a hover title `<label> <m:ss>` (the `markerLabel` text) the way the pinned age-up lines already do (`<title>` child of the `ReferenceLine`). Pass only the labelled markers to `placeMarkers`, so `rows` (the top margin and `data-label-rows`) counts only age-up labels. Reuse `pinnedAgeUpMarkers` or rename it to a kind-neutral `ageUpMarkers`; either way update its callers and its unit test.
2. Tooltip values (`SeriesChart`'s `<Tooltip>`, plus one pure helper in `chart-rows.ts`, for example `formatChartValue`). Add a `formatter` to the `<Tooltip>` that shows each value rounded to at most 1 decimal place with no trailing zero (`92.630712227254` shows `92.6`, `40` shows `40`). It applies to current and pinned series in every chart. Keep recharts' `Name : value` layout and the `labelFormatter` (`m:ss` time) as they are. A missing value (a pinned series past its run's end) shows as recharts shows it today.
3. Docs: `docs/aoe4-build-order.md`, the paragraph under the four-chart table that says markers are "labeled `<label> <m:ss>` ... stacked in rows by their measured width". Rewrite it for the end state: age-up markers are labelled and stacked; other kinds are lines whose hover title is `<label> <m:ss>`; tooltip values are rounded to 1 decimal. Describe behavior only, no measured results. Grep the doc and `data/aoe4-build-order/README.md` for "label", "stacked", "tooltip" and fix any other statement this makes untrue.
4. Tests. Unit: `chart-rows.test.ts` gets a table test for the value formatter; `line-chart.test.ts` keeps its `placeMarkers` and legend tests. New acceptance spec file `acceptance/aoe4-chart-readability.spec.ts` (do not add to or edit `acceptance/aoe4-build-order.spec.ts`), following the style of `acceptance/aoe4-gathered-resources.spec.ts` and the helpers in `acceptance/helpers.ts`. Read any layout rects in one `page.evaluate` (LESSONS.md).

**Out of scope:** changing marker colours, kinds, the marker legend, the pinned age-up lines, or the `markers` API field; adding a gather-rate-per-villager toggle or step highlighting (separate backlog items); sticky run bar; the series legend; chart height or axis ticks.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] In the Knight/Longbow prebuilt build at 1280 px, in each of the four charts, the visible text labels inside the chart SVG (`svg text.recharts-label`) are exactly the `age-up` markers' `<label> <m:ss>` texts, and the chart's `data-label-rows` equals the number of rows `placeMarkers` assigns to those labels alone (never more than the number of age-up markers).
- [ ] In the same run, every marker the response lists, of every kind, is still present once per chart as `[data-testid="chart-marker"]` with its `data-kind` and `data-at`, and each non-age-up one has a `<title>` equal to `<label> <m:ss>`.
- [ ] Hovering the plot of the Floating resources chart (and the Gather rates chart) on a run with fractional values shows a tooltip in which no value has more than 1 decimal place. Pinned by the acceptance spec reading the tooltip text after `hover` on the plot; it fails if the `<Tooltip>` formatter is removed.
- [ ] `formatChartValue` (or the chosen name) unit table in `chart-rows.test.ts`: `92.630712227254` gives `92.6`, `40` gives `40`, `0.04` gives `0` (and never `-0` for `-0.04`), `1234.56` gives `1234.6`. Catches a formatter that uses `toFixed(1)` without dropping the trailing zero, or that leaves floats raw.
- [ ] Pinned test: `placeMarkers` is called with only the labelled (age-up) markers. Pinned by the first criterion's acceptance case (input: the Knight/Longbow run; expected: no non-age-up text label in the SVG; break caught: passing all markers back to `placeMarkers`).
- [ ] The marker legend, pinned age-up dashed lines and their hover titles, and series legend behaviour are unchanged: the existing `line-chart.test.ts` legend and `pinnedAgeUpMarkers`-style tests pass (renamed if the helper is renamed).
- [ ] `docs/aoe4-build-order.md` describes the end state in Scope 3, and no statement in the doc or `data/aoe4-build-order/README.md` still says every marker carries a text label.
- [ ] No test is added to or edited in `acceptance/aoe4-build-order.spec.ts`.
- [ ] `npx tsc --noEmit`, `npm run lint:dup`, `npm test` and `npm run acceptance` pass. The implementer records, in the report, a 1280 px screenshot of the Knight/Longbow Gather rates chart after the change (label column height before and after is a measured result: report only, not in docs).
- [ ] No INVARIANTS.md regressions

## Open questions

- (owner) How should the crowded research marker labels be fixed? Default, used above: only age-ups keep text labels; research markers (economy, unit tier, blacksmith) are unlabelled coloured lines with a hover title and the kind legend. Alternatives: (a) collapse same-kind markers that sit close together into one label such as `Blacksmith x4` with the full list in the hover title (needs a "close together" rule the owner would choose); (b) keep all labels but only on hover of the line.
- (owner) Tooltip precision. Default, used above: at most 1 decimal place for every chart. Alternative: whole numbers for Floating and Gathered resources, 1 decimal for Gather rates.
