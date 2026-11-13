# SGS-155: Add scheduled AoE4 snapshot freshness workflow

- **Type**: Chore
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: low
- **Risk**: low
- **Invariants**: A1 (adjacent: the check reads `data/aoe4-build-order/aoe4world/english.json` and never writes it)
- **Unverified assumptions**: the GitHub contents/commits API and `raw.githubusercontent.com` serve the `aoe4world/data` default branch's `units`, `buildings`, `technologies` and `upgrades` `all.json` without authentication (as `refresh-snapshot.mjs` already relies on); a failing step in a `schedule`-triggered workflow marks the run failed and GitHub emails the repo owner (platform notification setting, not testable here)
- **LOC estimate**: 110 (one check script with a pure comparison function, one small shared module, one workflow file, the refresh script's edit to import it; tests and docs excluded)
- **Depends on**: none
- **On merge**: REPO.md Repo notes CI behavior: replace "No GitHub Actions workflows" with the one scheduled workflow, state that it does not run on pull requests and is not a PR check; the REPO.md front matter comment `babysit: false  # no .github/workflows` also goes stale, so reword it; keep `babysit: false` and `autoMerge.requireChecks` unchanged
- **Source**: owner backlog triage Q64 approved 2026-11-12 (AoE4 data freshness check, CI; owner 2026-10-29)

## Context

The AoE4 game data is a pinned snapshot of `aoe4world/data` (`data/aoe4-build-order/aoe4world/english.json`, with `source.repo` and `source.commit`), refreshed by hand with `data/aoe4-build-order/refresh-snapshot.mjs`. Nothing tells the owner when upstream has moved, so the snapshot can silently go stale. The repo has no `.github/workflows` at `origin/main` (confirmed), so this is the first workflow.

## Scope

Default design (recommended, alternatives under Out of scope and in the report):

- New side-effect-free module in `data/aoe4-build-order/` (for example `snapshot-source.mjs`; not imported by the app) exporting the upstream repo name, the four kinds (`units`, `buildings`, `technologies`, `upgrades`), the civ id, a `filterEnglish` function, and the upstream fetch helper (`getJson` with its User-Agent and non-OK handling, taking `fetch` as an injectable parameter or default). It has no top-level argv check, `process.exit`, network call, or file write, so tests can import it. `refresh-snapshot.mjs` imports these instead of defining them; its usage line, arguments, output file and output format stay as they are (its top-level flow is otherwise unchanged). REPO.md AoE4 review rule: no copied constants. `.jscpd.json` does not cover `data/`, so this rests on review and the criterion below.
- New check script beside it, `check-freshness.mjs`, importing that module (never `refresh-snapshot.mjs`, which writes `english.json` when loaded). It reads the committed snapshot's `source.repo` and `source.commit`, resolves the latest upstream default-branch commit through the GitHub API `commits/HEAD` of that repo (taking the returned sha), fetches the four kinds' `all.json` from `raw.githubusercontent.com` at that sha (not at a branch name, so the commit report and the content agree), applies `filterEnglish`, and compares with the committed snapshot's kinds. The script's main flow is exported or takes its fetch as a parameter so a test can drive it with a fake fetch; it only runs as a CLI when invoked directly, not when imported.
- The decision "is it stale" is a pure exported function over (snapshot, upstream entries) so it is unit-testable without network. "Content differs" means: per kind, the English entries arrays are not deeply equal, order counts (refresh stores upstream order, so an order-only change is stale), and the `source` block is ignored (`fetchedAt` always differs). Stale means that, not merely that upstream has newer commits: commits that touch other civs would otherwise fail every week for nothing. The output names the pinned commit, the latest upstream commit, and which kinds differ with entry counts or ids, and points to the README "Refreshing the snapshot" steps. Exit code 0 when fresh, 1 when stale, and a distinct non-zero code with a clear message when upstream cannot be reached or answers with an error (a network failure is not reported as "stale", and not as fresh).
- Tests live in `lib/aoe4-build-order/` as `.ts` files (vitest `include` collects only `utils/`, `lib/`, `components/` `*.test.ts`; tsc does not check `.mjs`), importing the `.mjs` modules, as existing tests there already import from `data/`. A test beside the script in `data/` would never run. Do not change the vitest `include`.
- New `.github/workflows/aoe4-data-freshness.yml`: triggers `schedule` (weekly, one cron line) and `workflow_dispatch`; no `pull_request` or `push` trigger so it never becomes a PR check; `permissions: contents: read`; checks out, sets up Node 24 (`engines`), runs the script with `GITHUB_TOKEN` passed for API rate limits. A stale or unreachable result fails the job (red run, GitHub notifies the owner). No `npm ci` is needed since the scripts use only Node built-ins.
- Docs made untrue: `data/aoe4-build-order/README.md` file table and "Refreshing the snapshot" section (add the new module, the check and what a failure means; step 1 "usually the latest on main" stays true); REPO.md "CI behavior" and the `babysit` comment are updated by the manager on merge (see On merge).

**Out of scope:** opening an issue instead of failing the run (alternative: needs `issues: write` and de-duplication of an open issue; owner may switch later); auto-opening a refresh PR; running the check on PRs; changing `refresh-snapshot.mjs` behavior beyond importing the shared module; patch-note detection; other civs.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] The comparison function returns "fresh" when the committed snapshot's English entries equal upstream's, and "stale" naming the differing kind when any entry is added, removed, or changed in one kind; a test covers an added, a removed, and a changed entry, and fails if the comparison ignores a kind or compares only the commit sha.
- [ ] A test pins that a differing upstream commit with identical English content is fresh, that a differing `source.fetchedAt` alone is fresh, and that an order-only change in a kind is stale.
- [ ] The script exits non-zero with a message that is distinguishable from "stale" when an upstream fetch fails or returns a non-OK status; a test with a faked fetch covers this and fails if the failure is treated as fresh. The test also covers that the content fetch uses the sha returned by the latest-commit lookup.
- [ ] Importing the shared module and the check script has no side effects (no exit, no network, no file write), shown by the tests importing them; the check never writes under `data/aoe4-build-order/`, shown by a test or by its structure (no write calls).
- [ ] Neither `refresh-snapshot.mjs` nor the check script defines the repo name, kinds list, civ id, or English filter itself; both import them from the shared module. `refresh-snapshot.mjs` behavior is unchanged (running it without arguments prints the same usage line and exits 1).
- [ ] The new tests are `.ts` files collected by vitest and appear in `npm test` output (the implementer records the file names and counts in the report); the vitest `include` is unchanged.
- [ ] The workflow file parses as valid workflow YAML (checked with a YAML parser or `actionlint` if available, result recorded in the report), triggers only on `schedule` and `workflow_dispatch`, and requests only `contents: read`.
- [ ] The workflow, run once via `workflow_dispatch` after merge, passes when the snapshot is fresh; the implementer records that it cannot run it before merge, and the manager verifies the first run (reported under Unverified assumptions).
- [ ] `data/aoe4-build-order/README.md` describes the shared module, the check, and the failure meaning; no README text claims the snapshot is only ever refreshed with no automated freshness signal.
- [ ] `npm test`, `npx tsc --noEmit`, and `npm run lint:dup` pass; the Vercel preview is unaffected (the workflow adds no PR check).
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-12

- Underspecified: where tests live (vitest collects only `lib/`, `utils/`, `components/`), how the check shares constants with `refresh-snapshot.mjs` (which has top-level side effects), the meaning of "content differs", and how the latest commit is resolved.
- Changed: Scope names a side-effect-free shared module, test location under `lib/aoe4-build-order/`, deep-equality-per-kind definition (order counts, `source` ignored), `commits/HEAD` then fetch at that sha; criteria for test collection, import purity and order; On merge adds the `babysit` comment.
- Stands: workflow design, triggers, permissions, exit-code contract, README scope.
