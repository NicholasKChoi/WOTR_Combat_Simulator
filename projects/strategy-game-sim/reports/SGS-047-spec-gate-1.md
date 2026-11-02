# SGS-047 spec gate 1

Verdict: READY

Checks
1. Grounded scope: results.tsx, the page (runSimulation, result state, Results call at line 95), docs page section (~545-575) and parseBuildOrderText exist. New files are marked new. formatBuildStep and format-time.ts come from SGS-040 and SGS-035 (SGS-035 item 10 matches the import path). vitest includes components/**/*.test.ts, so the pure-module split is correct.
2. Criteria are observable (unit and Playwright, grep checks).
3. Open questions: none. CONTEXT.md has none.
4. Invariants: none adjacent. Criteria do not touch A2 or A3. Only displays.
5. Contracts: StepTiming.waitingOn, waitBreakdown, status values, ids step-timeline and step-timeline-row with data attributes, and the fixed breakdown order all match design/M3.md (Contracts, Step status, Page props, Behavior row timeline).
6. Size ~70 lines, under 400. Dependencies stated.
7. Diagrams: not required, correctly stated.
8. Lessons: both LESSONS files are empty.
9. Decisions: body agrees with the design (format-time import per respec 1).
10. On merge: none is right.
11. Risk low is consistent: no lib/** edit, no strongModelTrigger.
12. Docs: docs/aoe4-build-order.md page section is in Scope; audit left to SGS-054 as designed.

Notes (non-blocking)
- Depends-on omits SGS-045 although Scope item 3 places the timeline "below the message lists SGS-045 adds" and both edit results.tsx. Add SGS-045 to Depends-on, or say "above the charts" only if 045 is not merged.
- Playwright paste `start -> sheep` + `build kings-palace from wood`: expected waitingOn is whatever the response says (the test reads it), so fine. The implementer should confirm the paste validates (no 400).
- "No horizontal overflow at 1280 px" in the last criterion has no stated test. Optional: assert scrollWidth <= clientWidth on the table wrapper in Playwright.
- The Playwright ENG 1TC reaction expectation depends on SGS-040 having added the gold reaction to english-1tc.json; SGS-040 is listed only for formatBuildStep. Mention it in Depends-on.
