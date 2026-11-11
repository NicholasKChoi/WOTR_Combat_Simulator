# SGS-116 spec gate, round 2

Verdict: READY

Read at origin/main after `git fetch origin`. No Depends-on.

## Round 1 gap

The `git grep -n "Waited"` criterion now excludes `*.test.ts` and `*.test.tsx` by pathspec, so it holds in the end state where the unit tests assert the `Waited` label. Closed.

## Checks

- Grounded scope: on origin/main, `step-annotation.tsx` has `StepTimes({ run })` with no `labelled` prop and `step-waited` rendering `formatMinSec(run.waitSeconds)`. `build-text-editor.tsx` line 43 has the `Waited ...` title. `step-table.module.css` line 16 has `max-width: 7.5rem`. `finishedText` is in `step-annotations.ts`. The named acceptance case "a not-reached step reads an en dash..." exists at spec line 94, so the run-cell extension is grounded. Its `blockedBy` is `not reached (<waitingOn>)`, so the gutter-title prefix `Still waiting. Blocked by: not reached (` is consistent with the simulator.
- Testable criteria: each has an observable outcome (text, title, computed style, `scrollLeft`, a `page.evaluate` measurement). No stale counts or line numbers are pinned. Existing-test rule is stated ("every test the change makes untrue is edited; the implementer lists them").
- Open questions: none. Decisions: the body agrees with design/M8.md C12 and the M8.5 row (`Started`/`Finished`/`Waited` labels, `still waiting`).
- Invariants: `none`, and the change is display only, so it does not touch any.
- Contracts: `waitedText` and `labelled` match C12.
- Size about 90 LOC, dependencies none, diagrams not required.
- Risk low: no strongModelTriggers or criticalPaths touched.
- On merge `none` is valid.
- Docs: `docs/aoe4-build-order.md` paragraphs are named in Scope. No other file mentions `Waited` outside the two source files and the spec.
- Input validation: not applicable.
- Lessons: Playwright computed styles are used, with no CSS-class assertions in unit tests.

## Notes (non-blocking)

- Design M8.md M8.5 row mentions the vitest `css` setting for unit tests; the ticket deliberately puts visual-state checks in Playwright and leaves the setting to the unit-test-debt ticket. This is consistent with Out of scope.
- The select-fit measurement is delicate; the implementer should run it with the cap restored to confirm it fails, as the criterion says.
