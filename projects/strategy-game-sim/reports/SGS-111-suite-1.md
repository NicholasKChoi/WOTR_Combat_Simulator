# SGS-111 suite gate 1

**Verdict: PASS**

- Batch: SGS-111 (branch `sgs-111-drop-house-gate`, base `origin/main`)
- Tip SHA: `8ac8ee9` (detached worktree, removed after the run)
- Command: `npm test` (`commands.unit`, `vitest run`), run through `run.sh`
- Log: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/reports/SGS-111-suite-1.unit.log`
- Summary line: `Test Files  62 passed (62)`, `Tests  1842 passed | 10 skipped (1852)`, exit 0
- Tree after the run: `git status --porcelain` empty. No codegen configured, so no codegen dirt check applies.
- Gate check: `git grep` for `houseGateOpen` and `auto-houses-held` over `lib`, `components`, `pages`, `acceptance`, `docs`, `data` returns no match at the tip, so the SGS-111 removals are present in the code under test.

## Failures

None.

## Setup

- `commands.acceptanceSetup` (`npm ci && npm run acceptance:setup`) ran before the unit suite: `npm ci` added 250 packages with 0 vulnerabilities; `playwright install chromium` exited 0 (run twice, the second time to capture the exit status; both were clean).
- `commands.codegen` is empty, so it was skipped.
- `commands.build` and `commands.lint` were not run: `commands.unit` is set, so per the run rules the verdict comes from the unit command only.
- The 10 skipped tests are reported by vitest as skipped and were not investigated; they are not failures.

## BLOCKER

None.

## Environment

- Runtime matches the declared version. `package.json` `engines.node` is `24.x` and `REPO.md` `shellSetup` is `nvm use 24`. Installed through run.sh: Node `v24.22.2`, npm `11.19.1`. No mismatch.
- `CLAUDE_PLUGIN_ROOT` was unset in the agent shell, so `run.sh` was invoked by absolute path: `/home/choin/git/code-factory/scripts/run.sh`. This did not affect results.
- The worktree was created at `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-111` and removed with `git worktree remove --force`, followed by `git worktree prune`. No dev server or other process was started.
