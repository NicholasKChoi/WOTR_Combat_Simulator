# SGS-068 spec gate 1

Verdict: READY

Checked against origin/main, design/M4.md (C2, C9, Step table rules), SGS-057 and SGS-059 tickets, INVARIANTS, LESSONS (both empty).

1. Grounded: step-table.tsx, step-table-model.ts, step-table-model.test.ts, acceptance/aoe4-step-table.spec.ts, docs/aoe4-build-order.md exist. parseUnsigned, selectChoices, changeAction exist. step-table.module.css is new (stated). OPTIONAL_STEP_FIELDS, BuildOrderCatalog (names, nodes, defaultStart, startVillagerTotal) are defined by SGS-057/C2, reachable through SGS-059 -> SGS-075 -> SGS-057.
2. Criteria: grep hit counts verified on origin/main (6 label hits, 1 label={field.name}, 3 Up/Down/Delete lines, 2 doc hits at docs lines 772/774). Existing-test rule is stated as a rule (click step-more first). Existing FORMS and unknown-value tests stay valid because set optional fields load expanded.
3. Open questions: none; re-spec answers match design table.
4. Invariants: S3 named, no contradiction. 5. Contracts: FIELD_LABELS and test ids match C9 exactly.
6. Size: about 230 LOC, one transitive dependency. 7. Diagrams: none needed. 9. Decisions agree with design. 10. On merge none: correct.
11. Risk standard: no trigger (under 250 LOC, UI only, no criticalPaths symbol). 12. Docs: the one paragraph is in Scope; grep found no other statement in docs or READMEs.

Notes (non-blocking):
- Depends on lists only SGS-059; SGS-057 symbols arrive transitively. Fine, optionally add SGS-057.
- The 390 px criterion says "the start row's controls stack the same way" without naming controls; suggest naming start-field-rally and the first start-villagers-count (stacked, larger y) at 390 px.
- Start rally select with a pasted unknown node is not specified; the text would fail to convert before the table renders, so it is unreachable in practice.
