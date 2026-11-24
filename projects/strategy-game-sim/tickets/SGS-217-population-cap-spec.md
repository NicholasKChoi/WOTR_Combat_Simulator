# SGS-217: Add a Playwright spec for the Population chart and its cap mark

- **Type**: Chore
- **Component**: aoe4-build-order
- **Milestone**: M13
- **Priority**: medium
- **Risk**: low
- **Invariants**: none (the only file is a new `acceptance/` spec; no INVARIANTS.md `Paths:` glob matches it)
- **Unverified assumptions**: recharts draws the `ReferenceLine` label as SVG text inside the chart's `[data-testid="chart-time-mark"]` group, and forwards `data-at` and `data-label` to it (the existing `chart-marker` specs read the same way); label text position after a zoom redraw is settled only after recharts' redraw, so the spec reads layout in one evaluate under `toPass`. Only the browser run exercises both.
- **LOC estimate**: 0 business logic (one new spec of about 150 lines; no production code changes)
- **Depends on**: SGS-216
- **On merge**: none
- **Source**: M13 criteria M13.2 and M13.3 (Playwright covers the chart marker); `design/M13.md` revision 2, contracts C2 and C4, Defaults D9, D16 to D18; `plans/M13-20261124.md` outline C

## Context

SGS-216 adds a Population chart (`chart-population`) and one page-side vertical mark on it (`chart-time-mark`, attributes `data-at` and `data-label`, visible label `Population cap m:ss`) at the run's `populationCapReachedAt`. Its unit tests cannot see the recharts SVG, so nothing yet checks in a browser that the mark is drawn at the API's instant, only on the Population chart, whatever the Markers control hides, never for a pinned run, and only while its time is inside a zoom window. This ticket adds that coverage and changes no behavior the owner sees. Branch: `sgs-217-population-cap-spec`.

## Scope

New file `acceptance/aoe4-population-cap.spec.ts`. Exemplar `acceptance/aoe4-chart-views.spec.ts` (REPO.md exemplar) and, for zoom drags, `acceptance/aoe4-chart-zoom.spec.ts` (`press`/`dragTo`/`select`, `zoomOf` over `data-zoom-from`/`data-zoom-to`, `chart-zoom-reset`). Use the helpers in `acceptance/helpers.ts` (`openPage`, `waitForRun`, `plotPoint`, `readLayout`, `CHART_IDS`, `MIN_SUPPORTED_VIEWPORT`, `SPLIT_VIEWPORT`, `WIDE_VIEWPORT`, `setDurationInPlace`, `bodyDuration`) instead of local copies; the spec may add a helper to `helpers.ts` only if two or more specs would use it. Names are the SGS-216 contracts: test ids `chart-population`, `chart-time-mark`, `chart-marker-legend-item`, `pin-run`, `compare-row` (`data-key="pop-cap"`), `duration-seconds`; attributes `data-at`, `data-label`; label text `Population cap m:ss` (m:ss from `formatMinSec` of the API's `populationCapReachedAt`). Read layout values (rects, label box, line x) in one `evaluate` under `toPass`/`expect.poll` (LESSONS.md). Cases, each its own test (the three viewport cases are rows of one test table):

1. Default page (the first prebuilt build, ENG 1TC, 1200 s, auto-run on load): read the run from the simulate response; first assert `populationCapReachedAt` is non-null. `chart-population` has exactly one `chart-time-mark` whose `data-at` equals that value, `data-label` is `Population cap`, and whose visible label reads `Population cap ` plus its m:ss. The page has exactly one `chart-time-mark` in total, and each of the other charts in `CHART_IDS` has none. Its line is drawn at the x the chart's time axis gives that instant (compared against the plot extent, as the existing marker specs do).
2. No cap kind elsewhere: no `chart-marker-legend-item` on the page has a `data-kind` or text that names the population cap (the mark is not a marker kind), and the Markers control has no entry for it.
3. Not reached: with the duration set to 600 s (first assert the response's `populationCapReachedAt` is `null` and `bodyDuration` is 600), `chart-population` is still drawn and no `chart-time-mark` exists anywhere.
4. Viewports 1200, 1280 and 1800 px wide (`MIN_SUPPORTED_VIEWPORT`, `SPLIT_VIEWPORT`, `WIDE_VIEWPORT`), default page: the mark's label box lies entirely inside the plot's horizontal extent (so a label that would pass the plot end sits on the other side of the line), sits in the lower half of the plot, and the page has no horizontal overflow. Pin the label side SGS-216's report records for these widths as an observed value only if that report names one; otherwise state the property above.
5. Markers control: with every kind hidden through its `chart-marker-legend-item` toggles (first assert at least one kind was pressed, so the case hides something), the mark is still drawn at the same `data-at` and x. Hovering one Markers entry neither hides nor moves it (x read before and after in one evaluate).
6. Pinned run: pin the default run, then set the duration to 600 s. The current run has no cap, so `chart-population` has no `chart-time-mark` although the pinned run reached it; the Key results table (`compare-row` `data-key="pop-cap"`) still shows the pinned run's time as its m:ss (first assert the pinned run's value is non-null). Pinning with the default duration unchanged keeps the single mark for the current run and draws no second one.
7. Zoom (D16 to D18), on `chart-population` at `WIDE_VIEWPORT`: (a) a drag that selects a window not containing the mark's time (read `data-zoom-from`/`data-zoom-to` and first assert the cap time is outside it) leaves no `chart-time-mark` on that chart; `chart-zoom-reset` brings it back at the same `data-at`. (b) a drag whose window contains the cap time with plot room after it (assert from the read window that the cap time is inside and that the label would fit right of the line at the measured label width) keeps exactly one mark, its x equals where an axis spanning exactly the window puts that time, and its label is on the right of the line inside the plot, which differs from the unzoomed default, so a label side judged against the whole run instead of the window fails. (c) a pointer-down on the mark's bottom label starts a zoom selection (`chart-zoom-selection` appears while the button is down), as anywhere in the grid.

Tests that depend on the change: none exist for these names (`git grep -n "chart-time-mark\|chart-population" -- acceptance` finds only specs SGS-216 edits for the fifth chart); this ticket edits no existing spec. SGS-216 owns the updates to specs that assumed four charts.

**Out of scope:** any production code, unit test, doc or existing acceptance spec; the `pop-cap` row's wording; the simulator past 200 (SGS-215); a pinned run's mark; asserting pixel values of the label position other than the properties above.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] The spec runs green against the SGS-216 branch when run alone (acceptance setup first, then the single file under `timeout`), and the implementer records the result and the observed label sides at 1200, 1280 and 1800 px in the report
- [ ] Default page: `chart-population` holds exactly one `chart-time-mark` whose `data-at` equals the API's `populationCapReachedAt` (asserted non-null first), `data-label` is `Population cap`, visible text is `Population cap` plus that instant's m:ss; no other chart and no other place on the page has a `chart-time-mark`; a test fails if the mark is drawn on another chart or at a wrong instant
- [ ] No Markers-control entry names the population cap, and with a 600 s run (API value asserted `null` first) no `chart-time-mark` exists while `chart-population` is still drawn
- [ ] At 1200, 1280 and 1800 px the label box is inside the plot's horizontal extent and the page has no horizontal overflow; a test fails if the label is clipped past the plot end
- [ ] With every marker kind hidden the mark is still drawn at the same instant, and hovering a Markers entry leaves it in place; a test fails if hiding or hovering removes or moves it
- [ ] With a pinned run that reached the cap and a current run that did not, no mark is drawn while the `pop-cap` Key results row shows the pinned time; with both reaching it, one mark only, for the current run
- [ ] Zoomed with the cap time outside the window the mark is not drawn and returns on reset; zoomed with it inside the mark is drawn at the window-relative x with its label on the side the window gives room for; a pointer-down on its label starts a selection. A test fails if the window check is dropped, if the label side ignores the window origin, or if the label blocks selection
- [ ] Each case that depends on data first asserts the condition it relies on (cap reached or not, cap time inside or outside the window, at least one marker kind present)
- [ ] The new spec adds no production code, edits no existing test, and every existing acceptance and unit test keeps its assertions
- [ ] No INVARIANTS.md regressions

## Open questions

none
