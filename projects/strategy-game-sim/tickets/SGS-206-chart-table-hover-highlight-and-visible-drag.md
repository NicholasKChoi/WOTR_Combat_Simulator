# SGS-206: Highlight the hovered or focused chart row and show a chart drag while it happens

- **Type**: Chore
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: medium
- **Risk**: standard
- **Invariants**: none adjacent (A1 to A3 guard engine results and data; this changes markup, CSS and drag state in the Results chart table only)
- **Unverified assumptions**: Chromium applies a CSS `transform` to a `<tbody>` (a table row group) and paints it above the rows around it; `:hover` on a table row matches while the pointer is over any of its cells; while the handle holds pointer capture no element matches `:hover` (not the handle, its row, nor the element under the pointer), and after release `:hover` follows the pointer again (observed by the spec gate in the repo's Playwright Chromium); Chromium's `:focus-visible` heuristic: a button focused by a mouse press, or focused by script after a pointer interaction, does not match, a button focused by Tab, or a mouse-focused button after a key press such as Escape, does; `:has()` is supported (the acceptance specs this ticket adds run in Chromium and read computed styles and boxes for real)
- **LOC estimate**: 120 (`chart-drag.ts` slot function, `use-chart-drag.ts` drag state and indicator position, `results.tsx` wrapper, indicator and wiring, `line-chart.tsx` transform, `results.module.css` and `chart-header.module.css` rules; tests and docs excluded)
- **Depends on**: none
- **On merge**: none
- **Source**: owner M11.8 check 2026-11-17 (BACKLOG item "AoE4 results chart table: hover highlight and a visible drag", follow-up to SGS-194)

## Context

The Results chart table (one `table[data-testid=chart-table]`, a `tbody` per chart with a `chart-header-row` and a
`chart-body-row`) has no row feedback: nothing marks the row the pointer or keyboard is on, and a pointer drag of a chart
handle only dims the dragged group (`.chartGroup[data-dragging='true']` in `results.module.css`) while the pointer moves.
The reader sees nothing move and nothing say where the chart will land until the button is released, because
`useChartDrag` in `use-chart-drag.ts` tracks only which chart is dragging, not where it would drop. Chore: the
saved order, keyboard reorder, drop rule and persisted layout do not change; the added feedback is visual only.

The page has a light colour scheme only: Bootstrap 5.3 is loaded as precompiled CSS (`pages/_app.js`), whose dark scheme
applies only under `[data-bs-theme=dark]`, and no file sets `data-bs-theme` or uses `prefers-color-scheme` (searched at
`origin/main`). Contrast is therefore checked in the light scheme only.

Unit tests run in vitest's node environment (`vitest.config.mts`, `components/**/*.test.ts`) with no DOM library; component
tests use `renderToStaticMarkup`. The hook's event handling therefore cannot be unit-tested; its pure part is moved into a
plain function that can (respec 2), and the hook's lifecycle is covered by the acceptance specs.

## Scope

All paths under `components/apps/aoe4-build-order/` unless noted. Read at `origin/main`.

- Row highlight (respec 1) (`chart-header.module.css`, and `results.module.css` or `line-chart.tsx` only where the selector
  needs it): the chart header row (`chart-header-row`) gets a background tint, visibly different from its resting
  background, in exactly these cases:
  - the pointer is over any of its cells, on devices that hover only (`@media (hover: hover)`, so a touch tap leaves no
    stuck tint);
  - it contains the keyboard-visible focus: an element in the row (the drag handle, the collapse caret or a view toggle
    button) matches `:focus-visible` (for example `tr:has(:focus-visible)`), not `:focus-within`. A mouse click on the
    caret or a view toggle, and the focus the code moves to the handle after a pointer drop, leave no tint once the
    pointer leaves the row; a key press that makes the focused button show its focus ring (Tab, arrow-key reorder, Escape
    during a drag) shows the tint with it.
  - (respec 2) Never on the dragged chart's header row while its group has `data-dragging` set. While the handle holds
    pointer capture no element matches `:hover`, so no row takes the hover tint during a drag by itself; the rule is needed
    for focus: a handle focused by keyboard (Tab) and then dragged with the mouse keeps matching `:focus-visible`, and
    without the rule its row would stay tinted for the whole drag.
  The body row (the plot) is not highlighted, so the chart's own hover (tooltip, drag-to-zoom) is unchanged. The tint is a
  Bootstrap colour token (as `.markerButton` and the sticky run bar use `var(--bs-...)`), not a fixed colour.
- (respec 2) Visibly different means measurably: the composited tinted background has a contrast ratio of at least 1.1:1
  against the composited resting background of the same row (a one-level colour change does not pass).
- Contrast (respec 1, respec 2): every text in a tinted header row keeps a contrast ratio of at least 4.5:1 against the
  background behind it: the title, the handle's grip glyph, the caret and each view toggle button label. The background
  behind a text is the composite of its own and its ancestors' computed background colours (an opaque button background
  hides the row tint). The caret and the unpressed view toggle buttons use `btn-outline-secondary`, whose grey text is
  near the bar on white and falls below it on the light Bootstrap grey and blue tints, so the implementer either picks a
  tint that keeps it, or gives the header buttons an opaque background, or both, and records the ratios its test
  computes. Any opaque-background rule is scoped to the chart header (`chart-header.module.css` or a selector under
  `chart-header-row`), not added to `CollapseCaret` (`collapse-caret.tsx`) or a global class: `CollapseCaret` is shared
  with the compare panel (`compare-panel.tsx`), whose look does not change.
- (respec 2) Drop slot as a pure function: `chart-drag.ts` gains a function with no React or DOM dependency that takes
  the other charts' group rects in display order (top and bottom of each, the dragged chart excluded) and the pointer's
  y, and returns the drop index and the indicator's slot-boundary y. The drop index is `dropIndexAt` over those rects'
  midpoints (call it, do not copy the rule). The boundary is in the span from the bottom of the other chart above the
  slot to the top of the other chart below it (their shared edge when adjacent); for slot 0 it is at the first other
  chart's top, for the last slot at the last other chart's bottom. `dropIndexAt` and `DRAG_THRESHOLD_PX` keep their
  signatures and behavior. Both `onUp` in `use-chart-drag.ts` and the indicator position use this function; there is no
  second copy of the rule.
- Visible drag: `use-chart-drag.ts` exposes, while a drag is active, the dragged chart id, the pointer's vertical
  offset from where the drag began, and the drop index and indicator position the slot function returns for the current
  rects, updated on every `pointermove`, and cleared when the drag ends by drop, Escape, cancel or lost capture (today's
  `finish` path). `results.tsx` passes what each chart needs through the `layout` controls to `SeriesChart`; any field
  added to `ChartControls` in `chart-header.tsx` is optional, so the existing object literals in `chart-header.test.ts`
  and `line-chart.test.ts` keep compiling unchanged. While active:
  - the dragged chart's whole row group follows the pointer vertically (its offset applied as a transform on the
    `tbody`, so it moves over the other rows without changing the table's layout or the other charts' positions), still
    at the single 60% opacity of today, painted above the other rows;
  - (respec 1) a drop indicator marks the slot the chart will land in. It is one dedicated element,
    `data-testid="chart-drop-indicator"`, rendered only while a drag is active, absolutely positioned inside a new
    `position: relative` wrapper `div` around `chart-table` in `results.tsx`. It sits outside the table, so the table's
    children stay its `colgroup` and chart `tbody`s (`acceptance/aoe4-results-split.spec.ts` pins them) and no row or
    group layout box changes. It is a horizontal line spanning the table's width, painted above the rows and the dragged
    group, at the slot-boundary y the slot function returns. It still shows when the slot is the chart's own, so the
    reader sees "no change".
  - the pointer drag's other rules stay: the 4 px threshold before anything moves, Escape and a cancelled pointer end it with
    no change, the order stays unchanged until the drop, focus goes to the moved handle after a move, arrow keys do
    nothing while a pointer drag is in progress, a touch drag on the handle does not scroll the page.
- The measuring of the other groups' rects must not be skewed by the dragged group's transform (the dragged chart is
  already excluded from them).
- (respec 2) Stacking: SGS-203 (in progress) makes the marker control sticky in the Results column; it does not touch the
  chart table or this wrapper, so the only overlap is paint order. The implementer checks the dragged group and the drop
  indicator against the sticky marker control and the sticky run bar when they overlap on screen and reports the order it
  chose; this ticket does not change those elements' `z-index`.
- (respec 1) Page scroll during a drag (wheel; auto-scroll is out of scope): the offset is the pointer's `clientY` change
  since the drag began, so a scroll with no pointer move leaves the dragged group and the indicator where they were drawn
  until the next `pointermove`, which re-measures the rects and redraws both. The drop on release still follows the rule
  at the pointer's position over the current rects. The dragged group drifting from the pointer by the scrolled distance
  is accepted, not a defect.
- (respec 1) Cost per move: frame rate is not a criterion. Prefer applying the transform and the indicator position
  without re-rendering every `SeriesChart` (recharts) on each `pointermove` (a ref-set style, or memoised charts whose
  props do not change during a drag); the implementer reports which it chose.
- Keyboard reorder (`chartHandleKey`, `move` and `moveTo` in `use-chart-layout.ts`), `chart-layout.ts` and the stored
  layout are untouched.
- Docs made untrue: `docs/aoe4-build-order-ui.md`, the Chart controls paragraph ("A drag starts after the pointer has moved
  4px, dims the moved chart's rows, leaves the order unchanged until the drop" does not say the row follows the pointer or that a
  drop position is marked) and the Chart table paragraph, which does not mention the row highlight. State the new
  behavior; the implementer writes the wording against the code it builds. (respec 2) `page-help.tsx` says only that the
  Reorder chart handle moves a chart up or down with the mouse or the arrow keys, which stays true, and `ARCHITECTURE.md`
  does not describe chart dragging (searched), so no edit there unless the implementer finds a statement the change makes
  untrue.
- Tests: add the specs below. Search the specs that drag a handle or read chart boxes mid-drag (examples:
  `acceptance/aoe4-chart-layout.spec.ts` `startDrag` cases, the 60% opacity case, the whole-row-group-midpoint case,
  `aoe4-split-tab-order.spec.ts`) and keep their assertions; where a test reads the dragged group's box after the pointer
  has moved, the group now moves, and the implementer fixes the cause rather than loosening the assertion (read boxes before
  the pointer moves, as `startDrag` does for the other groups). Specs that read `chart-table`'s children or parent keep
  their assertions with the new wrapper. Unit tests of `chart-header.test.ts`, `line-chart.test.ts`, `chart-drag.test.ts`
  and the `CollapseCaret` case in `compare-panel.test.ts` keep their assertions; a server render with no drag renders no
  drag styling and no `chart-drop-indicator`. (respec 2) A mouse-click case starts from a fresh page load or from a click
  on another control, not after an earlier key press on the same page: once a handle shows `:focus-visible` after Tab or
  Escape, a later click on that already-focused handle keeps it. A cancelled pointer and lost capture may be produced by
  dispatching the event on the handle, as `aoe4-chart-zoom.spec.ts` dispatches `pointercancel`. The implementer lists
  every test it edits.

**Out of scope:** reordering by touch gestures other than today's; auto-scrolling the Results column while dragging near its
edge; dragging a chart by anything but its handle; animation of the other charts making way; highlighting the body row, series
legend, marker control or the step table; a dark colour scheme for the page; changes to `ChartLayout`, the storage key, the
drop rule or the keyboard reorder; the compare panel's caret; the sibling tickets' areas (marker control stickiness,
upgrade-dot tier text, help dialog headings).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] (respec 2) Hover (acceptance, Chromium, at a supported desktop width): with the pointer over a chart's header row, the
  row's composited background has a contrast ratio of at least 1.1:1 against its resting background and differs from a
  chart header row the pointer is not over; moving the pointer off restores it. The test first reads the resting background
  of both rows, so a missing rule fails it. The implementer records the ratio the test computes.
- [ ] (respec 1, respec 2) Focus: focusing a chart's drag handle by Tab tints that chart's header row the same way and by
  the same floor (pointer elsewhere), and Tab to another chart's handle moves the tint with it; keyboard focus on a view
  toggle button or the collapse caret tints that chart's header row. A mouse click on the collapse caret and on a view
  toggle button, starting from a fresh load or a click elsewhere (no earlier key press on the page), followed by moving
  the pointer off the table, leaves no header row tinted; a test fails if the row is tinted by `:focus-within` alone. The
  body row of a hovered or focused chart is not tinted (computed background unchanged).
- [ ] (respec 1, respec 2) Contrast (acceptance, light scheme): with a header row tinted by hover and, separately, by
  keyboard focus, the computed colour of the title, the grip glyph, the caret and each view toggle button label has a
  contrast ratio of at least 4.5:1 against the composited background behind it, computed in the test from computed
  styles. The implementer records the lowest ratio the test computes. If the fix gives the chart header's buttons an
  opaque background, a test also asserts the compare panel's caret (`compare-collapse`, pointer elsewhere, not focused)
  keeps the transparent resting background `btn-outline-secondary` gives it, so a rule leaking into `CollapseCaret` fails.
- [ ] (respec 2) Slot function (unit, `chart-drag.test.ts`): a table test of the new pure function covers the pointer above
  the first other chart (index 0, boundary at its top), below the last (last index, boundary at its bottom), between two
  charts (boundary within the span from the upper one's bottom to the lower one's top), between two collapsed (short)
  charts, adjacent charts (boundary at the shared edge), and no other charts (index 0). For each row the returned index
  equals `dropIndexAt` over the rects' midpoints; a test fails if the boundary is placed at a slot other than the returned
  index. Existing `dropIndexAt` rows keep their assertions.
- [ ] (respec 2) One computation: the index `onUp` passes to `onDrop` and the indicator position both come from the slot
  function; `use-chart-drag.ts` computes no midpoint list or drop index of its own (review reads it, and the
  indicator-and-drop acceptance criterion below fails if they disagree).
- [ ] While a pointer drag is active (past the 4 px threshold) the dragged chart's group is displaced vertically from its
  resting top by about the pointer's travel (a test moves the pointer by a known distance and asserts the group's bounding
  top moved in that direction, from a value read before the move), and moves again as the pointer moves further. It
  still reads the single 60% opacity (group 0.6, rows 1) and the other charts' tops are unchanged from before the drag.
- [ ] (respec 1) Drop indicator position: while a drag is active, `chart-drop-indicator`'s bounding box, read in one
  `evaluate` with the other charts' group boxes and the table's box (per LESSONS), spans the table's width (left and right
  edges match the table's) and touches the slot boundary: its vertical extent meets the span from the bottom of the other
  chart above the slot to the top of the other chart below it (the first other chart's top for slot 0, the last other
  chart's bottom for the last slot), and it does not meet any other slot's span. Cases: dragging the first chart past the
  middle of the third shows it between the third and fourth charts; moving the pointer back above the second chart's
  midpoint moves it to above the second; it shows at the chart's own slot (no change). A test fails if the indicator is
  drawn at a slot other than the one a release would drop into.
- [ ] (respec 2) Drag state clears (acceptance): `chart-drop-indicator` is absent and the dragged group has no transform and
  no `data-dragging` before the 4 px threshold, when no drag is active, after a drop, after Escape, after a cancelled
  pointer (`pointercancel`) and after the handle loses pointer capture (`lostpointercapture`); each case first sees the
  indicator present past the threshold, so a test fails if the state is left set after Escape.
- [ ] The indicator and the drop agree: for the pointer positions the tests use (including above the first chart, below the
  last, and between two collapsed charts), releasing the pointer produces the order the indicator showed, and the stored
  layout and the `chart-order-status` text are what a drop produced before this change.
- [ ] The indicator and the follow-the-pointer offset add no layout shift: the other charts' group boxes and the table's
  box read the same before the drag, during it and after Escape (taken in one `evaluate`, per LESSONS).
- [ ] (respec 2) No tint during a drag: a test focuses a chart's drag handle by Tab (its header row is then tinted), then
  presses the pointer on that handle and drags past the threshold, with the pointer over another chart's header row;
  while the drag is active no header row's composited background differs from its resting background, including the
  dragged row, whose handle still holds keyboard-visible focus. A test fails if the dragged row keeps the focus tint while
  `data-dragging` is set. After a mouse drop from a fresh load, with the pointer moved off the table, no header row is
  tinted (no stuck tint from the focus the drop moves to the handle); after the drop or Escape the tint follows the
  pointer and keyboard-visible focus again.
- [ ] Existing behavior holds (this is a Chore): the pre-existing drag, keyboard reorder, Escape, below-threshold, collapsed
  chart, tab-order and chart-table-children tests keep their assertions; ArrowUp and ArrowDown on a focused handle still
  reorder and announce as before; a reorder by keyboard or drag persists in `aoe4-build-order.chart-layout` as before.
- [ ] Docs: the Chart controls and Chart table paragraphs of `docs/aoe4-build-order-ui.md` state the row highlight (hover and
  keyboard focus, header row only) and that a dragged chart follows the pointer with a marked drop position; no statement
  there says the drag only dims the chart.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-17

- Underspecified: the drop indicator had no element a test could measure (shadow or pseudo-element on an unnamed carrier), the focus tint used `:focus-within`, which tints the dragged row for the whole drag and sticks after a mouse click or drop, and contrast had no pass bar and assumed a dark scheme the page does not have.
- Changed: a dedicated `chart-drop-indicator` element in a relatively positioned wrapper outside the table, with criteria comparing its box to the group boxes; the focus tint keys on `:focus-visible` and the dragged row shows no tint of either kind; contrast is at least 4.5:1 in the light scheme with buttons' grey text called out; page-scroll drift, per-move render cost and optional `ChartControls` fields are stated.
- Branch work: no implementation branch exists yet; nothing to keep or discard.

## Re-spec 2 - 2026-11-17

- Underspecified: a unit test of the drag hook was required though vitest runs in node with no DOM library, and the ticket assumed pointer capture keeps `:hover` on the dragged row, which Chromium does not do, so the hover half of the no-tint criterion could not fail.
- Changed: the drop index and slot boundary move into a pure, table-tested function in `chart-drag.ts` that `onUp` and the indicator both call, and clearing on drop, Escape, cancel and lost capture is an acceptance criterion; the no-tint test Tab-focuses the handle and then drags it; added a 1.1:1 tint floor, opaque button backgrounds scoped to the chart header (the compare panel's caret unchanged), fresh-page setups for mouse-click cases, the `page-help.tsx` wording and the SGS-203 stacking note.
- Branch work: no implementation branch exists yet; nothing to keep or discard.
