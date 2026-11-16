# SGS-187 spec gate 1

Verdict: READY

Checked at origin/main c754c4c and the SGS-184 review checkout.

- Grounded scope: `settledScrollY` exists at acceptance/helpers.ts:270 with the comment above it. `git grep` finds no importer in code or docs at origin/main. SGS-184's checkout still has it, with no importer.
- `TABS_VIEWPORT`, `showTab` and `SPLIT_MIN_WIDTH` exist at origin/main and have no importer other than helpers.ts itself. The SGS-184 checkout has none of them, so the conditional in Scope is correct.
- Criteria are testable. Removal is proven by tsc, with no search over code. `lint:dup` and `test` exist in package.json.
- No design contracts, invariants, diagrams or unverified assumptions are involved. Risk low and On merge `none` are right. Nothing in TASK-GRAPH removes or rewrites the same code except SGS-184, which the ticket orders itself after.

Notes (non-blocking):
- I could not find the BACKLOG.md item the Source field cites. Drop it once the ticket merges, if it exists.
- The ticket says its base is c754c4c, which matches origin/main now. The conditional "if SGS-184 made it used" is handled by Scope.
