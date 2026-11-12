# Suite report: batch SGS-130 to SGS-140 (suite-1)

## Verdict: PASS

- Stack (bottom-up): sgs-130-blob-landed-write-retry-cap, sgs-131-my-builds-no-wipe-and-backup,
  sgs-134-chart-layout-model-key-results-collapse, sgs-136-simulate-production-buildings-series,
  sgs-140-editor-compact-mode.
- Branch tested: sgs-140-editor-compact-mode
- Tip SHA: 72be9db6aa1e0c8e495863d6256035b3710e3469 (verified; the detached worktree HEAD matches)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-130-SGS-140
- Command: `npm test` (REPO.md `commands.unit`), run through run.sh, full suite, not partial.
- Log: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-130-SGS-140.unit.log
- Summary line: `Test Files  77 passed | 1 skipped (78)`, `Tests  2441 passed | 15 skipped (2456)`, 0 failed.

## Failures

None.

## Environment

- Node: installed v24.22.2, npm 11.19.1. Declared `engines.node` is `24.x` (`package.json`), and `.nvmrc`
  is absent. Match, no mismatch.
- node_modules: linked with `bin/link-node-modules.sh` (the install half of `commands.acceptanceSetup`).
  The unit suite needs only node_modules, so `npm run acceptance:setup` (Chromium install) was not run.
- `commands.codegen` is empty; not run.
- `commands.build` and `commands.lint` were not run, because `commands.unit` is set.

## Tree state

- `git status --porcelain` in the suite worktree: clean, nothing to commit.

## Cleanup

- Worktree removal and prune are performed after this report is written, per the run procedure.
