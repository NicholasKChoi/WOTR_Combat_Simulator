# SGS-093 CI-parity suite run 1

Verdict: **PASS**

## Run

- Branch: `sgs-093-aoe4-docs-prebuilt-cleanups`
- Tip SHA: `26eebf9e2942894622c1232ba60d744fa5d428cb` (base `origin/main` fcfbaf1)
- Worktree: detached at the tip, `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-093` (removed after this run)
- Setup: `npm ci` (exit 0, 0 vulnerabilities). Install output was not kept.
- `commands.acceptanceSetup`: not run. The unit suite is Vitest and does not need Chromium.
- `commands.codegen`: empty in REPO.md, not run.
- `commands.unit` (`npm test`, which runs `vitest run`) run in full, output teed to `/tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/fe37a078-0455-4b3a-a6fa-5c6b2dc1f4c4/scratchpad/suite-SGS-093-unit.log`. Exit 0.
- Summary line: `Test Files 46 passed (46)`, `Tests 1361 passed | 10 skipped (1371)`, Vitest v5.0.5, duration 4.05s.

## Skipped tests

The 10 skipped tests are name-gated `it.runIf(...)` cases in `lib/aoe4-build-order/builds.test.ts`, which run only for builds whose name matches `1TC` or `King`. They are by design, not failures.

## Working tree

`git status --porcelain` after the run is empty. No codegen ran, so nothing drifted. No commit was made.

## Failures

None.

## Environment

- Node: installed v24.22.2, declared `"node": "24.x"` in `package.json` `engines`. Match, no action needed.
- npm: 11.19.1.
- Install command for the declared runtime, if it is ever needed: `nvm install 24 && nvm use 24`.
- Build and lint were not run, since `commands.unit` is set.

## Cleanup

Worktree removal and `git worktree prune` are the final steps before handback. No dev server or watcher was started. No vitest process remained.
