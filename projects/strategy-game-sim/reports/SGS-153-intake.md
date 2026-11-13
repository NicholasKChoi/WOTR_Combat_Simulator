# SGS-153 lane intake

Type: Chore
Priority: medium
Milestone: none
Working title: Smoke script hardening (SGS-106 review notes)
Source: owner backlog triage Q64 approved 2026-11-12 (reports/backlog-triage-1.md)

Backlog bullets:

- SGS-106 non-blocking review notes (reports/SGS-106-review-1.md): a cross-origin redirect would carry the bypass header (Node fetch and Playwright header override); the fallback `FAIL smoke:` line is untested and effectively unreachable; the spec helper reads a signal-killed run as exit 0; the "repeat run", "another directory" and usage spec rows inherit the shell's `VERCEL_AUTOMATION_BYPASS_SECRET`. From SGS-106.
