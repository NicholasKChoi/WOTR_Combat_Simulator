# SGS-206 review 8

Verdict: **APPROVE**

Branch `sgs-206-chart-table-hover-and-drag`, tip `e9d022197f095e59083189d640ca033d987e47d6`, base `origin/main`. Full review (not delta). Type: Chore. The new acceptance specs are deliberately absent (the acceptance-test gate writes them), so their absence is not flagged.

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria

The behavior criteria below are judged from the code and from the UI inspection (see the end of this report). Their acceptance tests belong to the acceptance-test gate, which writes them next.

- Hover tint at 1.1:1 or more: **pass (behavior)**. `chart-header.module.css:5-9`, `.headerRow:not([data-dragging='true']):hover` inside `@media (hover: hover)`, uses `var(--bs-secondary-bg)`. Inspection at 1200, 1280 and 1800: the hovered Gather rates header row is `rgb(233, 236, 239)` and the other rows are `rgba(0,0,0,0)` over white. That is about 1.19:1. Moving the pointer off restores it. The test is pending.
- Focus tint by `:focus-visible`, not `:focus-within`: **pass (behavior)**. `chart-header.module.css:11-13`. Inspection: Tab to the Units handle tints that row only. After a fresh load, a mouse click on the Gather rates caret followed by moving the pointer off leaves every header row untinted. Body rows stay `rgba(0,0,0,0)` in every state. The test is pending.
- Contrast of 4.5:1 or more: **pass (behavior)**. Computed in the inspection with the tint on:
  - title `#212529` on the `#e9ecef` row: about 13:1;
  - grip, caret and unpressed toggle `#6c757d` on an opaque `#fff` button background: about 4.69:1;
  - pressed toggle `#fff` on `#6c757d`: about 4.69:1.

  The opaque background (`--bs-btn-bg: var(--bs-body-bg)`) is scoped to `.headerRow .btn-outline-secondary` (`chart-header.module.css:1-3`). `collapse-caret.tsx` and the global classes are untouched, so the compare panel's caret keeps its transparent background. The test is pending, including the required `compare-collapse` assertion.
- Slot function unit table: **pass**.
  - `chart-drag.ts:17-26` `dropSlotAt` calls `dropIndexAt` on the rects' midpoints and does not copy the rule.
  - `chart-drag.test.ts` covers every case the criterion names: above the first chart, below the last, between two charts (with a gap), between two collapsed charts, adjacent charts, and no other charts.
  - I checked every hardcoded index by hand: each equals `dropIndexAt` over the row's midpoints.
  - A boundary drawn at the wrong slot fails the per-row `boundaryY` values and the span loop.
  - The existing `dropIndexAt` rows are unchanged. 15 tests pass.
  - The implementer's mutation list covers each row.
- One computation: **pass**. `use-chart-drag.ts:20-26` `slotAt` is the only place rects are measured. `onUp` (line 71) uses `slotAt(...).index` and `onMove` (line 65) uses `slotAt(...).boundaryY`. The hook builds no midpoint list of its own.
- Dragged group follows the pointer at 60% opacity, and the other charts do not move: **pass (behavior)**.
  - At each width, dragging past the third chart gives the units group `matrix(1,0,0,1,0,1281.8)`, opacity 0.6, and its top moves from 733 to 2015.
  - The own-slot move gives `translateY(20)`.
  - The other groups' tops are identical before and during the drag.
  - The test is pending.
- Indicator position: **pass (behavior)**.
  - At 1280, dragging the first chart past the third chart's midpoint puts the indicator at 2155.6 to 2157.6, across the boundary at 2157 between the third and fourth charts. It spans the table from 649 to 1183, matching the table's left and right edges.
  - At its own slot the indicator is at 1206.75 to 1208.75, on the second chart's top at 1208.
  - 1200 and 1800 give the same pattern.
  - The test is pending.
- Drag state clears: **pass (behavior)**. `finish` (`use-chart-drag.ts:44-56`) is the single path for drop, Escape, `pointercancel` and `lostpointercapture`. It clears the transform and `indicatorTop` and calls `setDragging(null)`, which unmounts the indicator (`results.tsx:157`). Inspection: there is no indicator and no transform below the threshold or after Escape. The test is pending.
- Indicator and drop agree: **pass (by construction)**. Both use the same `dropSlotAt` call over the same rects. The drop path `onDrop(id, target)` is unchanged. The test is pending.
- No layout shift: **pass (behavior)**. The indicator is absolutely positioned in a new wrapper outside the table, and the dragged group moves by `transform` only. The table box and the other groups' boxes are unchanged before, during and after the drag in the inspection. The test is pending.
- No tint during a drag: **pass (behavior)**. Both tint rules carry `:not([data-dragging='true'])`. `chart-header.tsx:30` sets `data-dragging` on the header row from the same `layout.dragging` that sets it on the `tbody`. Inspection: no header row is tinted during the drag. The Tab-then-drag sequence was observed in the implementer's probe, not in mine. The test is pending.
- Existing behavior holds (Chore): **pass**.
  - No pre-existing test file has an assertion changed: `git diff` on test paths shows only added `dropSlotAt` cases.
  - Keyboard reorder, `chart-layout.ts`, `use-chart-layout.ts` and the storage key are untouched.
  - The implementer's record shows the existing `aoe4-chart-layout`, `aoe4-split-tab-order` and `aoe4-results-split` specs passing (37). I did not run them, per the review rules.
  - I read `aoe4-results-split.spec.ts:42`, which reads `table.children`. Those are still the colgroup and the `tbody`s, because the indicator sits outside the table.
  - The `startDrag` helper reads the other groups' boxes before the drag, so the dragged group's transform does not affect it.
- Docs: **pass**. The Chart table and Chart controls paragraphs of `docs/aoe4-build-order-ui.md` state the header-row-only tint on hover and keyboard focus, the dragged chart following the pointer, and the `chart-drop-indicator` (own slot included). The phrase saying a drag only dims the chart is gone. I checked each claim against the CSS, the hook and the inspection.
- No INVARIANTS.md regressions: **pass**. See below.

## Invariants touched

- A1, A2, A3 (AoE4, Paths match `components/apps/aoe4-build-order/**`): **all hold**. The diff touches only UI markup, CSS and drag state. It adds no simulation literal, no spend and no randomness or wall-clock dependency.
- S1 to S3 and the site-wide invariants: not touched.

## Spec checklist

- Contracts: no API, field or metric names were added or changed. `dropSlotAt`, `GroupRect` and `DropSlot` are new internal exports, not Key surfaces.
- Scope: no out-of-scope item is implemented (no auto-scroll, no animation, no dark scheme, no compare panel change). There is no `golang/` diff.
- No invented constants answer open questions. `INDICATOR_HEIGHT_PX` is the indicator's own size; see the notes.
- Naming: fine.

## Lint

`npx tsc --noEmit`: clean. `npm run lint:dup`: 0 clones. `npx next build`: ok.

## Bot reconciliation

There is no `reviewBot.cli` or `rulesFile`, so there were no bot findings.

## Conventions

- The CSS token fallbacks (`var(--bs-primary, #0d6efd)`) match the siblings at `results.module.css:69,73`.
- The `x === null ? null : <El/>` conditional matches `build-text-editor.tsx:50` and `step-table.tsx:265`.
- `dropSlotAt`'s table uses `it.each` with tuples, like the existing `dropIndexAt` table (`chart-drag.test.ts:5-14`).
- The header button override stays in the component's own CSS module, as the ticket requires.

No departures.

## Non-blocking notes

1. `use-chart-drag.ts:5` `INDICATOR_HEIGHT_PX = 2` repeats `results.module.css` `.dropIndicator { height: 2px }`. If one changes without the other, the line drifts off-centre from the boundary. Centring in CSS (`transform: translateY(-50%)`) would remove the TS constant. The slot test's half-pixel tolerance is unaffected today.
2. The ticket's Visible drag section says the hook "exposes" the offset, drop index and indicator position. The hook instead applies them by ref and exposes only `dragging`, `wrapperRef` and `indicatorRef`. The ticket's Cost per move section prefers a ref-set style, and the implementer reported that choice, so I read this as within the contract.
3. With no other charts, `boundaryY` is `null` and the mounted indicator gets no `top`, so it falls to its static position below the table. This cannot happen with the fixed four charts.
4. In a header row with two view toggle buttons, those buttons overlap by 1 px. This is Bootstrap's `btn-group` negative margin and already exists at the base, not a defect.
5. The stacking report is fine: dragged group `z-index` 2, indicator 3, sticky run bar 10 above both. The marker control's stickiness is not in this base, so that overlap was not checked.

## UI inspection

I served the task checkout (`npx next dev`, port 3877, stopped afterwards; the port is free) and ran `inspect.cjs` with the task checkout's Playwright. Widths 1200, 1280 and 1800 (the REPO checklist widths) at height 900, and 3200 for the drag. Views and states:

- at rest;
- hover on the Gather rates header row;
- Tab focus on the Units handle;
- after a fresh reload, a mouse click on the Gather rates caret, then the pointer moved off;
- below the threshold (2 px);
- drag past the third chart's midpoint;
- drag back to the chart's own slot;
- after Escape.

What the checks found:

- Clipped overflow: none in any state. The document has no horizontal overflow at any width.
- Overlap among header-row controls: only the 1 px `btn-group` overlap (note 4).
- Mid-word wraps: none.
- Computed backgrounds: as listed under the criteria. The tint shows on the hovered or keyboard-focused header row only, never on body rows, and no row is tinted during the drag.
- Indicator box: as listed under the criteria.

Screenshots read: `1280-hover.png` shows a grey tint on the Gather rates header with white opaque buttons and legible text. `1280-drag.png` shows the dimmed Units produced group drawn over the Gathered and Floating charts, and the blue indicator line at the Gathered/Floating boundary spanning the table. Neither shows a visible defect.

## Coverage

Files reviewed:
- `components/apps/aoe4-build-order/chart-drag.ts` and `chart-drag.test.ts`
- `components/apps/aoe4-build-order/use-chart-drag.ts`
- `components/apps/aoe4-build-order/results.tsx` and `results.module.css`
- `components/apps/aoe4-build-order/chart-header.tsx` and `chart-header.module.css`
- `docs/aoe4-build-order-ui.md`

Also read for context: `line-chart.tsx` (`tbody`), `collapse-caret.tsx`, `chart-view-toggle.tsx`, and the drag cases in `acceptance/aoe4-chart-layout.spec.ts`.

Unit tests run: `chart-drag`, `chart-header`, `line-chart` and `compare-panel` (64 pass). The new acceptance specs were not reviewed because they do not exist yet. The REPO checklist step "load each touched page with npm run dev" was covered by the inspection.
