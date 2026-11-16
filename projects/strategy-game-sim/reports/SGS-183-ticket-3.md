# SGS-183 ticket report 3 (re-spec 2)

- Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-183-tabs-layout-cases-to-default-viewport.md
- Lint: `ticket-lint.py` clean.

## Summary

SGS-183, "Move the tabs-layout acceptance cases to the default viewport and drop the remaining tab steps". Component: aoe4-build-order. It changes only test code (0 business-logic lines) and depends on nothing. Re-spec 2 fixes the two first/last-chart arrow-key cases in `acceptance/aoe4-chart-layout.spec.ts`. At 1280x720 the charts scroll inside `results-column`, not the window, so the cases' window precondition cannot hold. Each case now positions the column so `results-column` `scrollTop` is greater than 0 and less than `scrollHeight - clientHeight`. It asserts that before the key press, and after it asserts that both the column's `scrollTop` and `window.scrollY` are unchanged. A new `(respec 2)` criterion pins this behavior and adds a mutation check: removing `event.preventDefault()` from `ChartHeader`'s handle `onKeyDown` in `components/apps/aoe4-build-order/chart-header.tsx` must fail both cases. Scope and the Existing tests line are tagged `(respec 2)`. The `## Re-spec 2 - 2026-11-16` section is appended.

## Verification (scratch checkout ticket-SGS-183 at bfe505d, removed afterwards)

- The `results-column` test id is in `workbench-tabs.tsx` (split render). The design (M10.md C1 and Decisions) keeps it after the code ticket SGS-184.
- I measured with a probe spec at 1280x720:
  - Aligning the handle to the center (`block: 'center'`) leaves the column at `scrollTop` 0 for the first chart, so the precondition fails for ArrowUp.
  - Aligning it to the start (`block: 'start'`) gives 224 for the first chart and 1914 for the last, with a column max of 1932.
  - The window stays at `scrollY` 245, its max, in every run.
- Mutation (removed `preventDefault`):
  - With `block: 'start'`, the column moves 224 -> 184 (ArrowUp) and 1914 -> 1932 (ArrowDown). Both cases are caught.
  - The window never moves, so the window check alone does not tell the passing and failing code apart. It stays only as an extra assertion.
  - With `block: 'center'`, the ArrowUp case misses the mutation. The ticket records this as a measured note.

## Other cases with the window-scroll assumption

There are none in the eleven files. The only other scroll reads are:
- the drag reorder `boundingBox` reads at 1280x2800
- the `scrollIntoView` plus `window.innerHeight` check in `aoe4-build-order-step-band.spec.ts`

Both pass on the branch, and Scope says so.

## Existing branch work

All of bfe505d stands. The implementer edits only the two cases.

## Diagrams

None ("no diagram required" sentence unchanged).

## Open questions

none

## Overlap

None new. SGS-182 already scopes the `build-column` scroll case for `aoe4-auto-run.spec.ts` the same way, so the two tickets are consistent.
