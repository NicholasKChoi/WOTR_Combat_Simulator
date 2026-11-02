# SGS-056 ticket report 1

File: tickets/SGS-056-aoe4-strict-null-checks.md. Measured on origin/main d5c2549: `npx tsc --noEmit --strictNullChecks` gives 177 errors, matching the plan (per-file counts match; combat-simulator/simulate.ts errors at 76, 85, 113 x2). Size about 177 one-line edits, 32 in business logic. Risk high (by caution; see note in ticket). Depends on none. Diagrams: none required. Open questions: none. Overlap: none with existing tickets; B (schema) depends on this one.
