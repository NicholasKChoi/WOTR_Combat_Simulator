# Suite report: batch-SGS-161-SGS-161 (suite-1)

## Verdict: PASS

- Command: `npm test` (commands.unit, `vitest run`), run in full through `run.sh`.
- Summary line: `Test Files  84 passed | 1 skipped (85)`, `Tests  2609 passed | 15 skipped (2624)`.
- Branch: `sgs-161-chart-axis-corner-labels`, tip `774514b5a801b82ce546da318fff96de4079deae` (base `main`).
- Full log: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-161-SGS-161.unit.log`
- `git status --porcelain` after the run: clean (no codegen configured, no tree changes).

## Environment

- Node: installed `v24.22.2` (npm 11.19.1), declared `"engines": {"node": "24.x"}` in `package.json`. Match, no mismatch.
- No `.nvmrc`, `.node-version`, or `.tool-versions` in the repo.
- Dependencies: the scratch checkout had no `node_modules`. Ran the first step of `commands.acceptanceSetup` (`bash .../bin/link-node-modules.sh .`, via `run.sh`), which linked the cached modules from `nm-cache/d57d0fdd0e531d4b`. The Playwright/Chromium step (`npm run acceptance:setup`) was not run, since unit tests do not use it.
- `commands.codegen` is empty; skipped.
- `commands.lint` and `commands.build` were not run; the manager asked for the unit command as the verdict.

## Failures

None.

## Cleanup

- No processes started. Scratch checkout removal is run after this report.
