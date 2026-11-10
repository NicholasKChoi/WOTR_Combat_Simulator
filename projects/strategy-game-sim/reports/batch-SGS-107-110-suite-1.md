# Batch 10 CI-parity suite: SGS-107 -> SGS-108 -> SGS-109 -> SGS-110

Verdict: PASS

Tip SHA: `3c68fb27e6cc68ef90728dacaaa937002dcec291` (branch `sgs-110-text-gutter-annotations`)
Worktree: detached `worktrees/suite-batch10`, created from that SHA, removed after the run.

## Commands

1. `npm ci` (through run.sh; needed to create node_modules, not a REPO.md command). Added 250 packages, 0 vulnerabilities.
2. `npm run acceptance:setup` (REPO.md `commands.acceptanceSetup`, Chromium install). Exit 0.
3. `commands.codegen`: empty in REPO.md, not run.
4. `commands.unit` (`npm test`, log: `/tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/0f69b7e4-95bd-4a2f-81c0-06cf5cd41b25/scratchpad/batch10-unit.log`):
   - `Test Files  63 passed (63)`
   - `Tests  1953 passed | 10 skipped (1963)`
   - Exit 0.
5. `commands.acceptance` (`npm run acceptance`, Playwright, REPO.md lists it; log: `/tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/0f69b7e4-95bd-4a2f-81c0-06cf5cd41b25/scratchpad/batch10-acceptance.log`):
   - `889 passed (2.0m)`, 0 failed, 0 flaky.
   - Playwright managed its own `next dev` webServer.
6. `git status --porcelain` in the suite worktree after the run: empty (clean tree). No codegen step, so no codegen dirt.

## Failures

None.

## Environment

- Runtime: node `v24.22.2`, npm `11.19.1`. Declared `engines.node` is `24.x` (package.json), and `.nvmrc` matches via `shellSetup` (`nvm use 24`). No mismatch.
- Unit: 10 tests skipped (`10 skipped (1963)`). Not investigated; they are not failures and are reported only so the count is visible.

## Blockers

None.
