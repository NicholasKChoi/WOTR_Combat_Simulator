# SGS-215 spec gate 6

Base origin/main 7d74800 (fetched). ticket-lint.py with --spec: exit 0, no errors, no warnings.

## Verdict: READY

Both mechanical gaps from gate 4 are closed.

- The retune criterion now covers every unit test and spec that loads `english-spear-longbow-maa-crossbow.json`, and re-pins the two values that move: the gold run-out time in `builds.test.ts` and the 1800 s Spear/Longbow digest in `simulate-house-gate.test.ts`.
- The pre-cap criterion now says strictly before the fractional cap instant, with an integer `durationSeconds`.

## Verification done

- **Consumers of the build file.** `git grep` at origin/main finds these loaders: `acceptance/aoe4-simulate-api-{deer-pack,house-rule,prebuilt-farms,prebuilt-plans,spear-longbow-build,unit-lines}.spec.ts`, `lib/aoe4-build-order/builds.ts` (read by `builds.test.ts` and the house-gate test), and `data/aoe4-build-order/README.md`. All are named in the criterion or reached through the "every test and spec that loads" rule. `PRODUCTION_FLOORS` is used only by `builds.test.ts` and `aoe4-simulate-api-prebuilt-farms.spec.ts`, and both are covered.
- **Cap instants.** Gate 4's measurements still apply, since the base is unchanged. ENG 1TC is 1094.94, Knight/Longbow 1247.01 and Council Hall 1158.20. An integer horizon strictly below each gives a `null` `populationCapReachedAt`.
- **Earlier checks that still hold.**
  - Gate code and the `noteCapReached` cast match the ticket.
  - The same-instant criterion holds.
  - The population-wait rule holds.
  - The existing-test sweep finds only the tests Scope names.
  - The Scope doc quotes match the base.
  - No stale doc is left out of Scope; the SGS-216 items are marked out of scope.
- **Other items.**
  - Risk `high` is right.
  - Each hotspot has a failing-test criterion: the lift condition (`populationCapReachedAt` and supply), the same-instant order, and the S3 bound.
  - The retune is data checked by `builds.test.ts`, with an explicit `blocked` outcome if no retune meets the bar.
  - Open questions: none.
  - Dependencies: none.
  - Size is about 40 lines of business logic.
  - There are no exception clauses against rules stated elsewhere, no input-validation change, and `On merge: none` is correct.
  - Unverified assumptions: none is right, since the change is internal code.

## Notes (non-blocking)

- The retune is exploratory (the implementer picks a reaction, rally or timing). If no retune within the documented plan meets the bar, the task reports `blocked` and the manager re-plans. The ticket states this.
- The S3 criterion is a wall-clock bound. Setting it from the measured run with headroom, as the ticket says, is enough.
