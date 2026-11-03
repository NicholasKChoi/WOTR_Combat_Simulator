# SGS-081 re-spec (ticket-3)

File: tickets/SGS-081-aoe4-retune-prebuilt-farms.md. Closes spec-gate-1 gaps; changed lines tagged (respec 2).

- Scope 3: the closed pin list is replaced by a rule. Any test that pins a shipped build's output or step index and fails after the re-tune is re-derived (or its index moved to the same step). It is never loosened, skipped or deleted, and the report lists it with old and new values. Grep seed given: 30 files on main today, including `builds.ts`, which is not a test. Known pins are kept as seeds, and `aoe4-simulate-api-timelines.spec.ts` (`steps[4]`, `steps[14]`, `steps[22]`) is added.
- Scope 1: step numbers are 0-based `steps[]` indexes. Scope 4 notes the README's "step 24" is 1-based (index 23, checked on main) and is updated if a step is inserted before it.
- SGS-079 is integrated (main 0367fce): the conditional is removed and main's README text is the starting point. The README grep criterion baseline is now 0 on main (verified).
- Stack: 080 and 081 ship as one stack. 080's branch may leave shipped-build assertions failing, and 081 takes over every failing test 080's report lists (Base line, Scope 3, criterion).
- Criteria: the diff-stat allow-list now covers any `lib/aoe4-build-order/*.test.ts` or `acceptance/aoe4-*.spec.ts` that pins a shipped build and is listed in the report. The full AoE4 unit and acceptance sets must pass.
- Open questions: none. Overlap: SGS-080 (stacked base).
