# SGS-190 simplify, pass 1

Branch sgs-190-busy-building-wait, tip d550fdc (unchanged, no commit made). Nothing pushed.

Loaded: common.md, REPO.md (styleSources ARCHITECTURE.md, tsconfig.json), LESSONS.md (one Playwright-only entry, not touched by this diff).

Reviewed the full diff against origin/main (simulate.ts, engine-common.ts, research.ts, test-helpers.ts, the new simulate-busy-buildings.test.ts, edited research and acceptance tests, docs).

Findings: no trim worth making.
- Production code is minimal: one shared predicate (instanceFree) used by both handlers and the production pass, one `held` field, one optional `hold` on StepStart. No duplication or dead code.
- Comments each state a hidden constraint (what `held` is and who sets it, reserve semantics) and are short.
- Tests already table-driven (it.each); shared helpers (startingWith, tierCountAt) were moved into test-helpers rather than copied. Remaining local helpers (researchTargets, outcomeOf, timed) each have one purpose and no existing equivalent to reuse.
- Considered and rejected: simplifying the `instanceFree` held condition (would hide the null case), and merging researchTargets with research.test.ts recordTargets (different recorded shape, would touch unrelated code).

Verification: `npx tsc --noEmit` clean; `vitest run lib/aoe4-build-order` excluding acceptance files: 40 files passed, 1 skipped; 1581 tests passed, 15 skipped. No browser or e2e tests run. Behavior and timing pins untouched.
