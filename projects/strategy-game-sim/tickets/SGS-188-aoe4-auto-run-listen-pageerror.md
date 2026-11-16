# SGS-188: Make the auto-run first-load test also listen for pageerror

- **Type**: Chore
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: low
- **Risk**: low
- **Invariants**: none
- **Unverified assumptions**: Playwright emits the `pageerror` event for an uncaught exception thrown during page load, which includes the error React rethrows for an unrecoverable hydration failure
- **LOC estimate**: 5 (one test in acceptance/aoe4-auto-run.spec.ts; test code only)
- **Depends on**: none
- **On merge**: none
- **Source**: BACKLOG.md item, reported by the SGS-184 implementer

## Context

The `first load runs once` test in `acceptance/aoe4-auto-run.spec.ts` guards against a hydration problem by collecting `console` messages that match /hydrat/i. React reports an unrecoverable hydration failure as an uncaught error, which Playwright surfaces as `pageerror` and not always as a console message, so the check can pass while hydration failed. No product behavior changes.

## Scope

- In `acceptance/aoe4-auto-run.spec.ts`, the test `first load runs once`: also collect `pageerror` events during the load and fail the test when any occurs, in addition to the existing hydration console check. Follow the existing pattern in `acceptance/aoe4-save-open.spec.ts` (`page.on('pageerror', ...)`).
- Keep the listener registered before `openPage`, so errors thrown during load are seen.
- This is a Chore: no application code changes and the test's other assertions are unchanged.

**Out of scope:** adding pageerror listeners to other specs; a shared helper for error collection; any application code.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `first load runs once` collects `pageerror` events from before the page opens and fails when one is raised during load; a test run where the page throws an uncaught error on load makes it fail, which the base test does not do.
- [ ] The existing hydration console check and all other assertions in that test keep their meaning and still pass.
- [ ] Pre-existing tests in the spec keep their assertions.
- [ ] No INVARIANTS.md regressions

## Open questions

none
