# BATCH-033 simplify 1

Branch sgs-033-aoe4-simulate-route, diff 16ca3be vs ce342db. Final tip: 16ca3be (no commit made).

- /simplify was invoked through the Skill tool. Its four reviewers (reuse, simplification, efficiency, altitude) were NOT spawned as agents; I ran the four angles inline over the diff. The diff is small: one 66-line route, a 19-line types file, helpers, docs, OpenAPI, and tests.
- Changes made: none.
- Declined:
  - Folding the non-object-body 400 into a shared "send issues" helper. It saves about two lines and the route has only two 400 sites, so it is not worth it.
  - Merging the `rejected()` and `isPlainObject` helpers or inlining them. They are already minimal.
  - Test and helper duplication across the three acceptance specs. It is deliberate (contract, edges and behavior files) and not worth churn.
  - Reuse: no existing helper re-implemented. The route calls the validate, parse and simulate libs directly.
  - Efficiency: loadGameData is a single call per request and there is no repeated I/O.
  - Altitude: the validation lives in lib/validate, and the route only orchestrates.
  - lib/aoe4-build-order/simulate.ts untouched. The issues-list cap is not added.
- Verification: `npx tsc --noEmit` clean; `npm test` 22 files, 613 tests passed. npm ci succeeded.
- The worktree is on its branch, ahead 2 of origin/main, nothing pushed.
