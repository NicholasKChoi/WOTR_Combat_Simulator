# SGS-215 spec gate 10

Base origin/main 7d74800 (fetched). ticket-lint.py with --spec: exit 0, no errors, no warnings.

## Verdict: READY

Re-spec 3 changed two things since gate 6 (READY): the population-wait criterion and the lift-paragraph sentence. Both check out.

## Checked

- **Population-wait criterion.** The ENG 1TC row is removed from the criterion. The existing branch test "occur only before the cap at a lowered cap of 30" is the right case. It sets `maxPopCap` 30 and arms a men-at-arms step at 800 s. It asserts `populationCapReachedAt < 800`, the ordering the criterion requires. Review-8 reports it fails when the gate keeps the old check. The branch still holds the ENG 1TC row, and the criterion says to delete it.
- **Doc sentence.** The branch (ae92952) `docs/aoe4-build-order.md` lines 373-375 carry the old wording ("skip the supply check and go on to their resource, building and busy checks"). The exact replacement the ticket gives is therefore a well-defined edit. The old wording appears nowhere else in `docs`, `lib` or `data`.
- **Gate code at base.** The two supply comparisons are `simulate.ts` line 412 (the `produce` handler) and line 616 (`payOrder`). The `populationCapReachedAt` field on `Engine` (line 149) and the `noteCapReached` cast match the ticket.
- **Earlier gate findings.** Gates 4 and 6 verified the cap instants, build-file consumers, existing-test sweep and doc quotes. Nothing in the base has moved since, so they still hold.
- **Other items.**
  - Risk `high` is right, and each hotspot has a failing-test criterion: the lift condition, the same-instant order and the S3 bound.
  - Open questions: none. Dependencies: none.
  - Size is about 40 lines of business logic.
  - `On merge: none` is correct.
  - There are no exception clauses against rules stated elsewhere and no input-validation change.

## Notes (non-blocking)

- The retune of `english-spear-longbow-maa-crossbow.json` is exploratory. The ticket says the task reports `blocked` if no retune within the documented plan meets the builds bar.
- The S3 bound is a wall-clock bound set from the measured run with headroom, as the ticket says.
