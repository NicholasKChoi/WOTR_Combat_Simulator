# Batch 13 CI-parity suite (SGS-125 save panel)

Verdict: **PASS**

- Branch: `sgs-125-save-panel`
- Tip SHA: `731699de99344cf10c24a660dc9c53cc2a6dcf61` (checked out detached in a suite worktree)
- Base: `origin/main` 4489f09 (ancestor check passed)
- Commits in range: `be351ae` Save panel: save as copy and save a new version; `ac5b1e6` Share held-request setup in the my-builds spec; `731699d` Make the reload test wait for the chosen build's run before asserting Save a new version is disabled

## Runs

1. `git fetch origin` and `git worktree add --detach` at the tip SHA: OK.
2. Runtime check through run.sh: `node -v` gives v24.22.2, npm 11.19.1. Matches `engines.node` `24.x` in package.json. No `.nvmrc`, `.node-version`, `.python-version`, or `.tool-versions` in the repo. No mismatch.
3. `commands.acceptanceSetup` (`link-node-modules.sh .` plus `npm run acceptance:setup`): exit 0. Log: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/reports/batch13-suite-1.setup.log`. `commands.codegen` is empty, so it was not run.
4. `commands.unit` (`npm test`, which is `vitest run`), full run: exit 0.
   - Summary: `Test Files 72 passed (72)`, `Tests 2340 passed | 13 skipped (2353)`, duration 3.65s.
   - Log: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/reports/batch13-suite-1.unit.log`
   - The branch diff from 4489f09 adds no `.skip`, `it.todo`, `xit`, or `xdescribe`, so the 13 skipped tests are not new in this batch.
   - `commands.acceptance` was not run. Acceptance runs belong to the acceptance-test role, per common.md.
5. `git status --porcelain` in the suite worktree after the runs: empty. The tree is clean, and HEAD is still the tip SHA.

## Failures

None.

## Blockers

None.

## Environment

- Node 24.22.2 installed, `engines.node` declares `24.x`. Match.
- Test logs and the setup log were written to the project `reports/` directory, not into the worktree.
