# SGS-135: Replace the chart Collapse, Up and Down text buttons with a drag handle and a caret

- **Type**: Task
- **Component**: aoe4-build-order
- **Milestone / criteria**: M9 / M9.4
- **Priority**: high
- **Risk**: standard
- **Invariants**: none (no engine, data, or simulation path is touched)
- **Unverified assumptions**: Playwright's `page.mouse` down, move and up, in Chromium, reach the handle as pointer events with the primary button and a pointer that `setPointerCapture` accepts, so one drag spec stands in for real pointer input; touch input and the browser's own scroll gestures are not exercised by any test; after a keyed reorder React may leave the focused handle blurred, which is why focus is restored by an effect (the design asserts this and the Playwright focus case exercises it for real)
- **LOC estimate**: 160 (`chart-drag.ts`, `use-chart-drag.ts`, the `ChartHeader` markup and key map in `chart-header.tsx`, and the `Results` drag, focus and announcement wiring; business logic only, CSS, glyphs and tests excluded; the full diff is nearer 300 lines)
- **Depends on**: SGS-134
- **On merge**: none
- **Source**: `design/M9.md` C3 and the "Chart layout, drag and caret (M9.4)" behavior rules (handle, keyboard and pointer rows, caret, collapsed chart), M9.4 row of the Criteria map; plan outline H

## Context

M9.4 replaces each chart's three text buttons (Collapse, Up, Down) with a grip handle that reorders by pointer drag or ArrowUp and ArrowDown, and a shared caret that collapses. SGS-134 has already made the layout model (`moveChartTo`, widened `toggle`, `moveTo` on the hook), `CollapseCaret`, and the page-level `useChartLayout` that `Results` receives as `chartLayout`; this ticket builds the chart-side controls on top of them. The header controls slot (`headerControls`, today the Per villager checkbox) currently renders inside the collapsible chart body, so it vanishes when the chart collapses; the view-toggle ticket needs it in the header.

## Scope

State at `origin/main`, plus the end state of SGS-134 (`CollapseCaret`, `ChartLayoutControls` with `moveTo`, `Results` taking `chartLayout`, the key-results collapse). Everything is in `components/apps/aoe4-build-order/` unless named otherwise. Contract names and shapes are those of `design/M9.md` C3; use them exactly.

- `chart-drag.ts` (new): `dropIndexAt(otherMidpoints, pointerY)`, the pure drop-index math; it counts the other sections whose vertical midpoint is strictly above the pointer (smaller y). A midpoint equal to `pointerY` is not above it and is not counted.
- `use-chart-drag.ts` (new): `useChartDrag(order, onDrop)` returning `{ dragging, start, sectionRef }` per C3, following the pointer rows of the design's behavior table (primary button only, pointer capture, a 4px threshold before a drag starts, `order` unchanged until the drop, no auto-scroll, Escape or `pointercancel` or `lostpointercapture` cancels with no change, a drop at the start index calls nothing). Pointer capture keeps pointer events on the handle but not key events, so the Escape cancel needs a listener that receives keydown while dragging (for example on the document, removed when the drag ends); the mechanism is the implementer's call. The handle must not let a touch drag scroll the page (a style on the handle; the value is left to the implementer).
- `chart-header.tsx` (new): move `ChartHeader` and `ChartControls` out of `line-chart.tsx`, and add `chartHandleKey` (`ArrowUp` gives `'up'`, `ArrowDown` gives `'down'`, any other key gives `null`).
  - `ChartControls` is the C3 shape (`collapsed`, `dragging`, `reorderHelpId`, `onToggle`, `onMoveKey`, `onHandlePointerDown`); `first`, `last` and `onMove` are removed.
  - Header DOM order: the handle button (`chart-drag-handle`, the C3 `aria-label`, `aria-keyshortcuts`, `aria-describedby`), the `h3.h5` title, the `CollapseCaret` (`testId="chart-collapse"`, `name="<title> chart"`, `controlsId` the chart body id), then the `controls` slot. With no `layout` the header renders the title and the slot only, as today.
  - The handle's `onKeyDown` calls `preventDefault()` and `onMoveKey` only for a non-null `chartHandleKey` result; Enter, Space, Home, End and Tab do nothing.
  - Move the layout CSS the header needs from `results.module.css` (`.chartHeader`, `.chartButtons`) and delete rules that nothing uses afterwards.
- `line-chart.tsx`: remove `ChartHeader` and `ChartControls`; `SeriesChart` imports them. It passes its `headerControls` prop to `ChartHeader` as `controls` and stops rendering it inside `chart-body`, so the slot is visible while the chart is collapsed. The chart section sets `data-dragging="true"` while dragged and offers a way for `Results` to attach `useChartDrag`'s `sectionRef` to the section element (the prop name is left to the implementer). The body (`chart-body`, `data-collapsed`, the collapsed empty `hidden` body and its id) is unchanged. Nothing else in `line-chart.tsx` changes (marker and legend work is in later tickets).
- `results.tsx`:
  - Remove the Up and Down buttons' wiring (`first`, `last`, `onMove`) and the `pendingFocus` effect. Call `useChartDrag(layout.order, onDrop)` with a drop that sets the focus target and calls `moveTo`.
  - Visually hidden text uses Bootstrap's `visually-hidden` class (Bootstrap 5 CSS is loaded globally by `pages/_app.js`), as the design names it; no module class is needed.
  - `reorderHelpId` from `useId()`; render one visually hidden `chart-reorder-help` paragraph with that id, text telling the user to drag, or to use the up and down arrow keys; render one `chart-order-status` (`role="status"`, visually hidden) whose text, after any move that changes the order (keyboard or drop), names the chart and its new 1-based position out of the chart count. A move that does not change the order leaves it unchanged.
  - Focus after a move follows C3: a `focusAfterMove` ref holds the moved chart id, set before `move` or `moveTo` only when the order will change; an effect on `[layout.order]` focuses that chart's `chart-drag-handle` and clears the ref. This is the mechanism design question 5 left open; the design settles it.
  - `ArrowUp` on the first chart and `ArrowDown` on the last: no change, no announcement, the ref stays null, `preventDefault` is still called.
  - Passes `controls` to the Gather rates chart exactly as `headerControls` today (the Per villager checkbox rides along unchanged; the view-toggle ticket changes it later).
- Docs made untrue, in `docs/aoe4-build-order.md` (the "Chart controls" paragraph): that each title row holds collapse, move up and move down buttons; that collapsing hides the Per villager checkbox and leaves "the three buttons"; that up is disabled on the first chart and down on the last. Grep the doc and `ARCHITECTURE.md` for `chart-move`, `move up`, `Per villager` and `chart-collapse`, and fix every statement the change contradicts. Add the handle, drag and keyboard reorder, the order announcement and the caret behavior, and that the header controls stay visible when a chart is collapsed. Do not quote measured results.
- Tests:
  - `chart-header.test.ts` (new, `renderToStaticMarkup`, as in `save-build.test.ts`): the `chartHandleKey` table; `ChartHeader` markup order and attributes.
  - `chart-drag.test.ts` (new): `dropIndexAt`.
  - `line-chart.test.ts`: the `chart controls` cases that pin the removed buttons or the slot inside the body move to `chart-header.test.ts` or are rewritten to the new behavior; the cases about `SeriesChart` itself (the collapsed body, the series legend hidden when collapsed) stay and are updated. Removal of the old move buttons is checked by the `chart-move-` search criterion, not by a test: no test asserts the absence of the `chart-move-up` or `chart-move-down` strings (an absence test such as today's "no buttons without layout" case is rewritten to assert no `chart-drag-handle` and no `chart-collapse`). The implementer lists every test it edits.
  - `acceptance/aoe4-chart-layout.spec.ts`: rewrite for the new controls, keeping the cases that still apply (default order, persistence across reloads, normalization of stored values, blocked storage, the split-view case with the step band and pinned lines). Cases that pinned Up and Down become handle cases. Announcement and help-text checks assert the chart title and the position number, not a full sentence.
  - `acceptance/aoe4-gather-rates-per-villager.spec.ts` is not edited unless the slot move breaks it; it is run as part of the check, since the Per villager control moves from the body to the header.
- No hook test in Vitest: the repo has no DOM test environment (`design/M9.md`, Test levels). Events, focus, drag and layout are Playwright cases.

**Out of scope:** the layout model and `CollapseCaret` themselves, the key-results panel, and `use-chart-layout.ts` (SGS-134); view toggles and removing the Per villager checkbox; pinned and marker legend changes; any other `line-chart.tsx` change; a DOM test environment; auto-scroll while dragging; touch-specific tests.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `chartHandleKey` maps `ArrowUp` to `'up'` and `ArrowDown` to `'down'`, and gives `null` for `Home`, `End`, `Enter`, `' '`, `Tab` and a letter. A test covers each; it fails if Enter or Space is mapped.
- [ ] (respec 1) `dropIndexAt` returns the number of other-section midpoints strictly above the pointer. A test covers a pointer above every midpoint (0), below every midpoint (the list length), between two, exactly on a midpoint, and an empty list (0). A midpoint equal to `pointerY` is not counted: `dropIndexAt([10, 20], 10)` is 0, and a test fails if the comparison counts an equal midpoint. A test fails if the count includes midpoints below the pointer.
- [ ] `ChartHeader` static markup, with a `layout`, puts the handle, the title, the `chart-collapse` caret and the `controls` slot in that order; the handle has the `Reorder <title> chart` label, `aria-keyshortcuts="ArrowUp ArrowDown"` and `aria-describedby` equal to `reorderHelpId`; the caret has `aria-controls` equal to the body id and `aria-expanded` matching `collapsed`. With `collapsed` true the `controls` slot is still present. Without `layout` it renders the title and the slot with no handle and no caret. A test fails if the slot is rendered only when expanded.
- [ ] (respec 1) `SeriesChart` static markup, collapsed, has the empty hidden `chart-body` and does not contain the series legend, and still contains the header controls; expanded, the legend is in the body. Search criterion: `git grep -n "chart-move-"` has no match anywhere in the repo (source, tests, acceptance specs, docs) once the ticket is done; no test spells the old test ids to assert their absence.
- [ ] (respec 1) Pointer drag, Playwright (`acceptance/aoe4-chart-layout.spec.ts`): the test makes the whole drag path reachable without scrolling, either by setting a viewport tall enough that all four handles and the drop point are inside it or by collapsing charts first, and reads positions from the sections' bounding boxes. The drop point's y is between the third chart's vertical midpoint and the fourth chart's vertical midpoint, so `dropIndexAt` gives target index 2. With the default order, a mouse drag of the first chart's handle to that point gives the order second, third, first, fourth. During the drag the dragged section has `data-dragging="true"` and the order has not changed yet; after the drop `data-dragging` is gone and `chart-order-status` names the moved chart and its new position. A press and release with under 4px of movement, and a drag cancelled with Escape, leave the order and storage unchanged. A collapsed chart drags like an expanded one.
- [ ] Keyboard reorder, Playwright: ArrowDown on a focused handle moves its chart one place down, the handle keeps focus (checked after the reorder commits), and `chart-order-status` announces the new position. Several ArrowDowns in a row each move one place and each announces. ArrowUp on the first chart and ArrowDown on the last change nothing, announce nothing and keep focus on the handle, and the page does not scroll. A test of a key that must be ignored (Enter, Home) asserts the order is unchanged after the key.
- [ ] (respec 1) Caret, Playwright: clicking `chart-collapse`, and pressing Enter or Space on it, flips `aria-expanded` and the label between `Collapse <title> chart` and `Expand <title> chart`, sets `data-collapsed`, hides the body, and the caret keeps focus. The test asserts the opposite state before each action. The Gather rates header control (Per villager) stays visible and usable while that chart is collapsed, and its choice survives collapsing and expanding. The existing `acceptance/aoe4-gather-rates-per-villager.spec.ts` still passes.
- [ ] After a reorder and a collapse, a reload keeps the order and the collapsed state, and a reload does not rewrite the stored layout (the existing persistence cases still pass in the rewritten spec). The key-results panel collapse from the previous ticket still works and persists beside the chart state.
- [ ] The split-view case still passes: after a reorder the step band and pinned lines show on expanded charts and not on a collapsed one.
- [ ] `Results` renders exactly one `chart-reorder-help` and one `chart-order-status`. The handle's `aria-describedby` target exists and its text mentions both dragging and the arrow keys.
- [ ] (respec 1) `results.tsx` has no `pendingFocus` and no reference to the move buttons; the order-change focus effect and the announcement only fire when the order actually changed (that `focusAfterMove` stays null on a no-op key is a review check on `results.tsx`). A Playwright test fails if ArrowUp on the first chart changes the `chart-order-status` text: it first makes a real move whose announcement names a chart other than the one then in first place (for example ArrowDown on the first chart), records the status text, presses ArrowUp on the chart now first, and asserts the text is unchanged. A wrong announcement would name the first chart, so the text would differ.
- [ ] The docs listed in Scope no longer contradict the code, and the "Chart controls" paragraph describes the handle, the keyboard and pointer reorder, the announcement, the caret, and that header controls stay visible when collapsed.
- [ ] `npx tsc --noEmit`, `npm run lint:dup` and `npm test` pass; `next build` succeeds.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-11

- Underspecified: the `chart-move-` grep conflicted with absence tests, the drag spec left viewport and drop point open against `dropIndexAt`, the on-midpoint case was left to whatever the code returned, and the first-chart ArrowUp focus check could not fail.
- Changed: no absence tests for the old ids (grep only); the drag test makes the path reachable and drops between the third and fourth midpoints; an equal midpoint is not counted; the no-op ArrowUp test checks only the status text after a move that names another chart; Escape listener, Bootstrap `visually-hidden`, and running the Per villager spec are now stated.
- No branch work exists yet; nothing to keep or discard.
