# SGS-133 spec gate 2

Verdict: NEEDS_SPEC (two narrow gaps, both about the capped-state test; the round-1 gaps are closed)

Read at origin/main. SGS-132 has no local branch, so its layout came from its ticket only. I ran no tests (browser-based, dependency unbuilt).

## Round-1 gaps

1. Capped state may not exceed the cap: closed. Scope now gives the exact steps, an add-content rule (hint, then name error), a fixed 1280x720 viewport, and a `designer` stop. Criterion 3 asserts the precondition first.
2. `overflow-anchor` placement: closed. It goes on the page section (the `<section>` at pages/apps/aoe4-build-order.tsx:339, which `useRunBarHeight` finds with `closest('section')`), with a scoped `:global(html):has(.runBar)` fallback and a stop. The mutation run is in criterion 1.
3. Unnamed helpers: closed. Scope names `saveCopy`, `submitCopy`, `blockStorageWrites` and the `refused` clipboard scripts. All are still local in aoe4-my-builds.spec.ts at the base (lines 549-576, 1242). Scope tells the implementer to move any that remain local.
4. Notes (horizontal overflow, focus ring, `auto-run-status` rect, steps for (c)): all added as criteria 5-7 and Scope bullets.

Spot checks that hold: `.runBar` and the `max-width: 767.98px` static block exist; `useRunBarHeight` behaves as described; the doc statements are at docs/aoe4-build-order.md lines 873 and 921; the existing split-scroll test at line 105 exists; no `overflow-anchor` anywhere; Risk, Invariants, On merge, Depends-on and size are fine. The existing my-builds layout test (line ~1288, bar at most 0.4 of the viewport) still passes under a cap, so it needs no edit.

## Gaps

1. **Acceptance criterion 5 (save-copy-cancel below the bar at scrollTop 0) - the precondition rule does not guarantee it.** Scope's add-content rule stops once `scrollHeight > clientHeight`. The content that causes the overflow may sit below `save-copy-cancel`: the order is save-row, then copy form (with cancel), then hint, unavailable warning, error, and `auto-run-status`. A small overflow can leave cancel fully visible at `scrollTop = 0`, so a correct implementation fails "bottom below the bar's bottom", and the implementer must guess whether to add more content. Proposed fix: make the Scope rule's stopping condition "the bar's content exceeds its box and `save-copy-cancel`'s bottom is below the bar's bottom at `scrollTop = 0`", assert both in the precondition `page.evaluate`, and keep the `designer` stop if adding all the listed real content still fails. Also state that `save-copy-cancel` is the last focusable control only if the added hint and error contain no controls; otherwise name the control that is.

2. **Acceptance criterion 6 ("when it is shown") can pass vacuously.** If `auto-run-status` is not shown in the capped state, the check does nothing, yet Scope says it is "reached by scrolling the bar". Proposed fix: the precondition asserts `auto-run-status` is shown (say how the state gets it, for example through a run that has completed or is current, using the existing `waitForRun` helper), and the check then requires its rect inside the `run-bar` rect after `scrollTop` is maximal. If it cannot be shown in that state, say the criterion drops it and the ticket keeps only the test id check.

## Notes

- If gap 1's fix needs the viewport to change, it is a `designer` call, as Scope already says. No `owner` gap.
- The `max-height: 40dvh` in Scope is a design constant, which is fine.
- Criterion 9 requires helpers to be defined once; SGS-132 also moves helpers. Whichever merges second should rebase onto the other's `acceptance/helpers.ts`; Depends-on SGS-132 already orders them.
