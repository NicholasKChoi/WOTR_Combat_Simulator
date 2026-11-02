# SGS-055 spec gate 1

Verdict: NEEDS_SPEC

## Gaps
1. Scope flow step 4 and AC "Flow test: step-timeline-row count is 3" - FLOW_PASTE has one `start` line plus two steps (`produce ... x3`, `@25:00 produce ... x1`). `start` is not a step (design: the table and timeline are per `StepTiming`, one per step; the ticket itself says `step-row` count is 2). So the timeline has 2 rows and the not-reached row is `data-step="1"`, not `"2"`. An implementer would either write a failing test or add a line. Fix: change to "2 `step-timeline-row`; row `data-step="0"` completed, not flagged, contains `x5`; row `data-step="1"` `not-reached`, `data-flagged="true"`" in Scope step 4 and the AC (also the "row 2 (`@25:00`)" wording).

## Checked and fine
- Grounded: helpers at spec lines 22-35 exist; `acceptance/helpers.ts` exists; `INVALID_PASTE` text matches the table-unavailable test.
- Test ids match design/M3.md table; SGS-046 follows (`step-field-count`, `step-field-reaction` only on depleted trigger rows, `step-table-unavailable`).
- Depletion premise: SGS-039 sheep 3000; SGS-037 `node-depleted` is `warning` when idleVillagers > 0; time trigger beyond horizon gives `not-reached` with `waitingOn: 'trigger'` per design status table, no `step-stuck`.
- Reaction test: 3305 s figure and 3600 s cap consistent with design line 645 and SGS-039; the designer open question has a stated fallback (edge, acceptable).
- Risk standard is right (test-only, `acceptance/**` is not a criticalPath). No invariants, no On merge need, no docs made stale. Size fine.

## Notes
- Open question fallback ("assert only data-reaction at 1200 s") is vague; fine since it is edge-only.
- Mutation check AC 2nd clause: removing the ENG 1TC reaction step would also fail SGS-039/040 data tests first; harmless.
