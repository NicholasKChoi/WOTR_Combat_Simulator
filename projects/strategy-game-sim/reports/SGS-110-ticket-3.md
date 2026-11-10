# SGS-110 ticket author, re-spec 2

File: tickets/SGS-110-text-gutter-annotations.md (ticket-lint clean).

- Tone call is `annotationToneClass(annotation.run ?? undefined, annotations.stale)`; SGS-108 signature unchanged.
- Gutter `li` renders SGS-108's `StepTimes` unconditionally when `annotation.run !== null`; all "written directly" / conditional extraction wording removed (Scope 2, Out of scope, lint:dup criterion, which now also requires no local step-started/step-finished markup). SGS-110 makes no `StepRunCell` or `step-annotation.tsx` change. `StepTimes` added to the dependency end-state list.
- Null run: gutter shows the kind border only (as StepRunCell: no times, no warning); new clause in the blank/comment/start criterion. The en dash is attributed to `formatStepTime`/`finishedText` (SGS-107), passed through StepTimes.
- Re-spec 2 history section appended. Open questions: none.
