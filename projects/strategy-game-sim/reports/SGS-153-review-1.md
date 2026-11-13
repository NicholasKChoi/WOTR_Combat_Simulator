# SGS-153 review 1

Verdict: REQUEST CHANGES (one text finding). Branch sgs-153-smoke-script-hardening, tip 214909a, base 41b3ed3. Type Chore.

## Blocking findings

1. docs/aoe4-build-order.md:1215-1216 - contract (text) - The added sentence says a redirect fails the step "for the API requests and for the requests the page makes in `open` alike". The script only checks the page's requests when the secret is set (`if (secret) await routeBypassToOrigin(...)`, scripts/smoke-preview.mjs in `open`). With the secret unset, a 3xx on the page document or a subresource is followed and the run passes. The doc claim is contradicted by the code. Facts to keep: a redirect is a 3xx answer; it fails the step it occurs in for API requests and for the page's requests; the script does not follow it; the secret never goes to another host.
   Replacement text for the sentence: "A redirect (a 3xx answer) to an API request fails the step it occurs in, with or without the secret. In `open`, with the secret set, a redirect of any request the page makes to the deployment's origin fails the step too. The script does not follow either, so the secret never goes to another host. Without the secret, no header is sent and the page's own requests are not checked for redirects."
   (Alternative if the owner wants the claim true as written: route same-origin requests in `open` also when the secret is unset. The ticket scopes the check to requests that carry the bypass header, so the text fix is the match.)

## Launch flag decision (`--disable-features=LocalNetworkAccessChecks`)

Acceptable, non-blocking.
- The flag is needed only because a `route.fulfill`ed document has no address space, so Chromium blocks its loopback requests; that arises only on the secret-set path against a local stub. Against a real public preview the page is a public https origin and the app makes no loopback requests, so the flag changes nothing the smoke could catch. A page that requested loopback hosts would be a deploy bug the smoke would now miss, but the smoke does not assert on that.
- If Chromium renames the feature, unknown features are ignored and the stub row "secret set is sent and never printed" fails loudly, so the dependency cannot rot silently.
- Non-blocking improvement: the flag is also applied on the secret-unset path, where no fulfill happens. Passing it only when `secret` is set would keep the unset path a plain Chromium launch.

## Acceptance criteria

1. Save/read/delete redirect rows (one FAIL line, exit 1, redirect stub sees nothing, secret unset gives exit 1): pass. `request` uses `redirect: 'manual'`, and the 3xx check precedes the MissingSecret check in `save`. Rows "redirect on save", "... secret unset", "read back", "delete" cover it.
2. Open redirects (document and same-origin subresource): pass. Handler uses `route.fetch({maxRedirects: 0})`, fulfills non-3xx, aborts and signals on 3xx; `open` races the load against the failure, so no 30 s wait (rows assert under 20 s). Delete still runs and carries the header (asserted last request). The redirect stub's recorded requests catch a forwarded override. Implementer's mutation checks (`maxRedirects` 20, `follow`) show the rows fail.
3. No-redirect run unchanged, existing assertions kept: pass by reading (no existing assertion edited; only `run` defaults and the `secret` row type).
4. Non-StepFailure errors: pass. `main` reads the fixture inside `try`, sets exitCode 1, rethrows after `finally`; `report` is StepFailure-only; `FAIL smoke` fallback removed. Test "a missing fixture ..." asserts exit 1, empty stdout, ENOENT on stderr, no stub request. The `browser.close()` rejection path has no test (not required) but routes through the same rethrow.
5. Signal child: pass. `run` maps a signal to -1; the test runs a self-killing script and asserts SIGKILL and `[0,1,2]` not containing the code.
6. Sentinel default: pass. `run` defaults the secret to the sentinel; the shell-secret test sets a different value in `process.env`, restores it in `finally`, and asserts every stub request carries the sentinel (the other value would fail `toBe`). Guarded by `requests.length > 0`.
7. Docs: unverified-as-true; fails per finding 1 (the new sentence overstates). No `FAIL smoke` text in the subsection (grep confirmed by implementer; the diff adds none).
8. `tsc --noEmit` and `lint:dup`: I ran both in the worktree; clean (0 clones). The Playwright spec was not run by me (gate rule); the implementer records 24 passed.
9. INVARIANTS: ticket lists none; the diff touches only scripts, the spec and docs. No regressions.

## Contract, scope, conventions, correctness

- Scope: nothing out of scope touched (no startStubs refactor, no app code, no golang).
- Tests: new redirect rows are table rows with shared `expectSaveRedirectFails` / `expectOpenRedirectFails` helpers; each assertion can fail on the mutation the implementer listed. Pre-existing tests edited: none changed an assertion.
- Correctness: `onRedirect` is invoked before `route.abort()`, so the race sees the StepFailure rather than the page's `net::ERR_FAILED`. The stray `loading`/`redirected` rejections are handled with `.catch(() => {})`. `browser.close()` rejection after a failure would mask the StepFailure (edge, non-blocking).
- Hygiene: comments in the script and spec carry no ticket ids or process history. The `routeBypassToOrigin` comment states a real constraint.
- Bot: REPO.md has no `reviewBot.cli`; skipped.
- UI inspection: no UI changed; skipped.

## Non-blocking notes

- The empty `catch {}` in the route handler swallows `route.fetch` errors; the request is aborted and the page's load failure surfaces as the open failure. Matches the implementer's out-of-scope note.
- Row type `secret?: null` is a narrow union; fine as only unset is used.
- The missing-fixture test creates a temp dir in the repo root (`path.resolve('smoke-no-fixture-')`) so that module resolution finds `@playwright/test`; it is removed in `finally`.

## Coverage

Reviewed: scripts/smoke-preview.mjs (full), acceptance/smoke-preview.spec.ts (full diff), docs/aoe4-build-order.md diff, ticket, implementer report. Not run: the Playwright spec (per gate rules). Sibling-convention check was limited to the spec's existing rows and helpers, which the diff follows.
