# SGS-091 CI-parity suite run 1

## Verdict: PASS

- Branch: `sgs-091-aoe4-engine-cleanups`
- Tip SHA: `aa22ab1f312b4d2cc30dc420475237e8ea4ab370` (local only; base `origin/main` 6103ed7 is an ancestor)
- Command: `npm test` (`vitest run`), the `commands.unit` value from REPO.md, run in detached worktree `worktrees/suite-SGS-091`
- Log: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/reports/.suite-SGS-091-unit.log`
- Summary line: `Test Files  46 passed (46)`, `Tests  1424 passed | 10 skipped (1434)`, exit 0

## Skipped tests

The 10 skips are all conditional `it.runIf(build.name.includes(...))` cases in `lib/aoe4-build-order/builds.test.ts`
(lines 52, 106, 116, 128, 142). They are gated by build name by design, not disabled tests.

## Setup

- `npm ci` ran in the worktree before the unit run (exit 0). Log: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/reports/.suite-SGS-091-ci-install.log`.
- `commands.acceptanceSetup` was not run. The unit suite is Vitest only and does not need Chromium.
- `commands.codegen` is empty, so no codegen step ran.

## Working tree

`git status --porcelain` in the suite worktree is empty after install and tests. No dirty tree.

## Failures

None.

## Environment

- Installed Node: v24.22.2
- Declared: `engines.node` `24.x` in `package.json`; no `.nvmrc` or `.node-version`. Versions match, no mismatch.
- Vitest reports v5.0.5.

## Cleanup

The worktree `worktrees/suite-SGS-091` is removed with `git worktree remove --force`, followed by `git worktree prune`.
