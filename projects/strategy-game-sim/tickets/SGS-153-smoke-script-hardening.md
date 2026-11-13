# SGS-153: Harden the preview smoke script and its spec

- **Type**: Chore
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: medium
- **Risk**: low
- **Invariants**: none
- **Unverified assumptions**: Node `fetch` with `redirect: 'manual'` returns the 3xx response without following it; Playwright `route.continue({ headers })` may carry its header override onto a redirect the request starts, and the handler may or may not run again for the redirected request (to be established against the installed `@playwright/test`, not assumed)
- **LOC estimate**: 40 (`scripts/smoke-preview.mjs`: `request`, `routeBypassToOrigin`, `report`, `main`; `acceptance/smoke-preview.spec.ts`: `run`, three rows; tests excluded from the figure except the small script change)
- **Depends on**: none
- **On merge**: none
- **Source**: owner backlog triage Q64 (approved 2026-11-12), the non-blocking notes 1, 2, 4 and 5 of `reports/SGS-106-review-1.md`

## Context

`scripts/smoke-preview.mjs` sends the deployment-protection bypass secret to the deployment's origin only (`docs/aoe4-build-order.md` says so), but a 3xx redirect to another host would carry the header, in both Node `fetch` and the Playwright route override. The script also has a `FAIL smoke:` fallback line that no step can reach and no test covers, and its spec (`acceptance/smoke-preview.spec.ts`) reads a signal-killed child as exit 0 and lets three rows inherit the shell's real secret.

## Scope

Script (`scripts/smoke-preview.mjs`):

- `request` does not follow redirects. A 3xx response fails the step it occurs in, with a reason that names the status, so the bypass header never goes to a redirect target. Where the response carries a `Location`, the reason need not print it.
- `routeBypassToOrigin`: a request the browser makes to another origin, including one that is the target of a redirect from the deployment's origin, must not carry the bypass header. Establish how the installed Playwright treats a header override on a redirect (read its source or run a stub), then make the route handler guarantee the property. When the browser cannot be made to satisfy it by routing, fail the open step on a cross-origin redirect instead.
- `report` and `main`: the `FAIL smoke:` fallback is unreachable (every step wraps its errors in `StepFailure`; the fixture read in `main` sits outside the `try`). Remove the fallback line and the non-`StepFailure` branch of `report`; an unexpected error is not turned into a printed line and the process still exits non-zero. Keep the build cleanup in `finally` working.

Spec (`acceptance/smoke-preview.spec.ts`):

- `run` treats a child ended by a signal as a failure that no row's expected exit code can match, not as exit 0 (`error.code` is null then; read `error.signal`).
- `run` defaults the secret env var to the sentinel, so every row and test except the two that set it to unset runs without inheriting the shell's `VERCEL_AUTOMATION_BYPASS_SECRET`. This covers "repeat run", "runs from another directory" and the three usage cases, which pass `{}` today. Keep the existing `afterEach` check that the sentinel never shows in any run's output.
- Add rows to the `ROWS` table for the redirect cases (see criteria), reusing `startStub` options; extend `StubOptions` as needed.

Docs: `docs/aoe4-build-order.md` sentence that the secret goes "to the deployment's origin only" stays true; add a statement that a redirect fails the run, in the smoke subsection that lists failure behavior. Check the same subsection for any statement about `FAIL smoke` and fix it (none found at the base by search; confirm). Existing tests of unchanged behavior keep their assertions.

**Out of scope:** the `startStubs` helper refactor (note 6), the `PASS save: <status> <id>` wording note, the `design/M6.md` repeat-row fix, any app code, `golang/`.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] A deployment answer of 3xx to any step's request, with a `Location` on another origin, makes that step print its `FAIL <step>: ...` line naming the status and exit 1, and the other origin receives no request and no bypass header. A test covers a redirect on the first request (save) and one on a later request.
- [ ] A browser request that the open step's page makes, or is redirected to, on a different origin never carries the bypass header. A spec row has the page's own origin redirect (or reference) a second origin and asserts that origin saw no bypass header; the row fails if the handler forwards the override to the redirect target.
- [ ] The run still exits 0 with the four PASS lines when no redirects occur, with the secret set and unset paths unchanged (existing rows keep their assertions).
- [ ] No code path prints a `FAIL smoke:` line; an error outside `StepFailure` does not exit 0, and a failed run after a successful save still deletes the build.
- [ ] A child killed by a signal makes the spec's `run` helper report a failure that fails any row expecting exit 0, 1 or 2; a test (or a throwaway mutation shown in the report) shows a killed child does not pass as exit 0.
- [ ] Every row, including "repeat run", "runs from another directory" and each usage case, runs with the sentinel secret unless it sets the secret unset on purpose; a test run from a shell that exports a different `VERCEL_AUTOMATION_BYPASS_SECRET` shows that value never reaches a stub request.
- [ ] `docs/aoe4-build-order.md` states that a redirect fails the smoke run; no doc statement says the bypass header can follow a redirect.
- [ ] `npx tsc --noEmit`, `npm run lint:dup` and `npx playwright test acceptance/smoke-preview.spec.ts` pass.
- [ ] No INVARIANTS.md regressions

## Open questions

none
