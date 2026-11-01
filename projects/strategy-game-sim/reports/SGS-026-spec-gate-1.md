# SGS-026 spec-gate 1

Verdict: READY. Confirmed risk: high (cross-component contract; strongModelTriggers). No criticalPaths in REPO.md.

Checks (base origin/main 68e004a)
1. Grounded: model.ts and data.acceptance.test.ts exist. The test "model.ts exports exactly the 16 documented types..." is at line 310 with 16 sorted names. model.ts has no rally step, BuildStart or BuildOrder.start. The produce comment on main (line 12) says "rally is required for villagers". Outside model.ts, only that test mentions BuildStep or BuildOrder in code (docs hits are prose).
2. Criteria testable: yes (tsc, export-list test, grep for runtime exports).
3. Open questions: none in the ticket or CONTEXT.md.
4. Invariants: adjacent A1-A3 not touched (types only). Ticket does not name them. Non-blocking.
5. Contracts: BuildStart, rally variant, BuildOrder.start position, BuildOrderLines and the produce comment match design/M2.md lines 56-64 and 86, and reports/M2-designer-line-map.md. SGS-014 is merged.
6. Size ~20 LOC, dependencies stated.
7. Diagrams: not triggered.
8. Lessons: both LESSONS.md files are empty.
9. Decisions: consistent with the design (rally at t=0, villager produce rally sets standing rally).
10. On merge: none is correct.
11. Risk: high is correct.
12. Docs: docs/aoe4-build-order.md is stale (produce row, BuildOrder JSON shape at line 254) but is explicitly Out of scope and owned by SGS-025 (draft, no dependency between the two; both land before SGS-028/029). Grep found no other stale doc or comment (model.ts line 44 SimInputs comment already mentions rally).

Gaps: none blocking.

Notes (non-blocking)
- Criterion 2 does not say where the type-level check with @ts-expect-error lives. Vitest does not typecheck, so it must be in a file that `npx tsc --noEmit` covers. Suggest naming it, e.g. a small block in data.acceptance.test.ts or a new lib/aoe4-build-order/model.types.test.ts; LOC estimate would grow slightly. An implementer can reasonably choose, so not blocking.
- Optionally name INVARIANTS A1-A3 as "not adjacent" in the ticket.
- Test title edit: also update the "16" to "18" and keep the sorted order (BuildOrderLines sorts after BuildOrderIssue? Sort is by default code-unit order: BuildOrder, BuildOrderIssue, BuildOrderLines, BuildOrderNote, BuildStart, BuildStep, ...). Implementer should re-sort, not append.
