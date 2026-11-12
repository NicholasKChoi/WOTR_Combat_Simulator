# Suite report: batch SGS-130 to SGS-140 (suite-2)

## Verdict: PASS

- Stack (bottom-up on origin/main 0ba1970): sgs-130-blob-landed-write-retry-cap, sgs-131-my-builds-no-wipe-and-backup,
  sgs-134-chart-layout-model-key-results-collapse, sgs-136-simulate-production-buildings-series,
  sgs-140-editor-compact-mode.
- Branch tested: sgs-140-editor-compact-mode
- Tip SHA: cf023bb4646d5692101ee4fd7d780b8e5f4769ba (verified; the detached worktree HEAD matches, and 0ba1970 is an ancestor)
- Commits in stack beyond 0ba1970: 13 (f05c454 through cf023bb)
- Command: `npm test` (REPO.md `commands.unit`), run through run.sh, full suite, not partial.
- Log: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/reports/batch-SGS-130-SGS-140-suite-2.unit.log
- Summary lines:
  - `Test Files  77 passed | 1 skipped (78)`
  - `Tests  2455 passed | 15 skipped (2470)`
  - 0 failed. The log contains no "failed" or "error" lines.

## Failures

None.

## Environment

- Node: installed v24.22.2, npm 11.19.1. Declared `engines.node` is `24.x` (`package.json`), and `.nvmrc`,
  `.node-version`, `.python-version`, `.tool-versions` are absent. Match, no mismatch.
- node_modules: linked with `bin/link-node-modules.sh` (cache `nm-cache/d57d0fdd0e531d4b`), the install half of
  `commands.acceptanceSetup`. The unit suite needs only node_modules, so `npm run acceptance:setup` (Chromium install)
  was not run.
- `commands.codegen` is empty; not run.
- `commands.build` and `commands.lint` were not run, because `commands.unit` is set.
- Test count moved from 2441 passed (suite-1, tip 72be9db) to 2455 passed (this tip, cf023bb). Same 77 files passed
  and 1 skipped; the difference is the added tests in this stack.

## Tree state

- `git status --porcelain` in the suite worktree after the run: clean, nothing to commit.

## Cleanup

- Worktree removal (`git worktree remove --force`) and `git worktree prune` are performed after this report is written.
