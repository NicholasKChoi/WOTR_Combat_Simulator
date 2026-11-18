# SGS-206 ticket (report 3, re-spec 1)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-206-chart-table-hover-highlight-and-visible-drag.md

Ticket-lint: passes with exit 0.

## Summary

SGS-206, "Highlight the hovered or focused chart row and show a chart drag while it happens". Chore, component aoe4-build-order, Milestone none, Risk standard, about 100 business-logic lines (up from 70 because of the indicator element and its position), Depends on none, On merge none. The ticket covers:
- a header-row tint on hover (hover-capable devices only) and on keyboard-visible focus, header row only;
- contrast for the tinted row;
- the dragged group following the pointer through a `tbody` transform;
- a measurable drop indicator;
- the drop index and the indicator coming from one computation;
- no layout shift;
- no tint during a drag and no tint left behind after it;
- existing behaviour kept, with a unit test of the drag state;
- the two doc paragraphs.

## Gate findings folded in (from reports/SGS-206-spec-gate-2.md)

1. **Drop indicator position.** The indicator is now a dedicated `data-testid="chart-drop-indicator"` element. It is rendered only during an active drag and absolutely positioned inside a new `position: relative` wrapper `div` around `chart-table`, outside the table. This keeps `acceptance/aoe4-results-split.spec.ts` passing, since it pins the table's children.
   - Scope states the position rule, measured from the same group rects as the drop index:
     - a slot between two other charts is drawn on the boundary between them;
     - slot 0 is drawn above the first other chart;
     - the last slot is drawn below the last other chart.
   - The criteria compare its bounding box, in one evaluate, with the group boxes and the table box. They check that it spans the table's width, touches the right slot's span and touches no other slot's span. A separate criterion covers when it is absent.
   - The box-shadow assumption is removed from Unverified assumptions.
2. **Focus tint.** The rule is `:focus-visible` (for example `tr:has(:focus-visible)`), not `:focus-within`.
   - While `data-dragging` is set, the dragged row shows neither the hover tint nor the focus tint.
   - The criteria fail on a row tinted by `:focus-within` alone. They also cover:
     - a mouse click on the caret or a view toggle leaving no tint;
     - a mouse drop, after the pointer leaves the table, leaving no tint;
     - "no header row's background differs from resting" during a drag, including the dragged row.
   - Escape and arrow-key reorder may show the tint, together with the focus ring.
   - The Chromium `:focus-visible` behaviour and `:has()` support are added to Unverified assumptions. The new acceptance specs exercise both for real.
3. **Contrast.** The pass bar is at least 4.5:1 for the title, grip glyph, caret and view toggle labels. Each is measured against the composited background behind it, with the row tinted by hover and, separately, by keyboard focus.
   - Light scheme only. I confirmed the page has no dark scheme: Bootstrap 5.3 is loaded as precompiled CSS in `pages/_app.js`, its dark scheme applies only under `[data-bs-theme=dark]`, and nothing in the repo sets `data-bs-theme` or uses `prefers-color-scheme`.
   - I added "a dark colour scheme" to Out of scope.

Non-blocking notes folded in:
- **Per-move re-render.** Frame rate is not a criterion. Scope prefers ref-set styles or memoised charts, and the implementer reports which it chose.
- **Page-scroll drift.** A wheel scroll with no pointer move leaves the group and the indicator where they were drawn until the next `pointermove`. The release still uses the current rects. Drift by the scrolled distance is accepted.
- **ChartControls fields.** New `ChartControls` fields are optional, so the literals in `chart-header.test.ts` and `line-chart.test.ts` still compile.

## Finding for the implementer (verified)

I computed this in the session: `btn-outline-secondary` text (#6c757d) is 4.69:1 on white but 4.45:1 on `--bs-tertiary-bg` (#f8f9fa), 3.95:1 on #e9ecef and 3.57:1 on #cfe2ff. Almost any visible tint drops the header buttons below 4.5:1 unless the buttons get an opaque background. Scope says this and leaves the choice to the implementer.

## Diagrams

None needed: single-component change outside the core control loop.

## Open questions

none

## Overlap

None found. TASK-GRAPH shows SGS-206 as `needs_spec`, with no branch and no task checkout, so there is no branch work to keep.
