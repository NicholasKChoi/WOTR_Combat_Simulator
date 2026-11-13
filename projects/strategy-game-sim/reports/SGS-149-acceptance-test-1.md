# SGS-149 acceptance-test 1

Verdict: PASS. Tip 76390a0. No tests written (the diff already edits the acceptance specs); no commit made, worktree clean.

## Harness
acceptanceSetup ran (node_modules linked, Chromium installed). Edited specs `acceptance/aoe4-auto-run-contract.spec.ts` and `acceptance/aoe4-split-tab-order.spec.ts` run with `--repeat-each=5`: 30 passed (18.0s), unmutated.

## Mutation checks (each undone with `git checkout --`, `git diff --exit-code` clean)
1. Auto-run: `acceptance/helpers.ts:185` `await gate` replaced by `await Promise.race([gate, 400ms timer])` (delay shorter than HELD_RESPONSE_WAIT_MS = 1000). 3 of 3 repeats failed at spec line 44, the still-`running` assertion after the wait (`Expected "running", Received "current"`). No earlier assertion failed; the `answered` assertion was not reached.
2. Column swap: `workbench-tabs.tsx:89,100` swapped the two column testids. Both tab-order tests failed at `expectInOrder` ("stop => stop.column === 'results-column' is reached after the previous stop"), not at chart-rendered or handle-stop.
3. Caret moved before handle, all charts: `chart-header.tsx` caret line placed before the handle button. Failed at "chart-units-produced handle comes before its caret" (handle-before-caret).
4. Caret before handle, last chart only (Floating resources): failed at "chart-floating-resources handle comes before its caret". The walk did not throw.
5. Handle removed, last chart only: failed at "every chart section has a handle stop" (presence assertion, not a walk error). Run twice.
6. Caret removed, last chart only: failed at "chart-floating-resources has a caret stop" (presence assertion, not a walk error).
7. Last chart section removed (`results.tsx` order filter): both tab-order tests failed at "every chart section is rendered".

The pass-on-unmutated criterion holds: a held request never answered before `release()` passes (30/30 above).

## Failures
None. No impl-defect or spec-gap.

## Notes
- Mutations 5 and 6 were first run concurrently in the same worktree; mutation 5 was then rerun alone with the same result.
- Not covered by this run: the `build-store.test.ts` memory-store mutations (unit tests, not acceptance; the implementer's report covers them). The walk's `MAX_PRESSES` end case was not mutated.
- Nothing left running; no `.env.local` read; `test:blob-live` not run.
