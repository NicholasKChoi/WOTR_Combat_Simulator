# SGS-149 spec gate 2

Verdict: NEEDS_SPEC (1 gap, not owner-only). The three gaps from pass 1 are closed. Risk tier low is still right.

Read at origin/main after `git fetch origin`. Files read: `lib/aoe4-build-order/build-store.ts`, `build-store.test.ts`, `acceptance/helpers.ts`, `acceptance/aoe4-auto-run-contract.spec.ts`, `acceptance/aoe4-split-tab-order.spec.ts`, and SGS-151 (checked for overlap).

## Pass 1 gaps, now closed

- Auto-run (item 1): the wait is now a named constant, the spec asserts still `running`, and the mutation is a delayed gate release in `holdRequests`. `holdRequests` is a single `await gate`, so a delayed release is a one-line mutation and is feasible. The implementer picks a mutation delay long enough that the `running` and text assertions pass first; this is an implementer choice, not a gap.
- Memory store (item 2): the shared backing store is required, and the six mutations are named. Dropping the env prefix at the call site or in the key function fails the existing test rows. Those rows are the `preview`/`production` builds and counter assertions in "shares neither builds nor counters between envs", and the named assertions in "shares no named build between envs". Single-argument calls (build-store.test blob cases, builds-routes.test) stay compatible. `build-store.acceptance.test.ts` pins export names only.
- Tab order (item 3): hard assertions, first-thrown-message criteria, and a separate rendered check are now specified.

## Gap

1. Scope item 3 and criterion 6 (handle-before-caret) - the walk in `walk` stops at the last chart's `chart-collapse` stop. For the last chart, moving the caret before its handle means the handle stop is never recorded, so `findIndex` returns -1. The existing `expect(handle).toBeLessThan(collapse)` then passes, because -1 is less than any index. The handle-before-caret assertion therefore cannot be the failing one for the last chart. Only the presence assertion catches it, which is exactly what criterion 6 forbids. An implementer who mutates the last chart (the easiest choice, since its caret ends the walk) would find the criterion unsatisfiable. Another implementer would guess a different mutation. Fix, either of these:
   - (a) State that criterion 6's mutation targets a chart other than the DOM-last one, and that a caret-before-handle on the last chart is caught through the stop-presence assertion.
   - (b) Make the walk continue until both the last chart's handle and its caret are seen, so handle-before-caret holds for every chart. A found handle index of -1 must not satisfy "before". Require the assertion to check that both indexes are >= 0 within its own named check, or to skip charts lacking a stop.
   Option (b) is stronger. Either way, say which in Scope.

## Notes

- Criterion 1 allows either the `answered` assertion or the still-`running` assertion to fail. That is fine. The implementer should record the chosen mutation delay and the wait constant in the report, as Scope already requires.
- No overlap with open tickets. SGS-151 touches the Blob-fake tests in other files, not `createMemoryBuildStore` or the `memory` factory rows. SGS-150 and SGS-146 touch other specs.
- Docs: ARCHITECTURE.md describes the memory store without its signature, so no doc change is needed. The optional parameter is not exported publicly beyond the existing export.
- Unverified assumptions: none is correct. Invariants: none is acceptable; no INVARIANTS paths are touched.
