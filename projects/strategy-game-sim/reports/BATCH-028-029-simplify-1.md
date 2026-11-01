# BATCH-028-029 simplify pass 1

/simplify was invoked via the Skill tool on both branches, each with 4 reviewer agents (reuse, simplification, efficiency, altitude).

## sgs-028-aoe4-parse-build-order-text
Rebased onto 72d74a0 (0002170), then simplify commit. Final tip: 442832e. tsc clean; npm test 16 files, 318 tests (was 320 before removing 2 determinism tests).

Changes made:
- parse-text.ts: GATHER_NODE_ORDER now built from a `satisfies Record<GatherNodeId, 0>` literal, so a new node id is a compile error instead of a node silently dropped by formatStart.
- parse-text.ts: inlined the one-use LINE_BREAK constant.
- parse-text.test.ts: deleted two determinism tests on pure functions (could not fail for a real reason).

Declined (behavior change, larger restructure, or low value): lone-\r line split; action table unification and assertNever default (cast branch serves the "never throws" test); parse-loop flag refactor; ID/INSTANCE_REF regex dedupe, optional-field helper, withWalk reshaping, formatStart return shape; unit/acceptance test overlap and wall-clock perf tests (ticket-tied, left for review); micro-efficiency items (negligible at paste scale). Reuse: no duplication found.

## sgs-029-aoe4-validate-build-order
Rebased onto 442832e (`--onto 442832e 16f757f`), then simplify commit. Final tip: d8bce08. tsc clean; npm test 18 files, 486 tests.

Changes made:
- validate.ts: producer checks use `.some(e => e.producedBy.includes(...))` instead of building a Set per step.

Declined: typing STEP_FIELDS/SimInputs tables against the model, narrowing stepShape into a type guard, trigger table, FieldSpec split, readNumber/readNode plumbing (medium type-level refactors, scope beyond quality trim); moving entriesOf into data.ts and a shared node-id list (outside the diff); isKnownId .some (existing length>0 already cheap); resolveTrips caching (not called in a loop); INPUT_DEFAULTS/SIM_INPUT_BOUNDS cosmetic tidy; unit/acceptance duplicate coverage and the exports-keys test (left for review).

Nothing pushed. Both worktrees are on their branches.
