# SGS-153 acceptance-test 1

Verdict: PASS. No tests written or committed by me; the task's specs already cover the diff. Tip 93f6cf5 unchanged, tree clean.

## Run
- Setup: link-node-modules + `npm run acceptance:setup` ok.
- `npx playwright test acceptance/smoke-preview.spec.ts` (Chromium harness ran): 24 passed, 0 failed (43s).
- Lint: `npx tsc --noEmit && npm run lint:dup` clean (0 clones).

## Rows pinned (new/edited)
- redirect on save / save with secret unset / read back / delete: exit 1, `FAIL <step>: status 302: redirect not followed`, no request reaches the redirect target.
- redirect of page document and of a same-origin subresource: exit 1, FAIL open with the redirect reason, under 20s, cleanup DELETE still last, bypass header sent.
- signal: a child killed by signal matches no expected exit code (0/1/2).
- missing fixture: exit 1, stdout empty, ENOENT on stderr, no request sent.
- shell secret: a secret in the caller's shell never reaches the stub unless a row sets it.

## Mutation checks (all undone; `git diff --exit-code` clean)
- Redirect, HTTP steps: removed `redirect: 'manual'` in scripts/smoke-preview.mjs `request()` (line ~52). save, save-secret-unset, read back and delete rows failed on the line assertion (e.g. expected `FAIL save: status 302: redirect not followed`, got `FAIL save: status 200`).
- Redirect, browser steps: replaced `onRedirect(res.status())` in `routeBypassToOrigin` (line ~98) with a no-op. page-document row failed on lines (got `FAIL open: page.goto: net::ERR_FAILED`); subresource row failed on `out.code` (expected 1, got 0).
- Missing fixture: changed the final `throw err` in `main()` (line 190) to `report(err)`. Failed on `expect(out.stdout).toBe('')` (stdout got `FAIL undefined: ENOENT...`).
- Signal: the test runs its own self-kill script, so no production-script break can reach it. Mutated the spec's `run()` helper instead (`const code = signal ? SIGNALED : error ...` to `const code = error ...`). Failed on `expect([0,1,2]).not.toContain(out.code)` (code 0).
- Shell secret: same limit, the guarantee lives in the spec's `run()` helper. Swapped env spread order so `process.env` overrides the sentinel. Failed on the header assertion (expected sentinel-secret-7f3a91, got shell-secret-not-the-sentinel).
- Note: with `redirect: 'manual'` removed, the page and subresource rows still pass, as expected, since the browser path is separate; the browser-path break above covers them.

## Failures
None.

## Not expressible
None. The redirect rows use a second local stub as the redirect target; the real Vercel redirect chain is not exercised.
