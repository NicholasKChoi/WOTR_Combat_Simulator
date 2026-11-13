# SGS-153 implementer 1

Status: needs_review
Branch: sgs-153-smoke-script-hardening, tip 214909a9ce7a0eeb3dc0dd9350e13351f086b8d1, base origin/main 41b3ed3
Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-153-smoke-script-hardening

## Files
- scripts/smoke-preview.mjs: `request` uses `redirect: 'manual'` and fails a 3xx with `status <n>: redirect not followed` (before the MissingSecret check); `routeBypassToOrigin` fetches same-origin requests with `route.fetch({ maxRedirects: 0 })`, fulfills non-3xx, aborts and reports a 3xx; `open` races its waits against that failure; `report` is StepFailure-only; `main` reads the fixture inside the `try`, rethrows non-StepFailure errors after `finally`.
- acceptance/smoke-preview.spec.ts: `run` (signal -> code -1, default sentinel secret, script-path param, elapsedMs), `StubOptions.redirectOn` / `sameOriginAsset`, a separate recording redirect-target stub, 6 redirect rows, signal test, missing-fixture test, shell-secret test.
- docs/aoe4-build-order.md: added the redirect-fails-the-run sentence in the smoke subsection. No `FAIL smoke` text exists there (grep confirmed).

## Tests
- `npx playwright test acceptance/smoke-preview.spec.ts`: 24 passed. `npm test`: 2504 passed, 15 skipped. `tsc --noEmit` and `lint:dup` clean (0 clones). `npx next build` succeeded. No codegen command set.
- Invariants encoded: no request reaches the redirect target; save/read/delete/open redirects each give one FAIL line and exit 1; open redirect (document and subresource) fails under 20 s and the delete still runs with the bypass header; secret unset plus 3xx on save is exit 1; missing fixture gives exit 1, empty stdout, ENOENT on stderr, no stub request; signal child matches none of 0/1/2; shell secret never reaches the stub.

## Pre-existing tests edited
None changed an assertion. `run` now defaults the secret and the row `secret` type narrowed to `null`; the existing rows keep their assertions.

## Doc claims
- docs/aoe4-build-order.md: "A redirect (a 3xx answer) from the deployment fails the step it occurs in, for the API requests and for the requests the page makes in `open` alike: the script does not follow it, so the secret never goes to another host." True per `request` (redirect: 'manual') and `routeBypassToOrigin` (maxRedirects: 0, same-origin only).
- Script comment on `routeBypassToOrigin` (continue applies headers to redirects) and on `launch` (see below).

## Mutation checks (all undone, final run 24 passed)
- `maxRedirects: 0` -> 20: both open-redirect rows fail on the `FAIL open` lines assertion.
- `redirect: 'manual'` -> 'follow': save/other redirect rows fail on the `FAIL save: status 302` lines assertion.
- spec `signal ? SIGNALED :` removed: signal test fails at `expect([0,1,2]).not.toContain(out.code)`.
- main `throw err` -> `report(err)`: missing-fixture test fails at stdout `''` (got `FAIL undefined: ENOENT`).
- default `VERCEL_AUTOMATION_BYPASS_SECRET: SENTINEL` removed: shell-secret test fails (got the shell value).
- `Promise.race([loading, redirected])` -> `await loading`: subresource row fails at exit code (expected 1, got 0).

## Deviation to review
`launch` now passes `--disable-features=LocalNetworkAccessChecks` to Chromium. Reason (reproduced in an isolated script): a document answered via `route.fulfill` has no address space, so Chromium blocks its requests to loopback hosts (`net::ERR_FAILED`), which broke the existing row "secret set is sent and never printed" (cross-origin asset on 127.0.0.1). Effect on real public previews: none expected; it only relaxes a loopback check for the smoke browser. Alternative if unwanted: drop the flag and move that row's asset to a non-loopback host (not possible with local stubs).

## Unverified assumptions (not added to the ticket; ticket already lists the fetch/maxRedirects ones)
- Chromium's `LocalNetworkAccessChecks` feature name: verified only by the isolated repro against the installed Chromium; a later Chromium may rename it.

## Out-of-scope findings
- `route.abort()` and `route.fetch` errors are swallowed in the handler (empty catch); a network error on a same-origin request surfaces only as the page's own load failure.
- `browser.close()` rejection path has no test (not required).
