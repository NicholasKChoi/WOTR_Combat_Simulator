# SGS-155 lane intake

Type: Chore
Priority: low
Milestone: none
Working title: AoE4 data freshness CI job (first GitHub workflow)
Source: owner backlog triage Q64 approved 2026-11-12 (reports/backlog-triage-1.md)

Backlog bullets:

- **AoE4 data freshness check (CI).** Add a scheduled CI job that compares the pinned aoe4world snapshot under `data/aoe4-build-order/` (its recorded aoe4world/data commit) with the latest upstream and fails or opens an issue when it is out of date. Note: the repo has no GitHub Actions yet (REPO.md CI behavior), so this would be the first workflow. Depends on M2's data snapshot existing. (owner, 2026-10-29)
