# SGS-194: Render the Results charts as one table

- **Type**: Feature
- **Component**: aoe4-build-order
- **Milestone**: M11
- **Priority**: medium
- **Risk**: standard
- **Invariants**: none adjacent (A1 to A3 guard engine results and data; this changes markup and CSS only)
- **Unverified assumptions**: none (the acceptance specs this ticket adds load the page in Chromium and read the real table layout)
- **LOC estimate**: 120 (`results.tsx`, `line-chart.tsx`, `chart-header.tsx`, two CSS modules; tests excluded)
- **Depends on**: none
- **On merge**: none
- **Source**: design/M11.md M11.4 (B-T1 to B-T6, C13 tbody shape, C14, C15); plans/M11-20261116.md outline F

## Context

Each Results chart is a `div` with a flex header row, so a collapsed chart's handle, title, caret and view toggle
sit at different x positions than another chart's (M11.4). The charts become the row groups of one `<table>`: the
header row of every chart shares four column positions, and the body is one spanning row. This is the first chart
ticket; later chart tickets (marker control, zoom, unit lines) edit the same tbody shape, so contract names must
match the design exactly.

## Scope

All paths under `components/apps/aoe4-build-order/` unless noted. Read at `origin/main`.

- `chart-header.tsx`: replace `ChartHeader` with `ChartHeaderRow({ title, bodyId, layout, controls })` (C14). It
  returns `<tr data-testid="chart-header-row">` with four cells in this order: `<td>` drag handle (empty cell
  without `layout`), `<th scope="rowgroup">` holding the `h3.h5` title, `<td>` collapse caret (empty cell without
  `layout`), `<td>` `controls` (empty cell when none). Handle and caret keep their test ids, labels, `aria-*` and key
  handling; `ChartControls` and `chartHandleKey` are unchanged. `chart-header.module.css` follows (the flex
  `.chartHeader` rules go; `.dragHandle` stays; the h3 margin reset stays as needed).
- `line-chart.tsx` `SeriesChart` (C13, tbody part only): the root becomes `<tbody>` with the same `data-testid`,
  `data-label-rows`, `data-collapsed`, `data-dragging` as today and the `sectionRef` ref on it. It holds
  `ChartHeaderRow`, then one `<tr data-testid="chart-body-row">` with one `<td colSpan={4}>` that holds the
  existing `div[data-testid=chart-body]` (same id and `hidden` rule as today) and the measuring `<svg>`. The body
  row gets `hidden` when collapsed. Chart content (plot, legends, markers) is unchanged. Do not add the
  `markerView`, zoom or upgrade-dot props; other tickets own them.
- `results.tsx` (C15): inside `results-last-good`, after `chart-order-status`, render
  `table[data-testid=chart-table]` with `aria-label="Results charts"`, a `<colgroup>` of four `<col>`s (handle,
  title, caret, controls) and one `SeriesChart` tbody per id in `layout.order`. No `thead`, no Bootstrap `.table`
  class. Warnings, info, reorder help and order status stay outside the table, above it, in today's order. The
  focus-after-move lookup (`[data-testid="${id}"] [data-testid="chart-drag-handle"]`) must still find the handle.
- `use-chart-drag.ts` keeps measuring the section element passed through `sectionRef`; that element is now the
  tbody, so midpoints are of each chart's whole row group. `chart-drag.ts` (`dropIndexAt`) and the drag rules
  (4 px threshold, Escape cancels, focus to the moved handle, `chart-order-status`) are unchanged.
- `results.module.css`: a module class on the table sets `width: 100%`, `table-layout: fixed`,
  `border-collapse: collapse`. The handle and caret columns have fixed widths; the controls column fits the widest
  view toggle; the title column takes the rest. A moved chart (`data-dragging='true'`) is shown at 60% opacity
  as before; the opacity must apply once to the group's rendered rows (not a 36% product of tbody and row both),
  and the old `.chart[data-dragging]` selector, which no longer matches a `div`, is replaced. `.chart { min-width: 0 }`
  moves to whatever element now needs it so the table never makes the Results column scroll sideways.
- Layout persistence (`chart-layout.ts`, `use-chart-layout.ts`, storage key, `ChartLayout` v1) is untouched (B-T4).
- Tests that this change breaks, which are updated in this ticket (examples found, search for others that read the
  chart structure: `results-last-good > [data-collapsed]`, `div` root of a chart, `ChartHeader`):
  - Unit: `chart-header.test.ts` (rows for `ChartHeader` become rows for `ChartHeaderRow`, keeping the handle, caret and
    controls-slot cases), `line-chart.test.ts` (server renders of `SeriesChart` now render a tbody; the collapsed
    case asserts the body row is hidden and the `chart-body` div keeps its id and `aria-controls` link).
  - Acceptance: `acceptance/aoe4-chart-layout.spec.ts` helpers `readLayout` and `sectionBoxes` select charts as
    direct children of `results-last-good` (`results-last-good > [data-collapsed]`); they select the row groups of
    `chart-table` instead. Every other case there keeps its assertions. `acceptance/aoe4-results-split.spec.ts`
    "the four charts are direct children of the results container..." is rewritten to assert the charts are the
    row groups of `chart-table`, in order. `aoe4-split-tab-order.spec.ts` must pass unchanged. Any other test that
    passes today must keep its expected values.
- Docs: `docs/aoe4-build-order-ui.md` describes each chart's "title row" and "everything under the title row"
  (Chart controls paragraph); the sentences stay true, so no edit is required here. The M11 docs ticket adds the
  chart-table description.

**Out of scope:** the marker control, zoom bar, unit lines and upgrade dots (their own tickets); any change to
chart content, series, legends or markers; engine, API and OpenAPI; the `ChartLayout` schema; the key results panel
(stays outside the table, B-T6); docs prose for the new table (docs ticket).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] The Results charts render as `table[data-testid=chart-table]` with `aria-label="Results charts"`, one
  `colgroup` of four `col`s, no `thead`, and one `tbody` per chart in `layout.order`, each carrying the chart's
  existing `data-testid` (B-T6). The key results panel is not inside the table.
- [ ] Each chart's tbody holds exactly a `chart-header-row` and a `chart-body-row` whose single cell spans four
  columns. The title is a `th scope="rowgroup"`. A unit test over the server render fails if the tbody root, the
  colspan or the `scope` is wrong.
- [ ] `ChartHeaderRow` renders four cells in the order handle, title, caret, controls; without `layout` the handle
  and caret cells are empty and the title and controls still render. Handle and caret keep their test ids, labels
  (`Reorder <title> chart`, `Collapse|Expand <title> chart`), `aria-keyshortcuts`, `aria-describedby`,
  `aria-expanded` and `aria-controls`; the existing `chartHandleKey` rows still pass.
- [ ] Alignment (B-T1), at `MIN_SUPPORTED_VIEWPORT` and `WIDE_VIEWPORT`, in `aoe4-chart-layout.spec.ts`: with two
  charts collapsed and two expanded, every chart's handle, title cell, caret and controls cell have the same left
  `x` per column within 1 px, read in one `evaluate` under `expect.poll`; the test fails if any chart's header is
  laid out with its own flex positions. A collapsed chart's rendered height equals its header row's.
- [ ] Collapse (B-T2): collapsing hides the body row and the `chart-body` div keeps its id, `hidden` and the
  caret's `aria-controls` link; the handle, title, caret and controls cell stay visible and usable. Expanding
  restores the body with its series-hidden state, as the existing layout spec asserts.
- [ ] Reorder (B-T3): drag and arrow-key reordering keep every rule they have today, and the drop position is
  decided by the pointer height against the other row groups' vertical midpoints. A test would fail if midpoints
  were taken from the header row only. While dragging, the moved group renders at 60% opacity as computed on the
  row elements the user sees, once (a test reads the computed opacity of the group's rendered rows and fails at
  both 1 and 0.36).
- [ ] Persistence (B-T4): the stored chart layout key and shape are unchanged, and a layout stored before this
  change loads as is.
- [ ] Width (B-T5): the Results column never scrolls sideways and each chart's plot fills the body cell width;
  `aoe4-results-split` "the charts fill the Results width" still passes unchanged.
- [ ] `aoe4-split-tab-order` passes with no edit; no pre-existing acceptance case outside the two named in Scope
  changes its assertions.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Rework 1 - 2026-11-16 (review)

Gates passed earlier: none (review is the first gate). Review bounced tip 819d7892c9759c7ecb9e49fe8dd6a699a2cfce42; full findings in reports/SGS-194-review-1.md.

### Findings
- `components/apps/aoe4-build-order/line-chart.tsx:127-136`: the text-measuring `<svg>` sits inside `chart-body-row`, which is `display: none` when the chart is collapsed, so every label width measures 0. The width effect re-runs only on `[labelKey, chartWidth]`, so a run that changes while collapsed keeps the zero widths after expanding: marker labels are placed as if they had no width and clip at the plot's right edge or overlap. Reproduced at 1280: collapse Gathered resources, move Feudal to 7:59, set duration 491, expand; label shows "Feu" 52 px past the plot edge. The always-expanded chart and origin/main are correct.

### Required fixes
- [x] In that effect skip measuring while collapsed (`if (!text || labelKey === '' || collapsed) return`) and add `collapsed` to the deps (`[labelKey, chartWidth, collapsed]`).
- [x] Add the acceptance case to `acceptance/aoe4-chart-layout.spec.ts` that does the same steps and compares the re-expanded chart's label anchor and right edge with the always-expanded Floating resources chart (spec text is in reports/SGS-194-review-1.md).
- [x] Run aoe4-chart-layout, aoe4-results-split and aoe4-split-tab-order; all pass.
