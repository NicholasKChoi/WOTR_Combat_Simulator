# SGS-087 CI-parity suite run 1

**Verdict: PASS**

- Branch: sgs-087-aoe4-chart-readability
- Tip SHA: e2813b5724e5e368d4e1bec1e2caaccbdf4907b0 (commit "AoE4 charts: label only age-up markers, round tooltip values to one decimal", Nick Choi)
- Base: origin/main 6103ed737e175a5b0a9552870a4359fb75d8351d
- Worktree: detached at the tip, created under the factory worktrees root, removed after the run.

## Commands

1. `npm ci` (install in the suite worktree): exit 0, 0 vulnerabilities. Log: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/reports/.suite-SGS-087-ci.log`
2. `commands.acceptanceSetup` was not run. The unit suite (Vitest) does not need Chromium.
3. `commands.codegen` is empty; skipped.
4. `commands.unit` run exactly: `npm test` (`vitest run`). Exit 0. Log: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/reports/.suite-SGS-087-unit.log`
   - Summary line: `Test Files  46 passed (46)`, `Tests  1369 passed | 10 skipped (1379)`, duration 2.76s.
5. `git status --porcelain` after the run: empty (clean tree).

## Failures

None.

## Notes

- The 10 skipped tests were not traced to their source. A grep for `it.skip`, `test.skip`, `describe.skip`, `.todo`, `xit(` and `xtest(` in the worktree found none, so the skips are probably conditional. Not investigated; they did not fail.
- `lint` (`tsc --noEmit` plus `jscpd`) and `build` were not run. `commands.unit` is set, so they were not required for the verdict.

## Environment

- Runtime: Node v24.22.2, npm 11.19.1. Declared engine in `package.json`: `node: 24.x`. Match, no mismatch.
- No `.nvmrc`, `.node-version`, `.python-version` or `.tool-versions` in the repo.
- Install command used: `npm ci`.

## Cleanup

- Suite worktree `worktrees/suite-SGS-087` removed with `git worktree remove --force`, then `git worktree prune`.
- No dev server, Playwright or other process was started. No vitest process remains.
