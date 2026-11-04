# SGS-083 spec gate 2: READY (risk low confirmed)

Base checked: origin/main b9481e3.

All three gate-1 gaps are closed: zero-length span now draws a ReferenceLine with the same testid and has an
acceptance row; the owner questions are answered and removed; row sharing, the table-warning interaction and the
reset mechanism are each specified one way.

Checks: grounded (TimelineRow, timelineRows, StepTimeline, SeriesChart, Results, step-timeline-rows.test.ts with its
`timing` and `rowsOf` helpers all exist; the new acceptance spec is marked new; results.tsx is StepTimeline's only
caller). Criteria are observable and compare against the simulate response, not hand-computed values. No open
questions. Invariants: S1 only. Contracts: StepTiming fields match model.ts. Size about 70 lines. No diagram trigger.
Risk low (optional prop, UI only, no criticalPaths symbol). Docs: the timeline paragraph (docs/aoe4-build-order.md
~line 910) is scoped. No trust-boundary input.

## Notes (non-blocking)
- The zero-length acceptance row has no fallback if no shipped build has a step with completedAt === startedAt (the
  waiting row has one). Add: use a pasted build with an instant move/rally/pause step.
- The docs criterion "no sentence implies the timeline has no interaction" is loose; the implementer should grep the
  timeline paragraph only.
- Scope 4 leaves the band colour and opacity to the implementer; fine for a low-risk UI change.
