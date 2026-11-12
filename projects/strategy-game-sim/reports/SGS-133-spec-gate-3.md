# SGS-133 spec gate 3

Verdict: READY

Read at origin/main. SGS-132 has no local branch, so its layout came from its ticket. No tests were run (browser-based, dependency unbuilt).

## Round-2 gaps

1. Precondition did not guarantee `save-copy-cancel` below the bar at scrollTop 0: closed. Scope's rule and criterion 3 now require both `scrollHeight > clientHeight` and the cancel bottom below the bar bottom, asserted in the precondition `page.evaluate`. A fixed 1280x720 viewport and a `designer` stop remain. Criterion 5 states that cancel is the last focusable control because the added hint and error hold no controls.
2. `auto-run-status` check could pass vacuously: closed. The state completes a run via `waitForRun` (exported from `acceptance/helpers.ts`, line 165), the precondition asserts it is shown, and criterion 6 requires its rect inside the bar at maximal scrollTop.

## Spot checks (all hold)

- `.runBar` sticky plus the `max-width: 767.98px` static block exist in `workbench.module.css`; no `overflow-anchor` exists anywhere.
- The page `<section>` (`pages/apps/aoe4-build-order.tsx:339`) is `utilStyles.headingMd` plus `container`.
- `saveCopy`, `submitCopy` and `blockStorageWrites` are still local in `acceptance/aoe4-my-builds.spec.ts` (lines 549-576). The ticket tells the implementer to move any that remain local. `scrollInstantly`, `expectNoRun` and `SPLIT_VIEWPORT` are exported from `helpers.ts`.
- SGS-132 ticket agrees with the layout this ticket describes: `save-panel` on its own row, `save-row` first, then the copy form, hint, unavailable warning and error; `auto-run-status` stays after the save panel and keeps its test id.
- Risk (standard), Invariants (none), On merge (none), Depends-on and size (~20 LOC plus tests and docs) are fine. Open questions: none. Unverified assumptions cover scroll anchoring, the overflow side effects and the `ResizeObserver`.
- Docs scope names the doc statements, with no measured values.

## Notes (non-blocking)

- The test-state steps and helper moves overlap SGS-132's helper moves in `acceptance/helpers.ts`. Depends-on already orders them, so the second merge rebases onto the first.
- The 40dvh cap is a design constant. The 1280x720 state may come in under the cap after SGS-132. Scope has the add-content order and the `designer` stop for that.
