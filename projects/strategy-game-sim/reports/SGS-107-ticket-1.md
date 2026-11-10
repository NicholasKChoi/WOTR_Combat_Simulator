# SGS-107 ticket author report 1

File: `.claude/code-factory/projects/strategy-game-sim/tickets/SGS-107-step-annotation-model.md`
Lint: `ticket-lint.py` printed no errors.

Summary: "Add the step annotation model and resultsStale", component aoe4-build-order, milestone M7 (M7.1, M7.2, M7.4 model), risk standard, depends on none, about 180 logic lines plus about 200 test lines. It renames `step-timeline-rows.{ts,test.ts}` to `step-annotations.{ts,test.ts}` with `git mv`, updates the three importers, adds `StepRun`, `StepAnnotation`, `BuildAnnotations`, `AnnotationInput`, `alignSteps`, `buildAnnotations`, `finishedText`, and `stepSpan(timing: StepTiming, end)` (all design names), and adds `resultsStale` to `auto-run.ts` without wiring it. `timelineRows` and `TimelineRow` stay exported until the timeline is deleted. `results.tsx` highlight moves to `stepSpan(result.steps[activeStep], ...)`.

Criteria cover: the file rename and no stale import (a grep stating the end state); exports; `alignSteps` table with every design sample (duplicates rows catch a missing suffix cap); `buildAnnotations` cases; `StepRun` per status including the 59.9 and 60 s long-wait boundary; `finishedText`; `resultsStale` status by live-equal-or-different table (including an empty duration); the `stepSpan` table unchanged in value; and no app behavior change.

Diagrams: none (single-component, outside the control loop). Open questions: none. Overlap: none with existing tickets. Later outlines B, C and D depend on this ticket's names.

Notes: I did not run the grep criterion on a checked-out tree. I read the importers from origin/main (`git grep` shows `line-chart.tsx`, `results.tsx`, `step-timeline.tsx` and the test file), and Scope lists them. A search of `docs` and `README.md` for `step-timeline-rows` and `stepSpan` found nothing.
