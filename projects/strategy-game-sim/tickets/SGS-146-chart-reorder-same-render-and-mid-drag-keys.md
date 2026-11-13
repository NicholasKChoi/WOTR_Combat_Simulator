# SGS-146: Fix chart reorder status and bounds after two moves in one render, and arrow keys mid-drag

- **Type**: Bug
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: low
- **Risk**: low
- **Invariants**: none
- **Unverified assumptions**: none
- **LOC estimate**: 40 (`Results.moveByKey` and `placeChart` in `results.tsx`; a session-active guard in `use-chart-drag.ts`)
- **Depends on**: none
- **On merge**: none
- **Source**: owner backlog triage Q64 approved 2026-11-12 (reports/backlog-triage-1.md): the "two activations in one render lose one" bullet (from SGS-114) and the "arrow keys mid pointer-drag leave a stale drag start" bullet (SGS-135 review-1, non-blocking)

## Context

Two defects in chart reordering, both rarely reachable. (1) At the base `useChartLayout` (`use-chart-layout.ts`) already
applies `move`, `moveTo` and `toggle` through a functional `setState`, so the stored layout composes correctly when two
activations land in one render. The render-time reads that remain are in `Results` (`results.tsx`): `moveByKey` computes
the target index and its bounds check from `layout.order` of the current render, and `placeChart` builds the
`chart-order-status` text from the same render's order, so a second arrow press before a re-render announces the wrong
position or passes/fails the edge check against a stale order. (2) `useChartDrag` (`use-chart-drag.ts`) records
`startIndex` on pointer down; an ArrowUp or ArrowDown on the handle while the pointer is still down
(`chart-header.tsx` `onKeyDown` -> `onMoveKey`) reorders the charts, so on pointer up the `target !== startIndex` check
compares against an order that no longer holds and the drop either does nothing or lands wrong. Existing tests do not
cover either: there is no component test infrastructure (vitest runs in node, no jsdom), and
`acceptance/aoe4-chart-layout.spec.ts` presses keys and drags only separately.

## Scope

- `results.tsx` (`Results`, `moveByKey`, `placeChart`): derive the destination index, the edge no-op check and the
  announced position from the layout the move is actually applied to, not the render-time `layout.order`. A small pure
  helper over `ChartLayout` in `chart-layout.ts` (or the hook returning the resulting position) is the likely seam; the
  implementer picks it. Check whether `toggle` and `moveTo` callers read render-time layout anywhere else and fix those
  too (`grep` callers of `useChartLayout` controls in `results.tsx` and any key results panel that shares the layout).
- `use-chart-drag.ts` (`useChartDrag`) and `results.tsx` (`moveByKey`): while a pointer drag session is active (from
  pointer down until it finishes, including before the 4px threshold), an arrow key on the handle changes nothing and
  announces nothing. Escape and cancel behavior is unchanged. Expose the session state from the hook for `moveByKey` to
  read, or equivalent.
- `docs/aoe4-build-order.md` (chart controls paragraph: "A chart is reordered by dragging its handle ... or with ArrowUp
  and ArrowDown while the handle is focused"): add the rule that arrow keys do nothing while a pointer drag is in
  progress.
- Existing tests: a test of the changed behavior gets the new expected value; any other keeps its assertions. The
  implementer lists every test it edits.

**Out of scope:** adding jsdom or a component-testing library; changing `moveChart`, `moveChartTo` or
`toggleChartCollapsed` semantics; the drop-index calculation in `chart-drag.ts`; persistence in `useChartLayout`.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] Two reorder key activations applied against the same starting layout (before a re-render) end with both moves applied, and the status text for the second names the chart's position after both moves; a test fails if the position or the edge check is read from the pre-move order. The test targets a pure helper or the hook's updater, since the repo has no component test setup.
- [ ] An arrow key that would move a chart past either end, including as the second activation of a same-render pair, changes nothing and announces nothing.
- [ ] Pressing ArrowUp or ArrowDown on a handle while its pointer is held down (before and after the 4px threshold) leaves the order unchanged and announces nothing, and releasing the pointer then drops the chart as the pointer's height places it, exactly as with no key press. An acceptance test in `acceptance/aoe4-chart-layout.spec.ts` covers a key press mid-drag followed by a drop that changes the order, and fails at the base.
- [ ] After the pointer drag ends (drop, Escape, cancel), arrow keys on the handle reorder again.
- [ ] A single arrow press with no drag still reorders, moves focus to the moved handle and announces the new position, as before.
- [ ] The doc statement about arrow-key reordering is updated for the mid-drag rule; no doc claims arrow keys reorder during a drag.
- [ ] No INVARIANTS.md regressions

## Open questions

none
