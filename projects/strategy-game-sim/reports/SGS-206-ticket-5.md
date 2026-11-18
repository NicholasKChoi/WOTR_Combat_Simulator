# SGS-206 ticket report 5 (re-spec 2)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-206-chart-table-hover-highlight-and-visible-drag.md

## Summary

SGS-206 "Highlight the hovered or focused chart row and show a chart drag while it happens" (Chore, aoe4-build-order,
Milestone none, Risk standard, about 120 business-logic lines, no dependencies). Re-spec 2 folds in spec-gate report 4.
Verified at origin/main: `vitest.config.mts` runs node-environment tests on `components/**/*.test.ts`, package.json has no
jsdom, happy-dom or testing-library; `use-chart-drag.ts` computes midpoints in `targetIndex` and calls `dropIndexAt`;
`CollapseCaret` (`btn btn-sm btn-outline-secondary`) is shared by `chart-header.tsx` and `compare-panel.tsx`;
`page-help.tsx` says "The Reorder chart handle moves a chart up or down with the mouse or the arrow keys"; and
`aoe4-chart-zoom.spec.ts` already dispatches `pointercancel` on an element (a model for cancel and lost-capture cases).

Changes:
- Gap 1: the drop index and the indicator's slot boundary now come from a new pure function in `chart-drag.ts` (no
  React or DOM). It takes the other charts' rects and the pointer y, and calls `dropIndexAt`, which stays as it is.
  `onUp` and the indicator both call it. A new unit criterion table-tests it: above first, below last, between,
  collapsed, adjacent, and none. Clearing on drop, Escape, cancel and lost capture is now an acceptance criterion: no
  indicator, no transform and no `data-dragging` afterwards, with the indicator checked present first. The old hook-level
  unit-test clause is removed. `chart-drag.ts` is no longer "untouched".
- Gap 2: the Unverified assumptions now say that under pointer capture no element matches `:hover`. Scope keeps the
  no-tint rule on the dragged row and gives focus as its reason. The no-tint criterion now Tab-focuses the handle, then
  drags it.
- Notes: the tint must reach a 1.1:1 contrast floor against the resting background (hover and focus criteria). Any
  opaque button background is scoped to the chart header. If one is added, a test checks that the compare panel's caret
  stays transparent. Mouse-click cases start from a fresh load or a click elsewhere. The `page-help.tsx` wording is
  corrected. A note on stacking order against SGS-203's sticky marker control is added.

Lint: `ticket-lint.py` exits 0.

## Diagrams

None. The change stays in one component, outside the core control loop.

## Open questions

none

## Overlap

SGS-203 (sticky marker control, in progress) overlaps only in stacking order. Scope asks the implementer to check paint
order between the dragged group or indicator and the sticky elements, and to report it. Neither ticket changes the other's
code. No ticket removes or replaces this code.

## Cleanup

No scratch checkout was created and no process was started.
