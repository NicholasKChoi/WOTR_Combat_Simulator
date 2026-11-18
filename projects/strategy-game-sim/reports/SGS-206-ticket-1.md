# SGS-206 ticket report 1

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-206-chart-table-hover-highlight-and-visible-drag.md (lint clean)

Summary: Chore, component aoe4-build-order, Milestone none, Priority medium, Risk standard, about 70 business-logic lines, no dependencies.
(1) The chart header row is tinted on hover (hover-capable devices only) and on `:focus-within`, using a Bootstrap token; the body row is not tinted.
(2) `useChartDrag` exposes the dragged id, the pointer offset and the live drop index. The dragged `tbody` follows the pointer by transform at the existing 60% opacity. A layout-neutral drop indicator marks the slot. The indicator and `onDrop` use one drop-index computation.
Keyboard reorder, the drop rule and the stored layout are untouched.
Criteria cover hover, focus, contrast, follow-the-pointer, indicator position and agreement with the drop, no layout shift (one `evaluate`), no hover tint during a drag, unit tests of the drag state including clearing on Escape, existing tests keeping their assertions, and the docs paragraphs in `docs/aoe4-build-order-ui.md`.

Design choices made without asking (pre-approved run): "row" means the chart's header row only (the body row is the plot, with its own hover and drag-to-zoom). The indicator also shows at the chart's own slot.

Unverified assumptions listed: Chromium applies a transform to a `tbody`, `box-shadow` paints on collapsed-border cells, and row `:hover` matches over any cell.

Diagrams: none (single-component, outside the core control loop).
Open questions: none.
Overlap: SGS-203 edits `results.module.css` (sticky marker control) and SGS-204 edits `line-chart.tsx` (dots); different rules and regions, so no Depends on, only possible textual merge conflicts.
Type note: the owner-visible behavior change is new feedback, filed as Chore per the manager's instruction; the ticket states that the saved order, keyboard reorder and drop rule do not change.
No scratch checkout made, nothing running.
