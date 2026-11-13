# SGS-148 lane intake

Type: Bug
Priority: low
Milestone: none
Working title: isLineHidden strips a leading pinned: from any key (latent)
Source: owner backlog triage Q64 approved 2026-11-12 (reports/backlog-triage-1.md)

Backlog bullets:

- `isLineHidden` (aoe4 chart legend) strips a leading `pinned:` from any key, so a current series keyed `pinned:*` would hide wrongly; no such key exists today (SGS-113).
