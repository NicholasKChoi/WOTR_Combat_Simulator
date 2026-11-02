# SGS-057 spec gate 3

Verdict: READY

Checked every top-level identifier in origin/main lib/aoe4-build-order/validate.ts (479 non-blank lines) against the ticket's moved set and kept set.

Moved (nodeRefIssue, NodeRefProblem, SIM_INPUT_BOUNDS, INPUT_DEFAULTS, resolveSimInputs and helpers): bound, InputBound, TRIP_FIELDS, DEPOSIT_NUMBER, isGatherNode, inputIssue, readNumber, readRecord, resolveTrips, resolveNodeAmounts, resolveInfluence.
Kept: ValidateOptions, FieldSpec, req, opt, STEP_FIELDS, VILLAGER, stepWhere, producedBy, TRIGGER_FIELDS, isTriggerKind, triggerShape, TriggerProblem, rangeProblem, TRIGGER_CHECKS, stepShape, OrderChecker, validateBuildOrder.

Names used on both sides (the export list must cover these):
- SIM_INPUT_BOUNDS, nodeRefIssue, NodeRefProblem, resolveSimInputs: the four re-exports. Covered.
- issue (kept: OrderChecker; moved: none directly, but moved code builds on outOfRange/isRecord), outOfRange (kept: rangeProblem, OrderChecker; moved: readNumber), isRecord (kept: triggerShape, stepShape, OrderChecker; moved: readRecord, resolveSimInputs), isBoundKey (kept: stepShape, checkField), isKnownId (kept: checkField; moved: resolveTrips, resolveInfluence, resolveSimInputs), entriesOf (kept: producedBy callers, checkField, checkRules, checkResearch; ENTRY_TYPES is used only by entriesOf, so it moves with it). Covered.
- Types: BoundKey (FieldSpec, rangeProblem; moved readNumber), IdKind (FieldSpec; entriesOf, isKnownId), Where (OrderChecker, stepWhere, issue), Fields (kept widely; moved readNumber, readRecord, resolveTrips). Covered.
- No other identifier crosses. VILLAGER, stepWhere, producedBy, rangeProblem, STEP_FIELDS, TRIGGER_* are used only by kept code, as the ticket says. TRIP_FIELDS, DEPOSIT_NUMBER, isGatherNode, ENTRY_TYPES are used only by moved code.

Export list is complete: C2 list + nodeRefIssue, NodeRefProblem, issue, outOfRange, isRecord, isBoundKey, isKnownId, entriesOf, BoundKey, Where, Fields, IdKind.

Cross-checks:
- validate.acceptance.test.ts line 26 asserts `Object.keys(validateModule)` equals exactly SIM_INPUT_BOUNDS, nodeRefIssue, resolveSimInputs, validateBuildOrder. The ticket re-exports only those four runtime names and imports the helpers without re-exporting, so this passes unedited. Types are erased.
- Importers of validate (route, specs, tests) use only the four names plus ValidateOptions. Covered by the re-exports.
- Criterion 3 grep (`(const|function|interface) (SIM_INPUT_BOUNDS|...)`) matches 5 lines in validate.ts today and 5 in schema.ts after, as long as validate.ts re-exports with `export { } from` or `export type { }` (no declaration keyword). Holds.

Notes (non-blocking)
- validate.ts will have imports left unused after the move: GATHER_NODES, MAX_DEPOSITS, FINITE_NODE_REFS, nodeKindOf, SimInputs, TripInputs, FiniteNodeRef, GatherNodeId. Remove them (lint/tsc noUnused). Not worth a ticket edit.
- `NodeRefProblem` re-export from validate.ts needs `export type` under isolatedModules; implementer detail.
- schema.ts needs the villager-producer set for the start-rally rule; it would use `producedBy`/`VILLAGER` logic that stays in validate.ts. The implementer must write it fresh in schema.ts without copying lines (lint:dup threshold 0); SGS-075 removes validate.ts afterwards.
