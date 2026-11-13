# SGS-144 lane intake

Type: Bug
Priority: medium
Milestone: none
Working title: rem sizing assumes a 16px root (root is 18px): compact-mode threshold and other M9 rem sizes
Source: owner backlog triage Q64 approved 2026-11-12 (reports/backlog-triage-1.md)

Backlog bullets:

- `design/M9.md` C14 (and SGS-140 ticket) assume 1rem = 16px but `styles/global.css:8` sets the root to 18px; other M9 rem sizing may share the assumption. Reported by SGS-140 review.
