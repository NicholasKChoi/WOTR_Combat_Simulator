# SGS-037 spec gate 1

Verdict: READY

Checked against design/M3.md, CONTEXT.md, INVARIANTS.md (A1-A3, S3), SGS-035 (dependency), and the main-branch code.

1. Grounded scope: model.ts, simulate.ts (return at ~696-707), result-series.test.ts, the contract spec (`simulationResult` literal, RESPONSE_SCHEMAS, closed-schema loop) and docs Outputs list all exist as described. depletion.ts is declared new. `GATHER_NODES`, `RESOURCE_KINDS`, `RESOURCE_TOLERANCE`, `format-time.ts` come from SGS-035 scope items 1, 2 and 10 and match.
2. Criteria: all have observable outcomes with concrete numbers, orderings and messages.
3. Open questions: none; CONTEXT.md has none.
4. Invariants: A1, A2, A3, S3 named and consistent. No contradiction.
5. Contracts: every name, signature, message, ordering rule and OpenAPI schema matches the design Contracts, Depletion recording, Warning messages and OpenAPI sections.
6. Dependencies and size: SGS-035 stated; ~195 LOC.
7. Diagrams: trigger does not fire (engine loop untouched).
8. Lessons: both LESSONS.md files are empty.
9. Decisions: consistent with the design.
10. On merge: none needed (no new command or design doc).
11. Risk: high, correct (`lib/**` criticalPaths).
12. Docs: the Outputs list is in Scope. Lines 25/323/617 stay true while the engine treats nodes as infinite.

## Notes (non-blocking)
- Message grammar at count 1 is unspecified ("1 villagers are idle there", "1 villagers arrived"). The design gives only plural examples. Suggest the ticket say either "always plural, as in the examples" or specify singular forms, so a reviewer does not bounce it. No criterion test uses count 1 for a node-depleted message.
- The design says every OpenAPI schema is the target of at least one `$ref`, but `NodeRef` is unreferenced until D. The ticket handles this and exempts it. No every-schema-referenced test exists in the contract spec today, so the "if it exists" hedge is harmless.
- The `StepWait` schema is also unreferenced until H lands (the `SimWarning` `step-stuck` variant's `waitingOn` does reference it, so it is fine).
- Other `SimulationResult` literals: grep found only the result-series.test.ts literal; type-only uses elsewhere need no change.
