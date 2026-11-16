# SGS-183 spec gate 3 (re-spec 2)

Verdict: READY

Read at origin/main after `git fetch origin`, and the task checkout at tip bfe505d for the two re-spec 2 claims. No scratch checkout made, none to remove.

## Re-spec 2 changes checked
- `results-column` exists: `workbench-tabs.tsx` line 100 sets `data-testid="results-column"` and the `column` class only when `split`. `workbench.module.css` has `overflow-y: auto` rules (lines 11 and 39), so the column is the scroller in the two-column layout.
- The ArrowUp/ArrowDown first/last-chart cases in `aoe4-chart-layout.spec.ts` (lines 160-177) assert today `before.y > 0` and `before.y < before.max` on the window and call `scrollIntoView({block: 'center'})`. That matches the ticket's description of what cannot hold at 1280x720.
- The mutation criterion can fail. The handle's `onKeyDown` in `chart-header.tsx` (lines 40-45) calls `event.preventDefault()` on ArrowUp/ArrowDown, which is what stops native scrolling. Removing it lets the key scroll the focused column, so a before/after `scrollTop` comparison fails.
- The precondition is a range (greater than 0 and less than scroll extent), not a pinned value. The `block: 'start'` guidance is a suggestion backed by a measurement and is not a pinned number.
- The window check stays as an extra assertion, so no coverage is lost.
- The claim that no other case in the eleven files has the window-scroll assumption is consistent with the file grep: the remaining scroll reads are `boundingBox` reads and the step-band `scrollIntoView` check.

## Other checks (unchanged since gate 2)
- Earlier criteria were already closed in gate 2. Risk low, Invariants none, Unverified assumptions none, On merge none, Open questions none.
- A grep of `chart-layout`, `step-table`, `marker-labels`, `m4-flow` and `run-errors` at the branch tip finds no `TABS_VIEWPORT`, `showTab`, `workbench-tabs`, `tab-build`, `tab-results` or `PHONE`, so the branch's earlier work matches Scope.
- Docs, input validation, dependencies and throwaway-work checks do not apply (test-only, no overlap with SGS-184).

## Notes
- The criterion's `preventDefault` mutation is run by the implementer and recorded; review should confirm that record.
- The "cases deleted are absent" criterion is diff-shaped, but Scope names each case, so it is unambiguous.
