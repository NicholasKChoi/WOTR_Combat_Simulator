# SGS-216 review 6

- Ticket: SGS-216 Add a Population chart with a population cap mark (Feature, risk standard, milestone M13)
- Branch: `sgs-216-population-chart-cap-mark`, tip `91c8dca60e406e38b3775027aa0409c0f6196a5b`, base `origin/main` (7d74800). Not stacked.
- Mode: first review (full branch). Implementer record: `SGS-216-implementer-5.md` (the only implementer report). No acceptance-test report exists, so every test in the diff counts as the implementer's.
- **Verdict: REQUEST CHANGES**

## Blocking findings

1. `components/apps/aoe4-build-order/line-chart.tsx:286-292` - correctness - The population cap mark's bottom label sits on the x-axis line, and the axis line runs through the descenders of the "p"s in "Population cap". Measured in the running page: at 1200 px the label text box is 775.8 to 788.8 and the axis line is at 785.8. At 1800 px the box is 775.4 to 788.4 and the line is at 785.4. The same happens in a zoomed window at 1200 px (box 819.4 to 832.4, line 829.4). Screenshots `label-1200.png`, `label-1800.png` and `label-zoomed-1200.png` (4x crops) show the grey axis line drawn through the red text. Why it matters: this is visible clipped or overlapping text in UI the diff adds, so it is always blocking. The implementer's report notes the 2 px overhang but calls it "no overlap". Direction: lift the label off the axis without changing its horizontal rule. Add `dy: -4` to the `label` object of the time-mark `ReferenceLine`, beside `offset: 0`. That moves the 13 px box to 771.8 to 784.8 at 1200 px, clear of the line at 785.8, and the label is still at the plot bottom. Do not use `offset`, because it also shifts the text sideways and changes the edge fit. Re-check at 1200, 1280 and 1800 px that the label box bottom is above the x-axis line's y.

2. `docs/aoe4-build-order-ui.md:544` - contract (text) - The sentence says "the label to the right of the line unless it would pass the plot's right edge, and then to its left". The code decides the side from `estimateLabelWidth`, 8 px per character, not from the drawn width (`line-chart.tsx:288`). For `Population cap 18:15` the estimate is 160 px and the drawn text is about 113 px. So when a mark sits roughly 113 to 160 px before the right edge, the label goes left even though it would not pass the edge, and the sentence is false there. Direction: replace that clause, and only that clause, with exactly: "the label to the right of the line unless its estimated width (8 px per character, wider than the drawn text) would pass the plot's right edge, and then to its left". Facts the replacement keeps: the label is right of the line by default, it moves left of the line otherwise, and the test is against the plot's right edge. Only the measure is the defect. (Measuring the label instead is also acceptable, but then the doc may stay as is.)

3. `components/apps/aoe4-build-order/result-series.test.ts:414-416` - test - "is null when the cap was not reached" has no failing break in the implementer's mutation record. The `!at` break still returns `null` for a `null` cap, and "always null" passes it. Direction: run and record a break that returns a mark for a null cap. For example, in `result-series.ts:137` change `run.populationCapReachedAt === null ?` to `run.populationCapReachedAt === undefined ?`, which returns `{ at: null, label: 'Population cap' }`. Confirm it fails on `toBeNull()`.

4. `components/apps/aoe4-build-order/chart-layout.test.ts:88-93` (`moveChart` "returns an equal layout for down at the end", row `['down', population]`) and `:122-127` (`moveChartByKey` "returns null for down at the end", row `['down', population]`) - test - These changed rows have no failing break in the record:
   - With the "id dropped from `RESULT_CHART_IDS`" break, `population` is `undefined`, so `indexOf` returns -1. `moveChart` returns an equal layout and `moveChartByKey` returns `null`, so both rows still pass.
   - The "id prepended" break would fail them, but it is recorded only against "ends the default layout ...".

   The record also says only "many rows, including ..." for the id-dropped break, so no changed row of this file is matched item by item. Direction:
   - Record the prepended break (`chart-layout.ts:3` with `'chart-population'` first) failing each of these two rows.
   - In the newest report, name each changed row of `chart-layout.test.ts` with the break it failed on: "round-trips a valid layout unchanged", "drops unknown and duplicate ids ...", "drops key-results and unknown ids from order", the six `moveChart` swap rows, the `moveChartByKey` second-move test, the six `moveChartTo` rows, and "normalises a stored layout that misses an id".

5. `acceptance/aoe4-chart-layout.spec.ts`, `acceptance/aoe4-chart-row-feedback.spec.ts`, `acceptance/aoe4-chart-views.spec.ts`, `acceptance/aoe4-results-split.spec.ts`, `acceptance/aoe4-build-order-step-band.spec.ts` - test - These acceptance specs were edited, but the record says "no acceptance spec under check". common.md (Processes) requires mutation-checking an acceptance spec file the implementer edited, so none of the changed items has a break. The changed items:
   - `aoe4-chart-layout.spec.ts`: every `expectLayout` and stored-order list extended with `POPULATION`; the `[POPULATION, 'ArrowDown']` last-chart row; the `a layout missing ids` stored case; the alignment `{ count: 5, cells: [4,4,4,4,4], overflowing: [0,0,0,0,0] }`; the `[UNITS, GATHERED, FLOATING, POPULATION]` body-visible list.
   - `aoe4-chart-row-feedback.spec.ts`: the new slot row `[before.groups[POPULATION].bottom + 4, 4]`; DROP_CASES `below the last chart` (slot 4); the status text `of ${CHART_IDS.length}`; the `others` lists; the `readOrder` list.
   - `aoe4-chart-views.spec.ts`: the `chart-population: 'Population'` y-label entry.
   - `aoe4-results-split.spec.ts` and `aoe4-build-order-step-band.spec.ts`: the "five charts" titles.

   Note that the specs take their ids from `RESULT_CHART_IDS`, so reordering or dropping the id in `chart-layout.ts` moves the expectations with it and is not a valid break. Direction: in a `mutate-sgs-216` scratch with `commands.acceptanceSetup`, run each edited file alone under each break and record which items fail:
   - Break (a): render no Population chart. In `results.tsx:125` change `layout.order.map(` to `layout.order.filter((id) => id !== 'chart-population').map(`. Before the break the page shows 5 chart row groups; after it, 4. Expected failures: the alignment count, the `expectLayout` lists, the last-chart ArrowDown row, the slot-4 rows, the y-label entry and the five-chart titles.
   - Break (b): drop the last chart's box from the drop-slot rectangles. In `use-chart-drag.ts:19` change `latest.current.order.flatMap(` to `latest.current.order.slice(0, -1).flatMap(`. The slot below Population then reads 3 instead of 4. Expected failures: the new slot row and the `below the last chart` drop case.
   - Break (c): announce a fixed count. In `results.tsx:87` change `of ${layout.order.length}` to `of 4`. Expected failure: the status-text assertion. Before the break it reads `of 5`; after, `of 4`.

   An item that no break fails must be rewritten or deleted.

## Spec gaps (NEEDS_SPEC)

None.

## Acceptance criteria

| Criterion | Verdict | Evidence |
|---|---|---|
| `populationSeries` one series, key/name, values `spawnedPopulation`, distinct values | pass | `result-series.ts:134`; test uses `[6, 31, 77]` against a fixture whose other arrays are `[0, 5, 10]`, `[0, 0, 0]`; `run.times` break recorded |
| `populationCapMark` null / reached incl. `at` 0 | pass (code), test record incomplete (finding 3) | `=== null` check at `result-series.ts:137`; `!at` break fails the 0 row |
| `timeMarkLabel` equals `markerLabel` m:ss | pass | four `markerLabel` comparison rows plus the `18:15` row |
| `timeMarkLabelPosition` rule, `at` 0, exact end, origin, non-strict | pass | `chart-markers.ts:49-51`; 8 rows; strict and origin-ignored breaks recorded |
| in-window decision (`timeMarkDrawn`), edges included | pass | `line-chart.tsx:72-73` uses the existing `inWindow`; 6 rows plus null test; breaks recorded per row |
| `TIME_MARK_COLOR` `#a52a2a`, 3:1, not a marker/palette colour | pass | `chart-markers.test.ts` four assertions, each with a break |
| `RESULT_CHART_IDS` ends with population; default last, expanded; four-id layout appends, keeps collapsed; stored position/state kept | pass (code), test record incomplete (finding 4) | `chart-layout.ts:3`; `normalizeChartLayout` unchanged appends missing ids |
| Help names the Population chart and cap line; seven sections | pass | `page-help.tsx:104-107`; test in `page-help.test.ts`; existing seven-section test still passes |
| Running page: one mark at API cap, label `Population cap 18:15`, none at 600 s, no other chart, hide-all/pin/hover keep it, zoomed past not drawn | pass on behaviour, fail on layout (finding 1) | Inspection: API `populationCapReachedAt` 1094.9413171060362 equals `data-at` at 1200/1280/1800; text `Population cap 18:15`; 600 s API cap `null`, 0 marks; other charts 0 marks; all 3 Markers entries off, hover first entry, pinned: mark unchanged at x 1142 (1280); zoom 119-480 s: 0 marks; zoom 720-1165 s: drawn. Label overlaps the x-axis line at all widths |
| Other charts draw as before, `data-label-rows` unchanged | pass | other four charts 0 `chart-time-mark`, `data-label-rows` 1 each as before; the mark is not in `placeMarkers` |
| Edited acceptance specs keep their assertions; listed spec files pass with run list | pass on the run list; mutation record missing (finding 5) | Implementer ran 25 files, all pass; edits are id-list/count changes only (legend-pressed filters out the one-series chart, keeping the multi-series assertion for the other four) |
| Docs: no "four charts" / "out of four" / "other two charts"; Population chart, mark, zoom and Markers behaviour; format doc; ARCHITECTURE row | pass except one clause (finding 2) | `git grep` over docs, README, ARCHITECTURE, page-help finds no stale four-chart text; `docs/aoe4-build-order.md:16` already names population |
| No INVARIANTS.md regressions | pass | see below |

## Invariants touched

- A1 (game numbers from data): holds. No simulation code changed. The 2 px width, the colour and the font size are page styling.
- A2 (resources never negative): holds. No simulation change.
- A3 (determinism): holds. No simulation change and no randomness or clock.
- S1 (apps independent): holds. Imports stay inside `components/apps/aoe4-build-order/`.
- S2 and S3: not affected.

## Contract and scope

- Names match design M13 C2 and C4 and the ticket: `ChartTimeMark`, `TIME_MARK_COLOR`, `timeMarkLabel`, `timeMarkLabelPosition`, `populationSeries`, `populationCapMark`, `timeMark` prop and record field, `chart-population`, `chart-time-mark` with `data-at` and `data-label`.
- Only the current run's mark is passed (`results.tsx:144`). The pinned run gets no mark, and its population line draws as `pinned:population` (seen in the DOM).
- Out of scope respected: no `lib/`, `openapi.json`, `compare.ts`, `chart-zoom.ts` or `use-chart-zoom.ts` change; no marker kind; no legend entry.
- No open question was answered with an invented constant.
- Pre-existing tests edited (`chart-layout.test.ts` and the acceptance specs) are covered by the ticket's respec-1 rules.

## Lint, build, unit

- `npx tsc --noEmit && npm run lint:dup`: clean, 0 clones.
- `npx next build`: passed.
- `npx vitest run components/apps/aoe4-build-order`: 36 files, 1087 passed.

## Bot reconciliation

`reviewBot.cli` is empty, so no review bot ran. No `rulesFile`.

## UI inspection

- Served the task checkout with `npx next dev -p 3871` through serve.sh. Server and Playwright ran in one wrapper script, because the sandbox gives each command its own network. The server was stopped afterwards (`serve.sh stop`: port free).
- Views and states loaded:
  - default build (1200 s) at 1200, 1280 and 1800 px;
  - at 1280 px: hover on the first Markers entry, all 3 Markers entries hidden, pinned run, zoom to 119-480 s (before the cap), zoom to 720-1165 s (around the cap), and a 600 s run;
  - at 1200 px: a pointer-down on the mark label followed by a drag.
- Checks:
  - Horizontal overflow: 0 everywhere.
  - Clipped overflow: only the existing visually hidden `chart-reorder-help`, which is clipped by design.
  - Mid-word wraps: none.
  - Mark label vs other text: no overlap with tick labels or marker labels.
  - Mark label vs x-axis line: overlaps at every width (finding 1).
  - Mark line: stroke `#a52a2a`, width 2, solid, no tabindex.
  - Label anchor at the default build: `end` (left of the line) at all widths, which is correct for this position.
  - A press on the mark label started a selection (`chart-zoom-selection` count 1) and zoomed the chart to 583-931 s, which matches D18.
- Screenshots read: `default-1200.png`, `pinned-1280.png`, `zoomed-around-cap-1280.png`, and the 4x crops `label-1200.png`, `label-1800.png`, `label-zoomed-1200.png`. They were in the removed review scratch.

## Non-blocking notes

- `chart-markers.ts:50` repeats the `at + width <= end` fit test from `placeMarkers` (`chart-markers.ts:66-68`). A shared `fitsRight(at, width, end)` helper would keep the two rules from drifting. The design asks for the same rule, so this is not blocking.
- `timeMarkLabelPosition` has no pinned-left fallback like `placeMarkers` has. In a very narrow zoom window, a mark near the left edge whose label fits on neither side would draw its label over the y axis. The design specifies the two-position rule, so this is a possible follow-up.
- `acceptance/aoe4-legend-pressed-state.spec.ts:25` filters on the literal `'chart-population'`, where the rest of the spec uses `CHART_IDS`. A named constant from the destructure would match the siblings.
- The UI doc's phrase "a pinned run ... leaves it drawn where it was" is true for its time. A pinned run with a longer horizon rescales the x axis, so the pixel position moves with every line.
- The help text calls the `#a52a2a` line "red". It renders as a dark red, which is acceptable.

## Coverage

- Reviewed all 20 changed files: the code, the unit tests, the 6 acceptance specs, and the 3 docs plus ARCHITECTURE.md.
- Also read `chart-layout.ts`, `use-chart-drag.ts`, `results.tsx`, `line-chart.tsx` in full, the design M13 C2 and C4 sections, LESSONS, and the REPO review checklist (Every diff, AoE4 build order).
- The LSP tool was not available. Callers of `SeriesChart` were checked by reading `results.tsx`, its only caller.
- Not run, by role: acceptance specs. They were judged by the implementer's run list.
