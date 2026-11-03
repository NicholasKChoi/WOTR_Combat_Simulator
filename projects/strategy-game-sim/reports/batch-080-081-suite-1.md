# Suite report: batch-080-081 (CI-parity unit gate)

## Verdict: PASS

- Command: `npm test` (REPO.md `commands.unit`, Vitest `vitest run`), run in full, not a subset.
- Summary line: `Test Files  45 passed (45)`, `Tests  1346 passed | 10 skipped (1356)`, exit 0.
- Branch: `sgs-081-aoe4-retune-prebuilt-farms`, tip SHA `2fc9593`.
- Stack check: `sgs-080-aoe4-one-villager-per-farm` at `c8cca5f` is an ancestor of `2fc9593`.
- Full log: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/reports/batch-080-081-suite-1.unit.log`

## Setup

- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-batch-080-081`, detached at `2fc9593`.
- Install: `npm ci` exited 0 (0 vulnerabilities). Log at `/tmp/suite-batch-080-081-ci.log`.
- `commands.acceptanceSetup` (Chromium install) was not run. It is only needed for the acceptance suite, not `npm test`.
- `commands.codegen` is empty, so it was not run.
- `git status --porcelain` after the run is empty. The tree is clean.

## Failures

None.

## Skipped tests

10 tests are reported as skipped. I did not trace their source. A grep for literal `.skip`, `it.todo`, and `xit(` in the app source found no matches, so the skips probably come from a runtime condition or a Vitest option. The count did not change the verdict.

## Environment

- Node mismatch: installed `v22.17.0`, but `package.json` `engines.node` is `24.x`. The suite passed on 22.17.0.
  - Install command for the declared version: `nvm install 24 && nvm use 24`, then re-run `npm ci && npm test`.
  - The mismatch did not stop the run, and the run passed anyway. The acceptance harness in REPO.md states it needs Node 24.x, so acceptance was not covered by this gate.
- npm `10.9.2`.

## Cleanup

- Worktree removed with `git worktree remove --force` and `git worktree prune` (see the final step).
