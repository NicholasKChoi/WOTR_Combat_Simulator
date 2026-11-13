# SGS-153 review 2

Verdict: APPROVE. Branch sgs-153-smoke-script-hardening, tip 93f6cf5 (delta from 214909a).

## Delta check
`git diff 214909a..93f6cf5` touches only docs/aoe4-build-order.md (4 insertions, 2 deletions, the redirect paragraph). No script, spec, or other file changed since the tip review 1 bounced.

## Review 1 finding (docs/aoe4-build-order.md redirect sentence): fixed
New text: redirects fail the step for API requests (not followed); in `open` with the secret set, a same-origin request carrying the secret header is not followed and a redirect fails the step; with the secret unset no header is added, `open` installs no route handler, and the page follows redirects.
Checked against scripts/smoke-preview.mjs on the branch:
- `request` uses manual redirects for API calls (review 1 verified).
- `routeBypassToOrigin` runs only under `if (secret)`; it fetches same-origin requests with `maxRedirects: 0` and the auth headers, and fails the step via `onRedirect` on a 3xx.
- With the secret unset no route is installed, so the page follows redirects.
Facts kept from review 1: a redirect is a 3xx answer; it fails the step it occurs in; the script does not follow it; the secret never goes to another host. The new text is accurate and over-claims nothing.

## Acceptance criteria
1 to 6, 8, 9: unchanged from review 1 (pass); nothing in the delta touches them.
7 (docs): now pass.

## Non-blocking notes
Review 1 notes stand: the `--disable-features=LocalNetworkAccessChecks` flag is also applied when the secret is unset; the `browser.close()` rejection can mask a StepFailure.

## Coverage
Read the delta diff and the `routeBypassToOrigin`/`open` code on the branch. Ran no tests.
