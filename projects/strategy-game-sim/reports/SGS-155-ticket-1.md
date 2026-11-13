# SGS-155 ticket report

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-155-aoe4-data-freshness-workflow.md
Title: SGS-155: Add scheduled AoE4 snapshot freshness workflow
Type Chore, Priority low, Risk low, Component aoe4-build-order, Milestone none, dependsOn none, ~90 LOC.

Summary: a check script beside `refresh-snapshot.mjs` compares the committed English snapshot with the English entries at upstream's latest commit (all four kinds) via a pure, unit-tested function, plus a new `.github/workflows/aoe4-data-freshness.yml` (weekly `schedule` and `workflow_dispatch` only, `contents: read`, Node 24). Confirmed at origin/main: no `.github/workflows` exists, so this is the first workflow. Criteria cover fresh/stale per kind, same content under a different commit is fresh, fetch failure is distinct from stale, read-only, shared kinds/filter with refresh-snapshot, workflow triggers and permissions, README update, gates.

Defaults chosen (no open questions):
- Failure mode: red workflow run (GitHub notifies owner). Alternative: open/de-duplicate an issue (needs `issues: write`).
- Staleness is content-based on English entries, not commit-sha inequality, to avoid weekly failures from other-civ commits. Alternative: strict sha compare (simpler, noisy).
- Schedule: weekly. Not a PR check, so `babysit: false` and `requireChecks` stay as is.

On merge: REPO.md CI behavior note must change from "No GitHub Actions workflows".
Unverified: first real run only possible after merge (`workflow_dispatch`); public repo scheduled workflows are disabled after 60 days of repo inactivity.
Diagrams: none. Overlap with other tickets: none found.
