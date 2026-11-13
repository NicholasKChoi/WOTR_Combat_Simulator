# SGS-153: Harden the preview smoke script and its spec

- **Type**: Chore
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: medium
- **Risk**: low
- **Invariants**: none
- **Unverified assumptions**: Node `fetch` with `redirect: 'manual'` returns the 3xx response without following it; Playwright `route.fetch({ maxRedirects: 0 })` returns the 3xx response to the handler without following it (documented in `@playwright/test` 1.64.1 `types.d.ts`; the stub rows exercise it for real)
- **LOC estimate**: 40 (`scripts/smoke-preview.mjs`: `request`, `routeBypassToOrigin`, `open`, `main`, `report`; `acceptance/smoke-preview.spec.ts`: `run`, `StubOptions`, `startStub`, new rows; tests excluded from the figure except the small script change)
- **Depends on**: none
- **On merge**: none
- **Source**: owner backlog triage Q64 (approved 2026-11-12), the non-blocking notes 1, 2, 4 and 5 of `reports/SGS-106-review-1.md`

## Context

`scripts/smoke-preview.mjs` sends the deployment-protection bypass secret to the deployment's origin only (`docs/aoe4-build-order.md` says so), but a 3xx redirect to another host would carry the header in Node `fetch`, and in the browser too: Playwright documents that `route.continue({ headers })` applies the override to "the routed request and any redirects it initiates", and the handler is not invoked again for the redirected request (`types.d.ts` in `playwright-core` 1.64.1, Route `continue` Details; `route.fetch` documents the same and points to `route.continue` for the opposite). So a routing guard on the redirected request is not possible with `route.continue`; the header can only be kept off a redirect target by not letting the browser follow the redirect with the override attached.

The script also has a `FAIL smoke:` fallback in `report` that is nearly unreachable: every step wraps its errors in `StepFailure`, the fixture read in `main` sits outside the `try`, and the one path that reaches it is `await browser.close()` in `open`'s `finally` rejecting. Its spec (`acceptance/smoke-preview.spec.ts`) reads a signal-killed child as exit 0 and lets three rows inherit the shell's real secret.

## Scope

Script (`scripts/smoke-preview.mjs`):

- `request` does not follow redirects. A 3xx response fails the step it occurs in with a reason naming the status, so the bypass header never goes to a redirect target. This happens before the `MissingSecret` check in `save`: with the secret unset, a 3xx on save prints the status failure and exits 1, not the missing-secret exit 2 (only 401 and 403 mean a missing secret).
- `routeBypassToOrigin` / `open`: end state is that the open step fails when a same-origin request that carries the bypass header is answered with a 3xx, whether it is the page document or a subresource. The handler asks for the response without following redirects (for example `route.fetch` with `maxRedirects: 0`), forwards a non-3xx response to the page (`route.fulfill`), and on a 3xx aborts the request and records the failure; `open` then throws `StepFailure('open', ...)` with a reason naming the status, promptly, not after the 30 s selector wait. Requests to another origin are still continued without the header and are not affected. The cleanup (build delete) after the failure still runs, as for any open failure.
- `report` and `main`: remove the `FAIL smoke:` fallback line and the non-`StepFailure` branch of `report`. `main`'s `catch` sets `process.exitCode = 1` for any error other than `MissingSecret`, prints a `FAIL` line only for `StepFailure`, and rethrows any other error after the `finally` cleanup has run, so Node prints it on stderr and nothing unexpected reaches stdout. This covers a missing or unreadable fixture (read in `main` before the steps) and a `browser.close()` rejection after a successful open. Keep the build cleanup in `finally` working.

Spec (`acceptance/smoke-preview.spec.ts`):

- `run` treats a child ended by a signal as a failure that no row's expected exit code (0, 1 or 2) can match, not as exit 0 (`error.code` is null then; read `error.signal`). `run` takes an optional script path (default `SCRIPT`) so a test can run a child that kills itself with a signal.
- `run` defaults the secret env var to the sentinel, so every row and test except the two that set it to unset runs without inheriting the shell's `VERCEL_AUTOMATION_BYPASS_SECRET`. This covers "repeat run", "runs from another directory" and the three usage cases, which pass `{}` today. Keep the existing `afterEach` check that the sentinel never shows in any run's output.
- Extend `StubOptions` / `startStub` to answer a chosen request (save, read back, delete, the page document, or the asset the page loads) with a 3xx whose `Location` is a second origin served by a recording stub (the existing `startAssetStub` can serve as it). Add rows to the `ROWS` table for the redirect cases, in the table's style.

Docs: `docs/aoe4-build-order.md` sentence that the secret goes "to the deployment's origin only" stays true; add a statement that a redirect from the deployment fails the run (API requests and the page's requests alike), in the smoke subsection that lists failure behavior. Check the same subsection for any statement about `FAIL smoke` and fix it (none found at the base by search; confirm). Existing tests of unchanged behavior keep their assertions.

**Out of scope:** the `startStubs` helper refactor (note 6), the `PASS save: <status> <id>` wording note, the `design/M6.md` repeat-row fix, any app code, `golang/`.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] (respec 1) A deployment answer of 3xx with a `Location` on another origin to the save request makes the run print exactly one `FAIL save: ...` line naming the status and exit 1; the other origin receives no request. The same holds with the secret unset (exit 1, not 2). A row covers a redirect on save and one on a later request (read back or delete).
- [ ] (respec 1) A redirect of the open step's page document to another origin makes the run print `PASS save`, `PASS read back`, then a `FAIL open: ...` line naming the status, exit 1, and finish without waiting out the 30 s selector wait; the other origin sees no request, the build is deleted afterwards, and the delete request carries the bypass header. A second row does the same for a redirect of a same-origin subresource the page loads. Both rows fail if the handler forwards the header override to the redirect target (the second origin then records a request carrying it).
- [ ] The run still exits 0 with the four PASS lines when no redirects occur, with the secret set and unset paths unchanged; the existing row asserting that a cross-origin asset request carries no bypass header keeps passing (existing rows keep their assertions).
- [ ] (respec 1) A missing or unreadable fixture (or any other non-`StepFailure` error) makes the script exit non-zero with nothing on stdout and the error on stderr, and the stub receives no request. A failed run after a successful save still deletes the build (the existing "read back differs" and "open fails" rows keep passing).
- [ ] (respec 1) A child killed by a signal makes the spec's `run` helper report a failure that matches none of exit 0, 1 or 2; a test runs a child that signals itself and asserts so.
- [ ] (respec 1) Every row, including "repeat run", "runs from another directory" and each usage case, runs with the sentinel secret unless it sets the secret unset on purpose. A test sets `process.env.VERCEL_AUTOMATION_BYPASS_SECRET` to a value other than the sentinel (restored in a `finally`), runs a default-env row, and asserts every stub request carries the sentinel and none carries the other value.
- [ ] `docs/aoe4-build-order.md` states that a redirect fails the smoke run; no doc statement says the bypass header can follow a redirect; the smoke subsection has no `FAIL smoke` statement.
- [ ] `npx tsc --noEmit`, `npm run lint:dup` and `npx playwright test acceptance/smoke-preview.spec.ts` pass.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-12

- Underspecified: the open-step redirect outcome was left to the implementer; "unreachable" `FAIL smoke:` was wrong (`browser.close()` can reject) and was checked by a search; the secret criterion could not be run from a spec; the 3xx-on-save-with-secret-unset case was missing.
- Changed: Playwright's documented behavior (`continue` headers carry onto redirects; handler not re-invoked) fixes one end state, fail `open` on a same-origin 3xx for document and subresource, with exit 1 and a `FAIL open` line; non-`StepFailure` errors set exit 1 and rethrow after cleanup, proven by a behavior test; the secret test sets `process.env`; the signal proof is a permanent test.
- Stands: no branch work existed; the script/spec/docs scope is otherwise unchanged.
