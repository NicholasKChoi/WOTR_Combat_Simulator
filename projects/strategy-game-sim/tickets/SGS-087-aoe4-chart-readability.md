# SGS-087: Make the AoE4 charts readable: uncrowded marker labels and rounded tooltip values

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: none (owner-chosen backlog triage 2026-11-03: post-M4 UX fixes)
- **Priority**: medium
- **Risk**: low
  <!-- One component, no public surface (API, schema, CLI, config), no adjacent invariant, well under 100 lines of business logic. -->
- **Invariants**: none
- **LOC estimate**: 30 (components/apps/aoe4-build-order/line-chart.tsx marker rendering, one value formatter in chart-rows.ts; tests and the doc paragraph excluded)
- **Depends on**: SGS-082 (it deletes `acceptance/aoe4-build-order.spec.ts`, whose marker-label tests assert a text label on every marker; start from main after it merges)
- **On merge**: none
- **Source**: post-M4 end-to-end pass 2026-11-02 (backlog bullet "Chart marker labels") and SGS-077 review (backlog bullet "Chart tooltips show raw floats"); both verified against origin/main `b9481e3`.

## Context

Both defects sit in the one shared chart component, `SeriesChart` in `components/apps/aoe4-build-order/line-chart.tsx`, which draws all four charts (Units produced, Gather rates, Gathered resources, Floating resources). On the Knight/Longbow build every research marker (economy, unit tier, blacksmith) gets a text label, and `placeMarkers` stacks the labels into rows, so the 10:00 to 17:00 stretch makes a tall dense column above the plot. The `<Tooltip>` has no value formatter, so hovering shows recharts' raw float, for example `Food : 92.630712227254`.

## Scope

Paths relative to the repo root. Explored on origin/main `b9481e3`.

1. (respec 1) Marker labels (`components/apps/aoe4-build-order/line-chart.tsx`, `SeriesChart`). Only `age-up` markers keep a text label and a row in `placeMarkers`. Every other marker kind is still drawn as its solid coloured `ReferenceLine` (same `data-testid="chart-marker"`, `data-kind`, `data-label`, `data-at`, same `MARKER_COLORS` stroke, no dash) but with no `label` and with a `<title>` child whose text is `markerLabel(marker)` (`<label> <m:ss>`), the way the pinned age-up lines already carry a `<title>`. Rename `pinnedAgeUpMarkers` to the kind-neutral `ageUpMarkers` and use it for both the pinned lines and the markers passed to `placeMarkers`, so `rows` (the top margin and `data-label-rows`) and the measured-width `labelKey` count only age-up labels. Update its callers and its unit test for the rename. The marker legend (`MarkerLegend`) still receives every marker of the current run.
2. (respec 1) Tooltip values (`SeriesChart`'s `<Tooltip>`, plus one pure exported helper in `components/apps/aoe4-build-order/chart-rows.ts`, `formatChartValue`). Add a `formatter` to the `<Tooltip>` that passes each value through `formatChartValue`: a number is shown rounded to at most 1 decimal place with no trailing zero and never as `-0` (`92.630712227254` shows `92.6`, `40` shows `40`); any non-number value (`null`, `undefined`, a string) is returned unchanged, so a missing value (a pinned series past its run's end) shows as recharts shows it today. It applies to current and pinned series in all four charts. Keep recharts' `Name : value` layout and the `labelFormatter` (`m:ss` time) as they are.
3. Docs: `docs/aoe4-build-order.md`, the results paragraph under the four-chart table that says markers are "solid vertical lines labeled `<label> <m:ss>` ... stacked in rows by their measured width". Rewrite it for the end state: every marker is a solid vertical line in its kind colour; only `age-up` markers carry a text label `<label> <m:ss>` above the plot, stacked in rows by measured width; other kinds have no text label and show `<label> <m:ss>` as a hover title, with the marker legend naming their kind; tooltip values are shown rounded to at most 1 decimal place. Describe behavior only, no measured results. Grep the doc and `data/aoe4-build-order/README.md` for "label", "stacked", "tooltip" and fix any other statement this makes untrue.
4. (respec 1) Tests.
   - Unit, `components/apps/aoe4-build-order/chart-rows.test.ts`: one `it.each` table for `formatChartValue` (rows in the criteria below).
   - Unit, `components/apps/aoe4-build-order/line-chart.test.ts`: the existing "keeps only age-up markers, in order" test moves to `ageUpMarkers` and stays a table over mixed kinds; it is the unit pin for the filter that feeds `placeMarkers`. The `placeMarkers`, legend and pinned-legend tests keep their expected values.
   - Acceptance: new file `acceptance/aoe4-chart-readability.spec.ts` (do not add to or edit any other spec). Follow the style of `acceptance/aoe4-build-order-knight-longbow-page.spec.ts` and `acceptance/aoe4-build-order-pin-compare.spec.ts`: import the build JSON or select it by label, and use the `acceptance/helpers.ts` helpers `openPage`, `showTab` and `runSimulation` (read the `SimulationResult` from the `runSimulation` response for `markers`). Set the viewport to 1280 px wide. Read any layout rects in one `page.evaluate` (LESSONS.md).
   - Any existing test that asserts a text label on a non-age-up marker gets the new expected behaviour (no text, hover title); every other test keeps its expected values. The implementer lists every test it edits.

**Out of scope:** changing marker colours, kinds, the marker legend, the pinned age-up lines, or the `markers` API field; collapsing close markers into one label or showing labels on hover; per-chart tooltip precision; adding a gather-rate-per-villager toggle or step highlighting (separate backlog items); sticky run bar; the series legend; chart height or axis ticks; enlarging the hover target of a 1 px marker line (the pinned age-up lines already accept this).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] (respec 1) Acceptance, Knight/Longbow prebuilt (`ENG Knight/Longbow (King's Palace)`) run at 1280 px: in each of the four charts (`chart-units-produced`, `chart-gather-rates`, `chart-gathered-resources`, `chart-floating-resources`), the texts of `svg text.recharts-label` other than the chart's Y-axis label are exactly the response's `age-up` markers' `<label> <m:ss>` texts (as a set, each once), and the chart's `data-label-rows` is at least 1 and at most the number of `age-up` markers. Fails if any research marker keeps a text label, which is what passing every marker back to `placeMarkers` produces.
- [ ] (respec 1) Same run: every marker in the response, of every kind, is present once per chart as `svg [data-testid="chart-marker"]` with its `data-kind`, `data-label` and `data-at`, stroke `MARKER_COLORS[kind]` and no `stroke-dasharray`; for each non-age-up marker the line's parent group has no `text` element and has a `title` whose text is `<label> <m:ss>`.
- [ ] (respec 1) Acceptance, same Knight/Longbow run: hovering the centre of the plot area (`.recharts-cartesian-grid` box, rect read in one `page.evaluate`) of the Gather rates chart and of the Floating resources chart shows a visible tooltip (`.recharts-tooltip-wrapper`) whose text has no match for `/\d+\.\d{2,}/`. The implementer runs the spec once with the `<Tooltip>` `formatter` removed, confirms it fails, and records that in the report; if the centre point shows no raw value with 2 or more decimals, the spec hovers a different fixed fraction of the plot width that does, stated as a constant in the spec.
- [ ] (respec 1) `formatChartValue` unit table in `chart-rows.test.ts`: `92.630712227254` gives `'92.6'`, `40` gives `'40'`, `0.04` gives `'0'`, `-0.04` gives `'0'` (not `'-0'`), `1234.56` gives `'1234.6'`, `null` gives `null`, `undefined` gives `undefined`. Catches a formatter that uses `toFixed(1)` without dropping the trailing zero, leaves floats raw, emits `-0`, or turns a missing value into `0` or `NaN`.
- [ ] (respec 1) `ageUpMarkers` unit test in `line-chart.test.ts`: input mixing `age-up`, `economy`, `blacksmith` and `other` markers; expected only the `age-up` markers, in input order. `SeriesChart` passes `ageUpMarkers(markers)` (not `markers`) to `placeMarkers` and to the label-width measurement; the first criterion's acceptance case pins that wiring.
- [ ] The marker legend, pinned age-up dashed lines and their hover titles, and series legend behaviour are unchanged: the existing `line-chart.test.ts` legend and pinned-legend tests pass with their expected values.
- [ ] `docs/aoe4-build-order.md` describes the end state in Scope 3, and no statement in the doc or `data/aoe4-build-order/README.md` still says every marker carries a text label.
- [ ] No file under `acceptance/` other than `acceptance/aoe4-chart-readability.spec.ts` is added or edited.
- [ ] `npx tsc --noEmit`, `npm run lint:dup`, `npm test` and `npm run acceptance` pass. The implementer records, in the report, a 1280 px screenshot of the Knight/Longbow Gather rates chart after the change (label column height before and after is a measured result: report only, not in docs).
- [ ] No INVARIANTS.md regressions

## Open questions

None.

## Re-spec 2026-11-04

- Underspecified: the marker-label approach and tooltip precision were open owner questions; the style-reference spec was not on the gate's base; criteria 1 and 5 asked Playwright to recompute `placeMarkers` rows; criterion 3 named no build, hover point or non-number rule.
- Changed: owner answers folded in (only age-up markers labelled, research markers are unlabelled lines with a hover title plus the kind legend; at most 1 decimal on every chart); `pinnedAgeUpMarkers` renamed to `ageUpMarkers` and used as the filter feeding `placeMarkers`; acceptance now asserts the label set equals the age-up texts and 1 <= `data-label-rows` <= age-up count; tooltip check uses the Knight/Longbow prebuilt hovered at the plot centre with a mutation run; `formatChartValue` table adds `null`/`undefined` pass-through; stale BACKLOG line numbers and the manager follow-up dropped (those bullets are no longer in BACKLOG.md).
- No branch work exists; nothing carries over.
