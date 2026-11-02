# SGS-039 re-spec 1 (designer pass 4)

Edited in place: tickets/SGS-039-aoe4-triggers-reactions-default-amounts.md.

- 3c: validate.ts scope now says `depleted` uses `nodeRefIssue(value: unknown, finiteOnly): NodeRefProblem | null` (null = valid, problem is `{ code, reason }`), reports the problem's code, message `${reason} in ${path}`. Removed the "reports whatever SGS-038 defines" wording.
- 5a: wait accounting scope names `accrueWait(engine, stepIndexes, seconds)` as the only writer of `waitBreakdown` (criterion already greps for a single write site).
- Re-spec bullet at the end updated to match (no new section).
- Verified against design/M3.md: triggerWakeAt, triggerHolds, reactions, waitBreakdown, SIM_INPUT_BOUNDS.triggerAtLeast, trigger table and node names match; left unchanged.
- Risk: high (unchanged). Open questions: none.
