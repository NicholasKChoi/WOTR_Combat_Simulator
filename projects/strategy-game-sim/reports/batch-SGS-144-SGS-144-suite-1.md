# Suite report: batch SGS-144 (suite-1)

**Verdict: PASS**

- Branch: `sgs-144-rem-basis-compact-threshold`
- Tip SHA tested: `a79011d689c258d3ce7bfb207282917b1dd6b93c` (detached HEAD in the suite worktree; matches the SHA the manager named)
- Base: `main`
- Commands run: `commands.unit` (`npm test`, which is `vitest run`) only. `commands.codegen` is empty, so none ran. `commands.acceptanceSetup` was not run because the unit suite does not need Chromium. `commands.acceptance` was not run (only acceptance-test runs it, per common.md). `build` and `lint` were not run because `commands.unit` is set.
- Log: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-144-unit.log`

## Result

```
Test Files  83 passed | 1 skipped (84)
Tests       2552 passed | 15 skipped (2567)
```

No failures. The skipped file and tests are pre-existing skips; no classification needed.

## Post-run tree

`git status --porcelain` in the suite worktree is empty after the run. No codegen ran, so no tree dirtiness to report.

## Environment

- Runtime: installed Node `v24.22.2`, npm `11.19.1` (via `run.sh`, which loads `commands.shellSetup`). Declared: `engines.node` is `24.x` in `package.json`. No `.nvmrc`, `.node-version`, or `.tool-versions` exists. Match, no mismatch.
- node_modules: linked from the cache with `bin/link-node-modules.sh .` (cache key `d57d0fdd0e531d4b`). No install from scratch was needed.
- Vitest reported `v5.0.5`.

## Cleanup

- Suite worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-144`. Removal is attempted after this report is written, with `git worktree remove --force` and `git worktree prune`. Any EBUSY is deferred cleanup per REPO.md.
- No dev server or other process was started.
