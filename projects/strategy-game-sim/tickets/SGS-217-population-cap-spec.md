# SGS-217: Extend the population cap mark spec with the cases it does not cover

- **Type**: Chore
- **Component**: aoe4-build-order
- **Milestone**: M13
- **Priority**: medium
- **Risk**: low
- **Invariants**: none (the only file is an existing `acceptance/` spec; no INVARIANTS.md `Paths:` glob matches it)
- **Unverified assumptions**: recharts draws the `ReferenceLine` label as SVG `text.recharts-label` inside the chart and forwards `data-at` and `data-label` to the `chart-time-mark` line (the existing population cap spec reads it the same way); the label and line position after a zoom redraw settle only after recharts' redraw, so the spec reads layout in one evaluate under `toPass`. Only the browser run exercises both.
- **LOC estimate**: 0 business logic (about 100 added spec lines in one existing file; no production code changes)
- **Depends on**: SGS-216
- **On merge**: none
- **Source**: M13 criteria M13.2 and M13.3 (Playwright covers the chart mark); `design/M13.md` revision 2, contract C2, Defaults D9, D16 to D18 and the Behavior rules rows "pinned", "zoom", "Markers control", "pointer"; `plans/M13-20261124.md` outline C

## Context

SGS-216 adds the Population chart (`chart-population`) with one page-side vertical mark (`chart-time-mark`) at the current run's `populationCapReachedAt`, and its PR already ships `acceptance/aoe4-population-cap-mark.spec.ts`, which checks the default page's single mark (API time, `data-label`, m:ss label), no mark on other charts, no mark for a 600 s run, the mark surviving hidden kinds, pinning and hover, the mark gone for a zoom window that ends before it and back after a reset from an inside window, and the label inside the grid's right edge and above the x axis at 1200, 1280 and 1800 px. Still unchecked in a browser: that the Markers control gains no cap entry (D17), that a pinned run's cap draws no mark while the Key results `pop-cap` row shows it (D9), where the line and label sit inside a zoom window that contains the cap (D16), that a reset after an outside window restores the mark, and that a pointer-down on the mark's bottom label starts a zoom selection (D18). This ticket adds only those cases and changes no behavior the owner sees. Branch: `sgs-217-population-cap-spec`.

## Scope

Add tests to the existing `acceptance/aoe4-population-cap-mark.spec.ts` (this ticket explicitly edits that spec). Every existing test in it, and every assertion of each, stays as it is; new tests may reuse its `setup`, `marks`, `markLabel` and `zoomTo` helpers and may add local helpers of their own. Use `acceptance/helpers.ts` (`openPage`, `waitForRun`, `plotPoint`, `setDurationInPlace`, `bodyDuration`, `WIDE_VIEWPORT`) instead of local copies; the zoom reads follow `acceptance/aoe4-chart-zoom.spec.ts` (`data-zoom-from`/`data-zoom-to` on the chart, `chart-zoom-reset`, `chart-zoom-selection`). Names are the SGS-216 contracts: test ids `chart-population`, `chart-time-mark`, `chart-marker-legend`, `chart-marker-legend-item`, `pin-run`, `compare-row` (`data-key="pop-cap"`); attributes `data-at`, `data-label`, `data-kind`. The m:ss of an instant is the page's `formatMinSec` of the API value, not a literal. Read layout values (line x, label box, grid box) in one `evaluate` under `toPass`/`expect.poll` (LESSONS.md). Cases, each its own test, none repeating an assertion an existing test in the file already makes:

1. Markers control (D17, and the M13 design's Testing row for M13.2): on the default page (cap reached, asserted first), the `chart-marker-legend-item` entries are exactly the kinds present in the run's `markers` from the simulate response, and none has a `data-kind`, text or accessible name that names the population cap.
2. Pinned run (D9): pin the default run (its `populationCapReachedAt` asserted non-null), then set the duration to 600 s (the new response's `populationCapReachedAt` asserted `null`). `chart-population` has no `chart-time-mark`, although the pinned run reached the cap; the Key results `compare-row` with `data-key="pop-cap"` shows the pinned run's time as its m:ss and the current run as not reached.
3. Zoom window containing the cap (D16), on `chart-population` at `WIDE_VIEWPORT`: unzoomed, the line's x is where the chart's time axis puts the cap time over the whole run (compared against the plot extent, as `plotPoint` maps a fraction). Then drag a window that contains the cap time with plot room after it; from the read `data-zoom-from`/`data-zoom-to` first assert the cap time is inside, that the window's span is shorter than the cap time (so a side judged without the window origin would flip the label left), and that the label fits right of the line in the window by the width the page judges the side with (the chart markers module's `estimateLabelWidth`, read only, wider than the drawn text), not only by the drawn box. Exactly one mark is drawn at the same `data-at`, its x is where an axis spanning exactly the window puts that time, and its label box is right of the line and inside the plot.
4. Reset after an outside window: zoom to a window that ends before the cap time (asserted from the read window), assert no mark, then `chart-zoom-reset` brings back exactly one mark at the same `data-at` and its unzoomed x. The existing zoom test resets only from an inside window, so this is not a repeat.
5. Pointer on the label (D18): at the default (unzoomed) page, a pointer-down inside the mark's bottom label box (read from `markLabel`) and a drag starts a zoom selection (`chart-zoom-selection` is present while the button is down), and releasing it zooms the chart (`data-zoom-from` set).

Tests that depend on the change: none outside this file. A search of `acceptance/` for `chart-time-mark`, `chart-population` and `Population cap` finds `aoe4-population-cap-mark.spec.ts` plus two specs that only name the fifth chart (`aoe4-chart-views.spec.ts` its title, `aoe4-legend-pressed-state.spec.ts` a chart filter); neither checks the mark and neither is edited. `aoe4-marker-labels.spec.ts` pins the Markers control's kind list for another build and is not edited either. The docs already state every behavior these cases check (`docs/aoe4-build-order-ui.md` Population chart, marker control, zoom and Key results paragraphs), so no doc becomes untrue. The file's existing tests keep their assertions; the new tests add to it.

**Out of scope:** any production code, unit test, doc, or other acceptance spec; the existing tests' assertions in `aoe4-population-cap-mark.spec.ts`; the label position at 1200/1280/1800 px and the default-page single mark, 600 s run, hidden kinds, pinning, hover and outside-window cases (already covered by that file); a pinned run's mark (none is drawn by design); the `pop-cap` row's wording; pixel values of the label position beyond the properties above.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] (respec 1) The extended `acceptance/aoe4-population-cap-mark.spec.ts` runs green alone (acceptance setup first, then the single file under `timeout`), every test that was in the file before keeps all its assertions, and the implementer records the run and the read zoom window of case 3 in the report
- [ ] (respec 1) On the default page the Markers control lists exactly the marker kinds present in the run and no entry names the population cap; a test fails if a cap entry is added to the control
- [ ] (respec 1) With a pinned run that reached the cap and a current 600 s run that did not, `chart-population` has no `chart-time-mark` while the `pop-cap` Key results row shows the pinned run's time as m:ss; a test fails if the pinned run's cap is drawn as a mark
- [ ] (respec 1) Unzoomed, the mark's line sits at the axis position of the cap time over the whole run; zoomed to a window that contains the cap time with room after it, exactly one mark sits at the axis position of that time within the window and its label is right of the line inside the plot; a test fails if the label side is judged without the window origin or the line is placed against the whole run while zoomed
- [ ] (respec 1) After a zoom window that ends before the cap time removes the mark, reset draws it again at the same instant and its unzoomed x; a test fails if the mark stays hidden after reset
- [ ] (respec 1) A pointer-down on the mark's label and a drag shows a zoom selection and releasing it zooms the chart; a test fails if the label blocks the selection
- [ ] (respec 1) Each new case first asserts the condition it relies on (cap reached or not for each run, cap time inside or outside the read window, window span shorter than the cap time, label fits right of the line)
- [ ] (respec 1) The change adds no production code, edits no other test file, and every existing acceptance and unit test keeps its assertions
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-24

- Underspecified: the ticket asked for a new `aoe4-population-cap.spec.ts` covering cases SGS-216's PR already shipped in `acceptance/aoe4-population-cap-mark.spec.ts` (default mark, 600 s run, hidden kinds/pin/hover, outside-window zoom, label inside the grid at three widths).
- Changed: the ticket now extends that existing spec with only the uncovered cases (no Markers-control cap entry, pinned cap with an uncapped current run, line x and label side inside a containing zoom window, reset after an outside window, pointer-down on the label), keeping every existing assertion.
- No branch work exists yet.
