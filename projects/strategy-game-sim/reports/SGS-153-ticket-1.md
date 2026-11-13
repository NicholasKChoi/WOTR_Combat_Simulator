# SGS-153 ticket 1 (re-spec)

File: tickets/SGS-153-smoke-script-hardening.md (rewritten in place, Re-spec 1 appended, five criteria tagged `(respec 1)`). `ticket-lint.py` clean.

Why it was wrong: I left the open-step redirect outcome to the implementer instead of reading Playwright, treated `FAIL smoke:` as unreachable without checking `browser.close()`, and wrote two criteria a spec could not run.

Findings folded in:
1. Playwright 1.64.1 `types.d.ts` (Route `continue` Details): the `headers` override applies to the routed request and the redirects it initiates, and the handler is not invoked again for the redirected request. So routing cannot guard the redirect target. The single end state is that `open` fails on a same-origin 3xx (page document and subresource, both rows). The handler uses `route.fetch` with `maxRedirects: 0`, fulfills non-3xx responses, and aborts and records a 3xx. The expected result is PASS save, PASS read back, `FAIL open` naming the status, exit 1, no request to the second origin, build deleted, and no wait for the 30 s timeout.
2. `browser.close()` rejection is acknowledged. `main` sets exit code 1 and rethrows any non-`StepFailure` error after the `finally` cleanup, so stderr gets the error and stdout gets nothing. The search criterion is replaced by a behavior criterion (unreadable fixture: non-zero exit, empty stdout, no stub requests).
3. The secret criterion is now a test that sets `process.env` to another value, restores it in `finally`, and asserts the stub requests carry only the sentinel.
Also: a 3xx on save with the secret unset prints `FAIL save` and exits 1, not 2. The signal proof is a permanent test, so `run` takes an optional script path.

Open questions: none. Overlap with other tickets: none found.

Not run: I did not run the spec or mutation checks. The criteria were checked by reading the script and spec at origin/main.
