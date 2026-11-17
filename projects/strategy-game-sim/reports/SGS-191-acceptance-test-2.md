# SGS-191 acceptance-test 2 (rerun after rework 1)

Verdict: PASS. Tip f58419cbaf6612ed8194152f93012f9deca9ad0d, no new commits, checkout clean.

## Run
- `acceptance:setup` ran (node_modules linked, Chromium installed).
- `npx playwright test acceptance/aoe4-simulate-api acceptance/aoe4-auto-run-contract acceptance/fight-api-spec-surface acceptance/fight-api-contract`
  matched every aoe4-simulate-api* spec (including the new aoe4-simulate-api-unit-lines.spec.ts and
  aoe4-simulate-api-contract.spec.ts), the auto-run contract spec, and both fight-api spec files.
- Result: 485 passed, 0 failed, 15.0 s. The harness ran (real next dev server, Chromium project).
- Not run: the rest of the acceptance suite (UI-only specs outside the requested set).

## Tests written
None this round. The earlier impl-defect (report 1) is fixed; the rework's spec
acceptance/aoe4-simulate-api-unit-lines.spec.ts was already committed and passes.

## Mutation checks
None made this round, since no tests were written or changed by this run.

## Failures
None. No criteria were inexpressible in this harness.
