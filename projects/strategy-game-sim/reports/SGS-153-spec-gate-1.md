# SGS-153 spec gate 1

Verdict: NEEDS_SPEC (no owner gaps). Risk `low` confirmed: scripts and a spec only, no criticalPaths entry, no strongModelTrigger.

Read at origin/main: `scripts/smoke-preview.mjs`, `acceptance/smoke-preview.spec.ts`, `docs/aoe4-build-order.md` (smoke subsection, lines ~1197-1225), ARCHITECTURE.md Scripts row. Every named function (`request`, `routeBypassToOrigin`, `report`, `main`, `run`, `ROWS`, `StubOptions`, `startStub`) exists. The doc has no `FAIL smoke` text (confirmed by grep; the only hit in the repo is the script). Nothing outside the spec depends on the script.

## Gaps

1. Acceptance criteria, open-step redirect row (criterion 2) - outcome of the row is left to the implementer. Scope allows two end states: the route handler keeps the header off the redirect target (the run may then pass or time out), or the open step fails on a cross-origin redirect. The row's expected exit code and printed lines differ between those, and a document navigation that is redirected to another origin also changes what the page shows (the selector wait would time out after 30 s). An implementer must guess what the row asserts. Fix: state the observable per branch, or require "whichever branch is chosen, the report records the finding about the installed Playwright and the row asserts (a) the second origin saw no bypass header and (b) the exact expected exit code and FAIL step line for that branch". Also say whether the redirect row covers the page document, a subresource, or both (rows can cover both).

2. Scope `report`/`main` and criterion 4 - two problems.
   - The "unreachable" claim is not quite true: `await browser.close()` in `open`'s `finally` can reject with a non-StepFailure error, which reaches `report` and prints `FAIL smoke:`. The ticket should acknowledge this and say what happens (for example, close errors are swallowed or wrapped in StepFailure('open', ...)).
   - "an unexpected error is not turned into a printed line and the process still exits non-zero" leaves the mechanism open (silent exit 1 vs rethrow with a stack trace on stderr). Fix: state that `main`'s catch rethrows a non-StepFailure error after setting exit code 1 (the `finally` cleanup still runs), so Node prints the error to stderr.
   - Criterion 4 "No code path prints a `FAIL smoke:` line" is a search over code. Removal is proven by a test or typecheck, not a search. Fix: replace with a behavior criterion, e.g. "a missing or unreadable fixture (or any non-StepFailure error) exits non-zero with nothing on stdout; a failed run after a successful save still deletes the build (existing 'read back differs' and 'open fails' rows)". Keep the `FAIL smoke` grep only for the doc check.

3. Criterion 6 - "a test run from a shell that exports a different `VERCEL_AUTOMATION_BYPASS_SECRET` shows ..." is not something a spec can do as written. Fix: "a test sets `process.env.VERCEL_AUTOMATION_BYPASS_SECRET` to a value other than the sentinel, then runs a default-env row and asserts every stub request carries the sentinel and none carries the other value." (Restore the env in a `finally`.)

## Notes (non-blocking)

- Criterion 1 should say what happens with the secret unset and a 3xx on save (it should print the status failure, not the MissingSecret exit 2, since only 401/403 mean missing secret). The current ordering of the `MissingSecret` check after `request` already does this; one sentence in the ticket avoids doubt.
- Criterion 5's "throwaway mutation shown in the report" is acceptable, but a small test that runs `run` against a script that kills itself with a signal would be a permanent proof.
- Playwright's documented behavior (route.continue overrides do not apply to the redirected request; use fetch+fulfill to propagate) is worth reading first; this will probably settle gap 1 without the stub experiment. The installed version is `@playwright/test ^1.64.1`; node_modules was not read here.
- Unverified assumptions field is adequate for the Playwright and fetch behaviors it lists.
