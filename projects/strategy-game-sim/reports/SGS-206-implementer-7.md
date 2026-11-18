# SGS-206 implementer report 7

Status: needs_review (partial by design: the new acceptance specs are not authored, see below)

- Branch `sgs-206-chart-table-hover-and-drag`, tip `e9d022197f095e59083189d640ca033d987e47d6`, base `origin/main` 0866156.
- Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-206-chart-table-hover-and-drag`

## Files (all under components/apps/aoe4-build-order/ unless noted)
- `chart-drag.ts`: `GroupRect`, `DropSlot`, `dropSlotAt(others, pointerY)` (pure; index via `dropIndexAt`; boundary at first top, last bottom, else midpoint of the gap = shared edge when adjacent; `boundaryY` null with no others).
- `chart-drag.test.ts`: `dropSlotAt` table (above first, inside first above/below its midpoint, between adjacent, with a gap, between collapsed, below last), empty, and a span invariant.
- `use-chart-drag.ts`: `onUp` and the indicator both call `dropSlotAt` through `slotAt`; no midpoint list in the hook. Transform on the dragged `tbody` and indicator `top` are set by ref (no re-render of the charts per `pointermove`); both cleared in `finish` (drop, Escape, cancel, lost capture). Exposes `wrapperRef`, `indicatorRef`.
- `results.tsx`: `position: relative` wrapper `div` around `chart-table`; `chart-drop-indicator` rendered only while `drag.dragging !== null`.
- `results.module.css`: `.chartTableWrapper`, `.dropIndicator` (2px, `--bs-primary`, z-index 3, pointer-events none), dragged group gets `position: relative; z-index: 2`.
- `chart-header.tsx`: header `tr` gets `className` and `data-dragging` (same threshold as the `tbody`).
- `chart-header.module.css`: tint `var(--bs-secondary-bg)` on `.headerRow:hover` (inside `@media (hover: hover)`) and `.headerRow:has(:focus-visible)`, both `:not([data-dragging='true'])`; `.headerRow .btn-outline-secondary { --bs-btn-bg: var(--bs-body-bg) }` (opaque resting button, scoped to the header; pressed `btn-secondary` and hover states untouched; `CollapseCaret` not edited).
- `docs/aoe4-build-order-ui.md`: Chart table and Chart controls paragraphs.
- `ChartControls` unchanged (no new fields needed, since transform and indicator are ref-set).

## Cost choice
Ref-set style: no extra state per move; `SeriesChart`s do not re-render on `pointermove`.

## Tests
- Unit: `chart-drag.test.ts` 15 pass; full `npm test`: 91 files passed, 2872 tests passed, 15 skipped. No pre-existing test edited.
- Existing acceptance (run once to check the Chore holds; not authored): `aoe4-chart-layout.spec.ts`, `aoe4-split-tab-order.spec.ts`, `aoe4-results-split.spec.ts`: 37 passed, no assertion changed.
- Acceptance specs for hover, focus, contrast, drag offset, indicator, clearing, no-tint: NOT authored. My instructions give acceptance-harness tests to a separate gate, so the acceptance gate must add them per the ticket's criteria.
- I did verify behavior with a throwaway Playwright probe (deleted, not committed) in Chromium at 1280x2800: hover on the Units header: row bg `rgb(233, 236, 239)` vs resting `rgba(0,0,0,0)` over white (contrast about 1.19:1); body row stays transparent; Tab to the handle tints that row, Tab to the next chart's handle moves the tint; focus on a view toggle option tints its row; a mouse click on a view toggle and on the caret from a fresh load, then pointer off, leaves no tint; Tab-focused handle then dragged: no header row tinted during the drag (dragged row included); after that drop the row is tinted again (keyboard-visible focus remains, as the ticket allows); drag past the third chart: group `transform: matrix(1,0,0,1,0,1402.41)`, opacity 0.6, `elementFromPoint` over the moved group returns its own header row (painted above the others), indicator width 534 = table width, y 2155.6 to 2157.6 centred on the boundary 2156.6 between the third and fourth charts. Computed text colours: title `#212529` on transparent (over `#e9ecef`), grip, caret and unpressed toggle `#6c757d` on opaque `#fff` button background (4.7:1), pressed toggle white on `#6c757d` (4.7:1). Ratios are my arithmetic from those colours; the acceptance gate's test must compute and record its own.

## Mutation checks (`chart-drag.ts`, each undone; `git diff` shows only the added function)
- boundary at first `bottom` instead of `top`: fails "above the first other chart" and the span test.
- last boundary uses `top`: fails "below the last other chart" and the span test.
- gap boundary `others[index].top` instead of the midpoint: fails "between two charts with a gap".
- drop the empty-list guard: fails "has no boundary and index 0 with no other charts".
- index-0 branch returns index 1: fails "above the first other chart" and span test.
- midpoint = `rect.top`: fails "inside the first chart above its midpoint", "with a gap", "between two collapsed charts"; midpoint = `rect.bottom`: fails "between two adjacent charts" and "inside the first chart below its midpoint".
- Before the strengthening, two rows passed under the midpoint mutation; I changed their inputs and deleted a redundant `dropIndexAt` equality assertion (hardcoded indices already cover it).
- `use-chart-drag.ts` `onUp` using index 0: the existing "dragging the first chart below the third" acceptance spec fails; undone.

## Clean
- codegen: none set. `next build`: ok. `tsc --noEmit` and `lint:dup`: 0 errors, 0 clones. Diff reviewed: only the 8 files above; no tool-made changes.

## Doc claims
- docs Chart table: "A chart's header row (not its body row) takes a light grey background while the pointer is over it, on devices that hover, and while an element in it shows the keyboard focus ring; a mouse click on a button in it leaves no tint, and the dragged chart's header row has none during a drag." Backed by `chart-header.module.css` rules and the probe above.
- docs Chart controls: "from then the moved chart's rows are dimmed and follow the pointer vertically, a horizontal line (`chart-drop-indicator`) marks the slot the chart will land in (also its own slot, when nothing would change)" Backed by `use-chart-drag.ts` onMove and `results.tsx` indicator; the own-slot case was not probed separately (indicator renders whenever a drag is active, `boundaryY` is always non-null with other charts).

## Stacking (reported per ticket)
Dragged group `z-index: 2` (needs `position: relative`, which I added), indicator `z-index: 3`. The sticky run bar has `z-index: 10` (`workbench.module.css`), so it paints above both; no z-index of existing elements changed. The marker control's stickiness (SGS-203) is not in this base, so that overlap was not checked.

## Invariants
A1 to A3 not adjacent; engine and data untouched. Keyboard reorder, `chart-layout.ts`, stored layout and drop rule untouched.

## Unverified assumptions added
None beyond the ticket's list. Note `--bs-secondary-bg` and `--bs-body-bg` exist in the loaded Bootstrap 5.3 CSS (observed in the computed colours above).

## Out-of-scope findings
None.
