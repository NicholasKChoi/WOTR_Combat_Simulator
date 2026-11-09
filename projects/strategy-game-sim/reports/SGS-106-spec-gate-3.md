# SGS-106 spec gate 3 (delta check)

**Verdict: READY**

## Folded notes
1. Favicon: "all steps pass" filters `/favicon.ico` out of the stub log before comparing the five-request order. This is testable, since the spec does the filter. It does not conflict with the secret criteria. Chromium's favicon request goes through `context.route` and carries the header, and the sentinel and two-origin checks hold with or without it.
2. stderr: Scope (usage error, unset-secret) and the criteria (usage rows, 401/403-unset rows) agree. Both assert stderr text and empty stdout. The "secret never in stdout or stderr" check is unaffected, because the message names the variable and never prints its value. The docs text (exit 2 = usage error or secret missing) is consistent.
3. Lockfile: "`package-lock.json` is unchanged" can be checked with `git diff --stat`. It agrees with "no new dependency" and with the file-rule criterion, since the lockfile is not on the allowed-changes list.

## Regression check
Nothing else changed. The rest of the ticket matches gate 2. Contracts still match the SGS-103 and SGS-105 descriptions, Risk is standard, and Open questions is empty. The merge hold is in Context and On merge. The `extraHTTPHeaders` line in design/M6.md is known and queued, and I did not flag it.

## Notes (non-blocking)
None.
