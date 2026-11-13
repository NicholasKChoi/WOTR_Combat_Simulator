# SGS-155: Add scheduled AoE4 snapshot freshness workflow

- **Type**: Chore
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: low
- **Risk**: low
- **Invariants**: A1 (adjacent: the check reads `data/aoe4-build-order/aoe4world/english.json` and never writes it)
- **Unverified assumptions**: the GitHub contents/commits API and `raw.githubusercontent.com` serve the `aoe4world/data` default branch's `units`, `buildings`, `technologies` and `upgrades` `all.json` without authentication (as `refresh-snapshot.mjs` already relies on); a failing step in a `schedule`-triggered workflow marks the run failed and GitHub emails the repo owner (platform notification setting, not testable here)
- **LOC estimate**: 90 (one check script with a pure comparison function, one workflow file; tests and docs excluded)
- **Depends on**: none
- **On merge**: REPO.md Repo notes CI behavior: replace "No GitHub Actions workflows" with the one scheduled workflow, state that it does not run on pull requests and is not a PR check, and keep `babysit: false` and `autoMerge.requireChecks` unchanged
- **Source**: owner backlog triage Q64 approved 2026-11-12 (AoE4 data freshness check, CI; owner 2026-10-29)

## Context

The AoE4 game data is a pinned snapshot of `aoe4world/data` (`data/aoe4-build-order/aoe4world/english.json`, with `source.repo` and `source.commit`), refreshed by hand with `data/aoe4-build-order/refresh-snapshot.mjs`. Nothing tells the owner when upstream has moved, so the snapshot can silently go stale. The repo has no `.github/workflows` at `origin/main` (confirmed), so this is the first workflow.

## Scope

Default design (recommended, alternatives under Out of scope and in the report):

- New check script beside `refresh-snapshot.mjs` in `data/aoe4-build-order/` (not imported by the app). It reads the committed snapshot's `source.repo` and `source.commit`, resolves the latest upstream default-branch commit, fetches the same four kinds (`units`, `buildings`, `technologies`, `upgrades`) `all.json` at that latest commit, filters to English entries the same way `refresh-snapshot.mjs` does, and compares them with the committed snapshot's kinds. Share the kinds list and civ filter with `refresh-snapshot.mjs` by import or extraction rather than copying (REPO.md AoE4 review rule: no copied constants).
- The decision "is it stale" is a pure exported function over (snapshot, upstream entries) so it is unit-testable without network. Stale means the English content differs (an entry added, removed, or changed in any kind), not merely that upstream has newer commits: upstream commits that touch other civs would otherwise fail every week for nothing. The output names the pinned commit, the latest upstream commit, and which kinds differ with entry counts or ids, and points to the README "Refreshing the snapshot" steps. Exit code 0 when fresh, 1 when stale, and a distinct non-zero code with a clear message when upstream cannot be reached or answers with an error (a network failure is not reported as "stale", and not as fresh).
- New `.github/workflows/aoe4-data-freshness.yml`: triggers `schedule` (weekly, one cron line) and `workflow_dispatch`; no `pull_request` or `push` trigger so it never becomes a PR check; `permissions: contents: read`; checks out, sets up Node 24 (`engines`), runs the script with `GITHUB_TOKEN` passed for API rate limits. A stale or unreachable result fails the job (red run, GitHub notifies the owner). No `npm ci` is needed if the script uses only Node built-ins.
- Docs made untrue: `data/aoe4-build-order/README.md` file table and "Refreshing the snapshot" section (add the check and what a failure means, step 1 "usually the latest on main" stays true); REPO.md "CI behavior" is updated by the manager on merge (see On merge).

**Out of scope:** opening an issue instead of failing the run (alternative: needs `issues: write` and de-duplication of an open issue; owner may switch later); auto-opening a refresh PR; running the check on PRs; changing `refresh-snapshot.mjs` behavior; patch-note detection; other civs.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] The comparison function returns "fresh" when the committed snapshot's English entries equal upstream's, and "stale" naming the differing kind when any entry is added, removed, or changed in one kind; a test covers an added, a removed, and a changed entry, and fails if the comparison ignores a kind or compares only the commit sha.
- [ ] A test pins that a differing upstream commit with identical English content is fresh (so changes to other civs do not fail the job).
- [ ] The script exits non-zero with a message that is distinguishable from "stale" when an upstream fetch fails or returns a non-OK status; a test with a faked fetch covers this and fails if the failure is treated as fresh.
- [ ] The script does not modify any file under `data/aoe4-build-order/`; a test or the script's structure (no write calls) shows it only reads.
- [ ] The kinds list and English filter are defined once and used by both `refresh-snapshot.mjs` and the check; `refresh-snapshot.mjs` behavior is unchanged (running its usage error path still prints the same usage line).
- [ ] The workflow file parses as valid workflow YAML (checked with a YAML parser or `actionlint` if available, result recorded in the report), triggers only on `schedule` and `workflow_dispatch`, and requests only `contents: read`.
- [ ] The workflow, run once via `workflow_dispatch` after merge, passes when the snapshot is fresh; the implementer records that it cannot run it before merge, and the manager verifies the first run (reported under Unverified assumptions).
- [ ] `data/aoe4-build-order/README.md` describes the check and the failure meaning; no README text claims the snapshot is only ever refreshed with no automated freshness signal.
- [ ] `npm test`, `npx tsc --noEmit`, and `npm run lint:dup` pass; the Vercel preview is unaffected (the workflow adds no PR check).
- [ ] No INVARIANTS.md regressions

## Open questions

none
