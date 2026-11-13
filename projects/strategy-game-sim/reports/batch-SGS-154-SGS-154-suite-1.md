# CI-parity suite: batch SGS-154 (suite-1)

**Verdict: PASS**

- Branch: `sgs-154-unpinned-aoe4-acceptance`
- Branch tip SHA: `9fa4c168202efa1f95d31e431cd73b77f558a550` (verified at run time; detached worktree at the same SHA)
- Base: `main` (origin/main fetched before the run)
- Ticket: `projects/strategy-game-sim/tickets/SGS-154-re-add-unpinned-aoe4-acceptance-coverage.md`

## Command run

`commands.unit` from REPO.md, exactly: `npm test` (runs `vitest run`), executed through
`scripts/run.sh` with `commands.shellSetup`. Full log:
`/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-154.unit.log`

Summary lines from the log:

```
Test Files  81 passed | 1 skipped (82)
Tests  2512 passed | 15 skipped (2527)
```

Exit code 0.

## Skips (expected, not failures)

- `lib/aoe4-build-order/blob-build-store.live.test.ts`: whole file gated by `describe.skipIf(process.env.BLOB_LIVE !== '1')`. Not run, as instructed (`test:blob-live` was not run).
- `lib/aoe4-build-order/builds.test.ts`: 15 cases gated by `it.runIf(build.name.includes('1TC' | 'King'))`, skipping builds whose name does not match. Gating by build data, not an environment problem.

## Setup

- `commands.acceptanceSetup` ran in the suite worktree: `link-node-modules.sh .` (hardlinked node_modules, cache key from the lockfile hash) then `npm run acceptance:setup` (Chromium install). Both exited 0. The unit suite only needs the node_modules step; the Chromium install was part of the declared setup and was not otherwise used.
- `commands.codegen` is empty; skipped.
- `commands.build` and `commands.lint` were not run: `commands.unit` is set, so they were not required.

## Working tree

`git status --porcelain` in the suite worktree after the run: empty (clean). No codegen, no generated files.

## Environment

- Installed: Node `v24.22.2`, npm `11.19.1`.
- Declared: `engines.node` = `24.x` in `package.json`; REPO.md `shellSetup` = `source ~/.nvm/nvm.sh && nvm use 24`. No `.nvmrc`, `.node-version`, or `.tool-versions` in the repo.
- Match: yes. No mismatch to report.

## Failures

None.

## Cleanup

- `git worktree remove --force` on `worktrees/suite-SGS-154`: exit 0. The worktree is gone.
- `git worktree prune`: exit 0, but it printed EBUSY ("Device or resource busy") for stale worktree metadata of unrelated earlier runs (`sgs-112` through `sgs-126`, `m9-design`, `rebase-sgs-112-server-debt`). These are deferred cleanup, not this run's worktree. Not an issue.
- The unit log is kept at the path above.
