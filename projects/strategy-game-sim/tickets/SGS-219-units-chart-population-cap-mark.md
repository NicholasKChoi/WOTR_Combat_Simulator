# SGS-219: Show the population cap mark on the Units produced chart too

- **Type**: Chore
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: medium
- **Risk**: standard
- **Invariants**: AoE4 Build Order Simulator (A1, A2, A3; their `Paths:` match `components/apps/aoe4-build-order/**`; no simulation or data file changes, so none is at risk)
- **Unverified assumptions**: none (the mark is the existing `ReferenceLine` that `SeriesChart` already draws on the Population chart; this ticket only passes it to a second chart, and the Playwright layer exercises the real SVG)
- **LOC estimate**: 5 (`results.tsx` one `timeMark` entry on the `chart-units-produced` record; page-help text ~2; business logic only, docs and tests excluded)
- **Depends on**: none
- **On merge**: none
- **Source**: owner answer to Q155 (2026-11-24); BACKLOG.md item "(standalone chore) AoE4: show the population cap mark on the units produced chart too"

## Context

The `Population cap m:ss` mark that SGS-216 and SGS-217 added appears only on the Population chart; the owner wants it on the Units produced chart as well (Q155). `SeriesChart` already takes an optional `timeMark` and `results.tsx` supplies it per chart through the `charts` record, so this is the same page-side mark (not a marker kind, current run only) on one more chart. Per PROJECT.md Decisions, a `(standalone chore)` stays a Chore though it adds a small visible mark.

## Scope

- `components/apps/aoe4-build-order/results.tsx`: the `charts` record entry `chart-units-produced` gains `timeMark: populationCapMark` (the same function the `chart-population` entry uses, so both charts mark the same time). The mark follows the chart in both of its views (`units` and `buildings`), because the view toggle only changes the series and the y label. `line-chart.tsx`, `chart-markers.ts`, `result-series.ts` and the zoom modules stay unchanged: the in-window rule, label side, colour and `markerView` independence already hold per chart. Check at 1200, 1280 and 1800 px, in both views, whether the mark's bottom label overlaps upgrade-dot tier text (`units` view) or an offset line (`buildings` view). An overlap is reported only (the owner decides; no `SeriesChart` change in this ticket). The stop condition is the label being clipped by the plot or the chart body, or drawn on the x-axis line: then change nothing, leave the branch without the workaround, and report it as a blocker with the measured boxes.
- Docs and help made untrue (Scope names the statement; the implementer writes the replacement against the code built):
  - `docs/aoe4-build-order-ui.md`: the Population chart paragraph sentence "No other chart draws a mark" (the Units produced chart now draws it too, in both views; the Population chart keeps its mark), and the statements that describe the mark as the Population chart's only (grep the file for `population cap mark`, `chart-time-mark`, and `Population cap`; examples: the paragraph at the Population chart, the Markers-control sentence "The population cap mark is not a marker", the Zoom sentences on the mark's window and label side, the stored-chart-layout and chart-table sentences if they tie the mark to one chart). Where the mark is described in one place, say it is drawn on the Units produced and Population charts and that the rules (current run only, not a marker, not hideable, zoom window, not focusable) hold on both.
  - `docs/aoe4-build-order-format.md` Outputs: the sentence that says the population graph carries "a vertical mark at `populationCapReachedAt`" (the units-produced graph now carries it too); the data-flow diagram of graphs under "result" if it shows the mark on the population graph only.
  - `docs/aoe4-build-order.md`: the overview names population among the graphs; edit only if the code built makes it untrue.
  - `components/apps/aoe4-build-order/page-help.tsx` Charts section (`help-charts`): the Population chart paragraph says its red line shows when the cap was reached; the Units paragraph (or that paragraph) must now say the same line also appears on the Units chart. Keep the seven-section structure; wording is the implementer's.
  - `ARCHITECTURE.md` row "AoE4 chart markers and zoom": it already says it does not state which chart carries the mark; expected to need no edit, confirm.
- Tests that depend on the change (rules; examples marked, since a sibling may add more first):
  - Acceptance: `acceptance/aoe4-population-cap-mark.spec.ts` asserts that no chart other than Population has a `chart-time-mark` (examples: the `CHART_IDS.filter((chart) => chart !== POPULATION)` loop and the `for (const id of CHART_IDS) ... toHaveCount(0)` loop for the unreached run). A test of the default 1200 s run moves to "Population and Units produced each show exactly one mark with the same `data-at`, no other chart shows one"; a test of a run whose cap is not reached still shows none on every chart. Every other case in that spec keeps its assertion and its Population-chart target. Search every spec in `acceptance/` and every unit test that names `chart-time-mark`, `timeMark`, or `Population cap` (`git grep -n "chart-time-mark\|timeMark\|Population cap" -- acceptance components`) and move each that assumes the mark is Population-only.
  - Add Playwright coverage in that same spec (no new file): Units produced shows the mark in both views, hiding every marker kind leaves it, and zooming past its time hides it on that chart without hiding the Population chart's (each chart zooms on its own).
  - Unit: no unit case. The `charts` record is local to the `results.tsx` component, there is no results test file, and the unit layer renders no recharts SVG; the Playwright cases above cover the change.
  - Existing acceptance specs that read the Units produced chart may see an added `chart-time-mark` line or a new `text.recharts-label` that they count or compare. The rule covers every spec that reads the Units chart by the literal id `chart-units-produced`, by a `UNITS` constant, or by `CHART_IDS` or an index into it. Examples (not a closed list): `aoe4-marker-labels.spec.ts` and `aoe4-chart-readability.spec.ts` (loops over `CHART_IDS` reading `svg text.recharts-label` and `data-label-rows`), `aoe4-build-order-pin-compare.spec.ts` (a step reads `.recharts-label` on every chart, near line 433), `aoe4-chart-layout.spec.ts` (`UNITS` from `CHART_IDS`; a step finds a chart label by text, near line 483), `aoe4-marker-control-sticky.spec.ts` (`FIRST` is `CHART_IDS[0]`, the Units chart), `aoe4-units-chart-upgrade-dots.spec.ts`, `aoe4-chart-zoom.spec.ts`, `aoe4-chart-views.spec.ts`. Find them with `git grep -n "CHART_IDS\|chart-units-produced\|UNITS" -- acceptance`. The implementer runs each such spec file (acceptance setup first, one file at a time, under `timeout`), fixes only the failures caused by the new mark, and lists every file run with its result and every spec edited.

**Out of scope:** the simulator and any `lib/` change; a pinned run's mark; a legend entry, marker kind or hide toggle for the mark; a mark on Gather rates, Gathered resources or Floating resources; changes to `line-chart.tsx`, `chart-markers.ts`, `chart-zoom.ts`, `use-chart-zoom.ts`, `compare.ts`; the mark's colour, label text or label side rule.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] With the cap reached (the default build at 1200 s), the Units produced chart shows exactly one `chart-time-mark`, with `data-at` equal to the API's `populationCapReachedAt` and the label `Population cap m:ss` for that time, in both the `units` and `buildings` views; the Population chart still shows its one mark with the same `data-at`
- [ ] A run whose cap is not reached (600 s) shows no mark on any chart
- [ ] Gather rates, Gathered resources and Floating resources show no mark (a test fails if the mark is passed to every chart)
- [ ] On the Units produced chart the mark behaves as on Population: hiding every marker kind, hovering a Markers entry, pinning a run or a run with no markers leaves it drawn, and a pinned run draws no mark of its own; zooming that chart past the mark's time stops drawing it there while the Population chart (zoomed separately) keeps its own
- [ ] (respec 1) With the cap reached, the Units produced chart's `data-label-rows` equals the row count placed for its marker labels alone; its marker lines, series paths and upgrade dots equal those of the same run with the mark absent; the mark label is the only extra `text.recharts-label` and is not counted in `data-label-rows`
- [ ] `docs/aoe4-build-order-ui.md` no longer says the Population chart is the only chart that draws a mark, and describes the mark on the Units produced chart; `docs/aoe4-build-order-format.md` no longer ties the mark to the population graph alone; the Charts section of `PageHelp` says the red line also shows on the Units chart (a test over the rendered help text in `page-help.test.ts`, which still shows seven sections) (searches scoped to those doc paths, no match count)
- [ ] Every acceptance spec edited keeps asserting what it asserted before except the Population-only expectation, and every spec file listed under Scope's acceptance rule passes, with the run list in the implementer's report
- [ ] Pre-existing unit tests keep their assertions
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-24

- Underspecified: the acceptance-spec rule matched only the literal chart id, so specs reading the Units chart through `UNITS` or `CHART_IDS` were missed; the "unchanged content" criterion had no baseline; the overlap stop condition and the unit-test bullet were vague.
- Changed: the acceptance rule and examples, criterion on `data-label-rows` and label count (tagged respec 1), the concrete stop condition, and the no-unit-case statement.
- Branch work: none yet.

## Rework 1 - 2026-11-25 (review)

Gate: review (REQUEST CHANGES, report reports/SGS-219-review-6.md). Tip passed by no gate yet; reviewed tip 49e116a42b563f65d692f27e5ca0abf1d288833a. Production code and docs are correct; all findings are in `acceptance/aoe4-population-cap-mark.spec.ts`.

### Findings

- `acceptance/aoe4-population-cap-mark.spec.ts:122`: the pre-existing hide/hover/pin test's exact `pinned:population` `toHaveCount(1)` was weakened to "first `pinned:*` visible" when looped over both charts (criterion 7 forbids this).
- `:117`, `:125`: mark `getBoundingClientRect().left` compared with a bare `expect(await ...)`; LESSONS.md requires `expect.poll` or `toPass()`.
- Several added assertions have no failing mutation break (lines below).

### Required fixes

- [x] `:122`: map each chart to its own pinned line key (`PINNED_LINE`, Population `pinned:population`, Units a key the default build draws, confirm against `unitLineSeries` `key: u.baseId`), assert `path[data-series="<key>"]` `toHaveCount(1)` per chart. Break: no pinned lines on the Units chart (`results.tsx:141`) must fail it.
- [x] `:117`, `:125`: use `await expect.poll(() => mark.evaluate((el) => el.getBoundingClientRect().left)).toBe(before)`.
- [x] Run these breaks in a `mutate-sgs-219` scratch and record each with the line it fails on; rewrite or delete any assertion no break can fail: `:77/:78/:80/:81` (Units row: `line-chart.tsx:281` stroke, `:282` strokeWidth, `:285` data-at, `:284` data-label); `:102` (view-dependent mark time at `results.tsx:73`) and `:103` (`:287` label break, name the test); `:119` (Units chart ignores `markerView.hidden`); `:124` (drop label while pinned, `line-chart.tsx:286`); `:133/:134` (shared zoom window across charts, or state why `:133` is kept); `:167` (a break failing it alone, or delete it); `:177` (mark line drawn but label removed, `line-chart.tsx:286`). Data-condition guards at `:114`, `:169`, `:170` are exempt.

## Rework 2 - 2026-11-25 (review)

Gate: review (REQUEST CHANGES, report reports/SGS-219-review-8.md). Reviewed tip 65026066fb27e560c2c1cf6cd6a45c75715dbb54. Review-6 approved production code and docs (byte-identical to 49e116a); the Rework 1 fixes are in. What is missing is current mutation evidence: two tests changed after their breaks were recorded.

### Findings

- Hide/hover/pin test in `acceptance/aoe4-population-cap-mark.spec.ts` changed in `b0f3fa7`, after implementer-5's breaks; implementer-7 covers only `:120`, `:123`, `:125`. Without a break: Units row `:117`, `:118`, `:121`, `:124`, `:126`; Population row `:118`, `:126`.
- "Adds only its own label" test changed in `6502606`, after both records. Without a break: `:174`, `:177` to `:182`.

### Required fixes

- [ ] At the current tip, in a `mutate-sgs-219` scratch, re-run implementer-5's breaks for the hide/hover/pin test (the three `line-chart.tsx:278` hide variants: hover, hidden kinds, pinned; the two `line-chart.tsx:280` x-shifts: hover, pin) and record the spec line each fails on, covering every line listed above.
- [ ] At the current tip, re-run for the "adds only its own label" test: delete-Units-`timeMark`, the Units-only empty-label break, and implementer-5's rows, marker, path, dot and label breaks; record each failing line, covering `:174` and `:177` to `:182`.
- [ ] Rewrite or delete any assertion no break can fail. No production code change is expected. Record the tree-record hash before and after the scratch.
