# SGS-188 spec gate 1

Verdict: READY

Checked at origin/main:
- `first load runs once` exists in acceptance/aoe4-auto-run.spec.ts. It registers a console hydration listener and then calls `openPage`.
- acceptance/aoe4-save-open.spec.ts uses `page.on('pageerror', ...)`, so the named pattern exists.
- `openPage` in acceptance/helpers.ts does not itself listen for `pageerror`, so the criterion can fail on the base.
- Risk low and Invariants none are consistent with a test-only change.
- Unverified assumptions lists the `pageerror` behavior.
- No docs are affected. No other open ticket overlaps.

Notes (non-blocking):
- The criterion that a throwing page makes the test fail cannot be demonstrated by a committed test. The implementer should verify it once locally, for example by injecting a throw, and record the result.
