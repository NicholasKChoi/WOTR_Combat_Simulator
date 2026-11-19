# SGS-210 spec gate 6

**Verdict: READY**

ticket-lint (graph, spec, origin/main): no errors, no warnings.

The one gap from spec-gate-4 is closed. The planner row 7 criterion now pins the selected cause: `waitingOn` `earlier-step`, `waitingForText` `null`, and `blockedBy` ending `not reached (earlier-step)` with no `still waiting`. It also says copy 2's recorded wood seconds appear in the merged `waits`, and gives copy 2 a non-empty `waitDetails`. This agrees with the Scope merge rule and with the row 6 criterion. A test can fail if the selected cause is copy 2's wood wait.

Re-read at origin/main: `blockedByText`, `waitingOn`, `waitingForText` and `LONG_WAIT_SECONDS` exist in `step-annotations.ts` as the ticket quotes them. Items 1 to 16 hold as in gate 4. Nothing in the re-spec changed Scope, risk (`standard`), or the dependency on SGS-208.

## Notes

- Design C5's "as `blockedByText` does today" is deliberately departed from per planner row 6, and the ticket says so.
- The doc-wording search criterion for `docs/aoe4-build-order-ui.md` is allowed (doc text only).
