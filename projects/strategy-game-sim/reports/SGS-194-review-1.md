# SGS-194 review 1

**Verdict: REQUEST CHANGES**

Branch `sgs-194-results-charts-table` at 819d7892c9759c7ecb9e49fe8dd6a699a2cfce42, diffed against `origin/main` (87f0cd7). Full review (not delta).

## Blocking findings

1. `components/apps/aoe4-build-order/line-chart.tsx:127-136` (with `:155` and `:271-273`) - correctness - The measuring `<svg>` now sits inside `chart-body-row`, which gets `hidden` (display: none) when the chart is collapsed. On `main` it was a sibling of the hidden `chart-body` div, so it stayed rendered. `getComputedTextLength()` on an element under display: none returns 0. The effect re-measures only when `[labelKey, chartWidth]` changes. If the labelled markers change while the chart is collapsed (a new run moves an age-up), every label width is stored as 0. On expand, `ResponsiveContainer` reports the same width, so the effect does not run again. `placeMarkers` then treats every label as zero width: `fitsRight` is always true, so it always picks the left side and never stacks labels into a second row. The result is labels clipped at the plot's right edge, and labels that overlap. This is a visible regression in UI the diff changes.
   - Evidence (inspection, 1280 x 2800, default build). Collapse Gathered resources. Change the build line `at 9 vils build abbey-of-kings with 3 from sheep then sheep` to `@6:00 build abbey-of-kings with 3 from sheep then sheep` (Feudal moves from 4:23 to 7:59). Set duration to 491. Expand.
     - At the tip, the Gathered resources label "Feudal 7:59" has `text-anchor="start"` and its right edge is 52 px past the plot's right edge. It renders as "Feu" (screenshot `measure-reexpanded.png`).
     - The Floating resources chart stayed expanded and has `text-anchor="end"`, -10 px.
     - At `origin/main` the same script gives `end`, -10 px for both charts.
     - Measured directly while collapsed: the tip reports `display: none` and length 0; `main` reports `display: block` and length 62.125.
   - Direction: keep the svg where C13 puts it, skip measuring while collapsed, and re-measure on expand. In the effect, write `if (!text || labelKey === '' || collapsed) return` and use the deps `[labelKey, chartWidth, collapsed]`.
   - Add an acceptance case in `acceptance/aoe4-chart-layout.spec.ts`:
     - Steps: default build; collapse `chart-gathered-resources`; edit the abbey line as above; wait for the run; set the duration to Feudal + 12 s; expand.
     - Before acting, assert the Feudal label exists and that the always-expanded `chart-floating-resources` places it with `text-anchor="end"`. This proves the label is near the end of the plot.
     - Assert in one evaluate under `expect.poll` that the re-expanded chart's Feudal label has the same `text-anchor` as the Floating resources one and that its right edge is not past the plot's right edge.
     - The case fails on the current tip (`start`, +52 px). It passes once `collapsed` is in the effect's guard and deps (`end`, -10 px).

## Spec gaps (NEEDS_SPEC)

None.

## Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | `table[chart-table]`, aria-label, colgroup of 4 cols, no thead, one tbody per chart in order, key results outside | pass | `results.tsx:95-130`; `aoe4-results-split.spec.ts` rewritten case reads `TBODY:<id>` children in `CHART_IDS` order; the key results panel is untouched and outside `chart-table` |
| 2 | tbody holds header row + body row with one colSpan 4 cell; title is `th scope=rowgroup`; unit test fails on a wrong root, colspan or scope | pass | `line-chart.test.ts` "renders a tbody root..." checks `^<tbody`, the two row ids, a single `colSpan="4"` td and `th scope="rowgroup"`; the implementer's mutations on colSpan and scope failed it |
| 3 | `ChartHeaderRow` cell order, empty cells without layout, labels/aria kept, `chartHandleKey` rows pass | pass | `chart-header.test.ts` cell-based order test and the empty-cells test; the aria label tests are unchanged and pass (54/54 run here) |
| 4 | B-T1 alignment at 1200 and 1800, one evaluate under `expect.poll`; collapsed height = header height | pass | New `AoE4 chart table alignment` cases. Inspection: per-column lefts were identical across all four headers at 1200 (609/663/891/945), 1280 and 1800 |
| 5 | B-T2 collapse/expand | fail | Hide, id, `aria-controls` and series-hidden restore hold. Expanding after a run that changed while collapsed restores a body with mis-placed marker labels (finding 1) |
| 6 | B-T3 reorder, midpoints of whole groups, 60% opacity once | pass (note) | Drag rules unchanged (`use-chart-drag.ts` untouched; it measures the tbody). The midpoint test fails on header-only midpoints (implementer mutation). Opacity sits on the tbody: the test asserts tbody 0.6 and rows 1, so it fails at 1 and at a double application. Inspection screenshots `drag-before.png` / `drag-during.png` show the whole group dimmed in Chromium. See note 1 on the criterion wording |
| 7 | B-T4 persistence unchanged | pass | No change to `chart-layout.ts`, `use-chart-layout.ts` or the key; the existing stored-layout cases keep their assertions |
| 8 | B-T5 width | pass | Inspection: page, results column and table had 0 horizontal overflow at 1200/1280/1800. "the charts fill the Results width" is unchanged |
| 9 | `aoe4-split-tab-order` unedited; no other pre-existing acceptance assertion changed | pass | The diff touches only `aoe4-chart-layout.spec.ts` (selectors in `readLayout`/`sectionBoxes` plus new cases) and the named `aoe4-results-split` case |
| 10 | No INVARIANTS regressions | pass | A1-A3: no engine, data or simulation path touched. S1: no cross-app import |

Pre-existing tests edited: `chart-header.test.ts`, `line-chart.test.ts`, the two named acceptance specs. Each is covered by the Scope rule for tests this change breaks.

## Invariants touched

A1, A2, A3 (paths match `components/apps/aoe4-build-order/**`): all hold. The change is markup and CSS, and no simulation code changed.

## Bot reconciliation

No `reviewBot.cli` or `rulesFile` configured; skipped.

## Lint and build

`npx tsc --noEmit` clean; `npm run lint:dup` 0 clones; `npx next build` succeeds; `chart-header.test.ts` + `line-chart.test.ts` 54/54 pass.

## UI inspection

Served the task checkout with `npx next dev`. Loaded `/apps/aoe4-build-order` at 1200, 1280 and 1800 wide, with Gather rates and Floating resources collapsed, then with each view toggle switched. Then checked the drag state, and ran a collapse / change run / expand sequence at 1280.

- Overflow under hidden/clip: only `p.visually-hidden[chart-reorder-help]` (intended, 1x1 clip).
- Header cell overflow: none.
- Overlapping controls: none.
- Mid-word wraps in titles or buttons: none.
- Horizontal scroll: page 0, results column 0.
- Column lefts aligned at every width.
- Drag: the tbody opacity renders and the group shows dimmed.
- Label placement after collapse and re-expand: defect (finding 1). The same script on `origin/main` shows the correct placement.
- Screenshots read: `w1200-collapsed.png`, `drag-before.png`, `drag-during.png`, `measure-reexpanded.png`, `measure-stayed.png`.

## Non-blocking notes

1. Criterion 6 says the test "reads the computed opacity of the group's rendered rows and fails at both 1 and 0.36". The implementation puts the opacity on the tbody, so the rows read 1 and the test expects 1. The spec gate's note 1 allowed either placement, and the rendered result is correct (screenshot). Read literally, the criterion and the test disagree. If the owner wants the literal reading, move `opacity: 0.6` to `.chartGroup[data-dragging='true'] > tr` and flip the test's expectations to group 1 and rows 0.6.
2. `acceptance/aoe4-chart-layout.spec.ts` "the drop position follows the whole row group midpoint" reads `boxes` once, outside `expect.poll`, and then uses those viewport coordinates for the pointer. At 2800 px tall nothing scrolls, so it is stable today, but it departs from the LESSONS rule on settled layout reads.
3. `chart-header.test.ts` "renders the title and the controls with empty handle and caret cells without layout" keeps `expect(html).toContain('Gather rates')` and `toContain('extra-control')` after the new cell assertions that already check both. These are redundant lines.

## Coverage

- Reviewed in full:
  - `chart-header.tsx`, `chart-header.module.css`, `line-chart.tsx` (whitespace-insensitive diff plus the surrounding effect and placement code), `results.tsx`, `results.module.css`
  - both unit test files and both acceptance specs
  - `use-chart-drag.ts`, unchanged, read to confirm the drag still measures the tbody
- Read `docs/aoe4-build-order-ui.md` (lines 147-162): it still holds.
- `ARCHITECTURE.md` has no chart markup statements.
- Applied the REPO.md review checklist sections "Every diff" and "AoE4 build order".
- Not done: acceptance specs were not run (that is the acceptance-test role's job). The implementer reports 36/36 for the three named specs.
