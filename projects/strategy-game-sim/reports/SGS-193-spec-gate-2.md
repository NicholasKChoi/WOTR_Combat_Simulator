# SGS-193 spec gate 2

Verdict: READY

Read at origin/main, plus SGS-192's ticket (not integrated) and design/M11.md. No scratch checkout was made.

## Re-spec 1 and 2 gaps, now closed

- **Castle Age and Barracks text.** Scope and the criteria now assert the full text: the entries, then the tail. B-W10 and design C17 agree with the table. Nothing is omitted by `waitTargetKey`. The design's M11.5b acceptance sentence says the same (`Castle Age 20:00, still waiting for Castle Age`).
- **UI doc.** `docs/aoe4-build-order-ui.md` lines 102-104 hold the "in that order" sentence and the `still waiting on <cause>` sentence. Scope and a criterion now fix them in this ticket. Line 20, the popover sentence, quotes no wait text.
- **Busy case.** It first asserts exactly one non-zero entry, then the text. The `The ` drop and the `a free` form match the C6 table.
- **Open questions.** None remain.

## Checks run

- **Grounding.** `stepRun`, `blockedByText`, `BREAKDOWN_ORDER`, `formatWaitBreakdown` and `StepRun.waitBreakdown` exist at origin/main as the ticket describes. No other component code reads them.
- **Contracts.** `waits`, `waitingForText`, `waitDetailText` and the `StepTiming` fields match design C17, C5 and C6 and SGS-192's Scope. SGS-192 keeps `waitBreakdown` on `StepTiming`, so the A2 test (a detail that disagrees with `waitBreakdown`) can fail.
- **Existing tests.**
  - `step-annotations.test.ts` depends on the change: the `formatWaitBreakdown` rows (lines 55-58), the `StepRun` table (182-191) and the `annotationDetailText` table (243-246). The "rule, not closed list" wording covers them.
  - The `run()` fixture in `step-annotation.test.ts` (line 19) has `waitBreakdown: []`, so it needs the new fields.
  - The `blockedBy` strings in `step-annotation.test.ts` are plain inputs and need no change.
  - `acceptance/aoe4-step-annotations.spec.ts` asserts `step-blocked-by` only at lines 114 (`not reached`) and 137 (empty), as the ticket says.
  - No other acceptance spec asserts the run-cell text. `aoe4-simulate-api-*` specs use the API `waitBreakdown`, which this ticket does not change.
- **Risk.** Standard is right: the page only reads the result, and no `criticalPaths` symbol is touched.
- **Invariants.** A2 is named and the criteria follow it.
- **Dependencies and size.** The Depends-on is SGS-192, and about 50 business-logic lines is well under 400. Nothing else in TASK-GRAPH removes or rewrites `stepRun` or `blockedByText`. SGS-199 (help modal) and SGS-200 (docs) depend on this ticket, and the help modal text is out of scope here.
- **Diagrams, On merge, validation, unverified assumptions.** All consistent.

## Notes

- Acceptance specs may import `waitDetailText` from `wait-detail.ts`. That lets the spec word a detail with the production function, so a wording bug would not fail it. Wording is fixed separately by the `wait-detail.test.ts` rows in SGS-192. This is acceptable.
- `docs/aoe4-build-order-format.md` lines 393-397 and 468 describe `waitBreakdown` and the engine. They remain true after this ticket. SGS-200 owns the `waitDetails` additions to them.
