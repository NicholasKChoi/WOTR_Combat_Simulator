# SGS-146 ticket report

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-146-chart-reorder-same-render-and-mid-drag-keys.md
Title: SGS-146: Fix chart reorder status and bounds after two moves in one render, and arrow keys mid-drag
Type Bug, Priority low, Risk low, Component aoe4-build-order, Milestone none, Depends on none, LOC about 40. Lint clean.

Findings that shaped the ticket:
- The backlog bullet about `useChartLayout` is partly stale. At origin/main the hook already uses functional `setState`, so the stored layout composes. The remaining render-time reads are in `results.tsx` (`moveByKey` target index and edge check, `placeChart` status text from `layout.order`). Scope targets those.
- Mid-drag arrow keys: `useChartDrag` records `startIndex` at pointer down and nothing blocks `onMoveKey` during a session. Fix: ignore arrow keys while a drag session is active.
- No jsdom or component-test library exists, so criteria call for a pure-helper unit test plus a Playwright test in `acceptance/aoe4-chart-layout.spec.ts`.
- `docs/aoe4-build-order.md` chart-controls paragraph needs the mid-drag rule.

Open questions: none. The ignore-keys-mid-drag behavior is the author's choice, consistent with Escape cancelling a drag.
Overlap with other tickets: none found.
Diagrams: none (single-component).
