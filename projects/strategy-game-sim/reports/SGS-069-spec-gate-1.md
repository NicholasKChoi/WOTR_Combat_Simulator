# SGS-069 spec gate 1

Verdict: READY

Checked against origin/main d5c2549.

1. Grounded: step-timeline-rows.ts, step-timeline.tsx, compare.ts, compare-panel.tsx, their tests, both acceptance specs and docs/aoe4-build-order.md exist; simulate.ts ~903 sets waitingOn for every not-reached step. Docs lines 806-812 and 822-828 match the described paragraphs. "Waited on"/"Stuck on" appear only in step-timeline.tsx 24-25 plus docs 824-827 ("a dash when").
2. Criteria testable; test-rule stated as a rule (Write). Grep criteria hold in the end state.
3. Open questions: none; CONTEXT.md none.
4. Invariants: none adjacent; A1-A3 untouched.
5. Contracts: KeyValue, CompareRow, LONG_WAIT_SECONDS, test ids match design C10/C11 and the Behavior tables. Four props match design C11 and SGS-072 (which adds pinnedName/alreadyPinned).
6. Size ~150 LOC, dependency SGS-056 stated.
7. Diagrams: none triggered.
8. Lessons: both LESSONS.md empty.
9. Decisions: consistent.
10. On merge: none needed.
11. Risk: standard fits (no critical path, no trigger).
12. Docs in scope with grep instruction.

Notes (non-blocking):
- Criterion "pinned 1200 s vs current 300 s": military-600 is also run-ended on the 300 s side; the criterion names only 900 and 1200. State that 600 also reads "run ends at 5:00" so the test does not guess.
- A nonzero delta that rounds to 0 (military < 0.5, time < 0.5 s formatted 0:00) would read "+0 resources" / "0:00 earlier". Consider deciding rounding before the direction check or leave as is.
