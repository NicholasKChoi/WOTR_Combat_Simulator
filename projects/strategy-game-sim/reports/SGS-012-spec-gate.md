# SGS-012 spec gate

Verdict: READY

## Checks
1. Grounded scope: PASS. At 6013fcc, 4 `<Link><a>` sites exist (pages/index.js 27,33; components/layout.js 42,55). tsconfig has target es5 and moduleResolution node. acceptance/helpers.ts, playwright.config.ts, vitest.config.ts exist. `beforeEach` in combat-simulator-battles.spec.ts uses networkidle (line 39). lockfileVersion is 2. Registry versions (next 16.4.3, react 19.3.1, typescript 7.0.2, vitest 5.0.5, @types/react and @types/react-dom 19.3.0) match the table.
2. Testable criteria: PASS. All are command- or output-based. The "no new console errors or hydration warnings" and "clicked through under npm run dev" items are manual but observable.
3. Open questions: none; the owner answers are folded in (respec 1).
4. Invariants: S2, H1-H3, W1-W2 named; no criterion contradicts them.
5. Contracts: no new schema or API. openapi.json must stay unchanged.
6. Dependencies and size: none; ~20-35 LOC business logic.
7. Diagrams: none triggered.
8. Lessons: LESSONS.md files are empty.
9. Decisions: agrees with the CONTEXT.md "Dependency upgrade" decision.
10. On merge: names REPO.md acceptanceHarness, design/M2.md Recharts section, and the CONTEXT.md decision line.
11. Risk: high is right (public /api/fight, invariants touched, framework majors).

## Notes (non-blocking)
- Item 4 leaves the flake fix open (helper vs warm-up vs data-hydrated hook). The criteria bound it (root cause named, no assertion weakened, retries/skip grep empty), so the implementer's choice is safe. Hydration waits could also be needed by the other specs that use networkidle (combat-simulator.spec.ts:6, combat-simulator-validation.spec.ts:39, fight-api-caps.spec.ts:120). The ticket says "specs that click Fight!"; the implementer should apply it to every spec that interacts with the form.
- If a `data-hydrated` hook is added under components/apps/combat-simulator/, it touches the WOTR component paths. The ticket allows it as test-only, which is acceptable.
- TASK-GRAPH row lists component `repo`, ticket says `site`. Align them.
- On merge says "designer switches Recharts to 3.10.1". That is design work done after merge, which is fine. The M2 design currently pins 2.15.4 and rejects 3.x on the very grounds this ticket removes.
- The "two consecutive green cold acceptance runs" criterion depends on the root cause being fixed. If the cause turns out to be outside the harness, the implementer should return a blocker instead of weakening the criterion.
