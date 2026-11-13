# SGS-153 spec gate 2

Verdict: READY. Risk `low` stands: a script and its spec, no criticalPaths entry, no strongModelTrigger.

All three pass-1 gaps are closed.
- Gap 1 (open-redirect outcome): Scope now fixes one end state. `open` fails on a same-origin 3xx for the document and for a subresource, with a `FAIL open` line, exit 1, and no 30 s wait. Criterion 2 states the observable lines and exit code.
- Gap 2 (`FAIL smoke:` fallback): the `browser.close()` rejection is acknowledged. The mechanism is fixed: set exit 1, print `FAIL` only for `StepFailure`, rethrow other errors after `finally`. Criterion 4 is now a behavior check, not a search.
- Gap 3 (shell secret): the test sets `process.env`, restores it in a `finally`, and asserts on stub requests.

## Checks against origin/main

- Every named function exists in `scripts/smoke-preview.mjs`: `request`, `routeBypassToOrigin`, `open`, `main`, `report`. The same holds in the spec for `run`, `StubOptions`, `startStub`, `startAssetStub`, `ROWS`.
- The `run` bug is real. `error.code` is null for a signal-killed child, and `Number(null)` is 0, so it reads as exit 0. The three rows named in Scope pass `{}` today and inherit the shell secret.
- `route.fetch({ maxRedirects: 0 })` exists in the installed playwright-core 1.64.1 `types.d.ts`.
- The ordering claim holds. `request` runs before `save`'s MissingSecret check, so a 3xx with no secret yields a `FAIL save` line and exit 1 once redirects are not followed.
- `docs/aoe4-build-order.md` lines 1197-1225 have the "origin only" sentence and the exit-code and failure list. There is no `FAIL smoke` text there.
- Nothing else depends on the script. Only the spec, ARCHITECTURE.md and old SGS-106/121 tickets mention it. No open ticket in TASK-GRAPH touches it, so there is no throwaway-work overlap.
- Unverified assumptions are adequate. Docs are in scope. Input validation is not relevant: one URL argument.

## Notes (non-blocking; the implementer can resolve these without the owner)

- The subresource row needs a same-origin asset. Today's `pageHtml` loads only a cross-origin `asset.js`, and the "all steps pass" row asserts the stub's requests are exactly `[POST, GET, OPEN, DELETE]`. The same-origin asset must therefore appear only under a new `StubOptions` flag so existing rows keep their assertions.
- Use a recording stub separate from the page's cross-origin `asset.js` stub as the redirect target in the subresource row. If both are one stub, the page's own `asset.js` request would break "the other origin sees no request".
- The missing-fixture test needs a way to run the script without `data/`. One option is to copy the script into a temp directory inside the repo, so `@playwright/test` still resolves but `../data/...` does not, and pass that path through the new `run` script-path parameter. A copy elsewhere would fail on the import before reaching the fixture read, which proves nothing.
- A subresource abort does not fail `page.goto`. `open` has to race its waits against the recorded failure to stay prompt, and the criterion already requires "promptly".
- The `browser.close()` rejection path has no test; the ticket does not require one.
