# SGS-007 spec gate

Verdict: READY

Checked against origin/main d54af2e, REPO.md, LESSONS.md (repo and project, both empty), CONTEXT.md, INVARIANTS.md.

1. Grounded scope: PASS. `utils/utils.ts` exports `shuffle` and clones with `[...array]`, as the ticket says. `package.json` has only a `dev` script. `tsconfig.json` has `include **/*.ts`, `moduleResolution node`, `isolatedModules`, `jsx preserve`, `strict false`, `skipLibCheck true`. `golang/frontend/src/App.test.js` exists. `vitest.config.ts` and `utils/utils.test.ts` are new. `lib/` does not exist on main, so the throwaway-file criterion is right to say "throwaway".
2. Testable criteria: PASS. Each has a command and an observable exit code or listing. Mutation checks are concrete.
3. Open questions: none on the main path. The SGS-002 merge-order note is handled by the manager.
4. Invariants: PASS. The ticket cites S1-S3 and H3. H3 is relevant because the smoke test covers `shuffle`, and the ticket explicitly avoids asserting randomness. No contradiction.
5. Contracts: PASS. No schema, API, metric or config name is introduced beyond the `test` script. CONTEXT.md Decisions already name the runner as its own ticket.
6. Dependencies and size: PASS. None, ~35 LOC, no business logic.
7. Diagrams: no trigger fires.
8. Lessons: none to apply.
9. Risk: `standard` is correct. No strongModelTriggers match, and criticalPaths is empty.

## Notes (non-blocking)
- The ticket says "pin one major" without naming one. The typecheck-risk paragraph gives a fallback, so an implementer can proceed. Consider naming one to avoid churn. Vitest and Vite versions needing Node 18+ or 20+ are fine on host Node 22.17.
- Host npm is 10.9.2, which writes lockfileVersion 3 by default. To keep v2, run `npm install --lockfile-version 2`. The criterion states the outcome but not this command.
- Typecheck risk is real: `next build` typechecks `vitest.config.ts` under TS 4.7 with node10 resolution. The ticket's fallback order (older Vitest major, then tsconfig exclude as last resort) is sufficient. `skipLibCheck` already softens it.
- `.gitignore` has no coverage or vitest cache entries. Not needed because coverage is out of scope, and Vitest's cache lives in node_modules.
