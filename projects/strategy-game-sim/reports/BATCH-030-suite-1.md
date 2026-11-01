# BATCH-030 CI-parity suite, run 1

Batch: SGS-030 (engine core), single branch `sgs-030-aoe4-engine-core`.
Tip under test: `796bf6e580b19bb46525cec58c73683767222131` (796bf6e, "Add acceptance tests for the AoE4 simulation engine").
Base: `origin/main` = `dbe695f`.
Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-batch-030` (detached at 796bf6e, removed after this run).

## Verdict: PASS

| Gate | Command | Result |
|------|---------|--------|
| Install | `npm ci` | exit 0, 0 vulnerabilities |
| Unit (REPO.md `commands.unit`) | `npm test` (`vitest run`) | exit 0. Test Files 20 passed (20). Tests 555 passed (555). |
| Typecheck (REPO.md `commands.lint`) | `npx tsc --noEmit` | exit 0, no output |
| Build (REPO.md `commands.build`) | `npx next build` | exit 0. Compiled successfully (Next.js 16.4.3, Turbopack). Routes: `/`, `/404`, `/api/fight` (dynamic), `/apps/combat-simulator`, `/apps/starcraft-helper`. |

`commands.codegen` is empty, so no codegen step ran. `commands.acceptanceSetup` was not run because the unit suite does not need it.

Tree after the run: `git status --porcelain` is empty. No dirty files.

Logs (scratchpad): `/tmp/claude-1000/suite-030-ci.log` (npm ci), `/tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/9e073c9d-a56e-49b2-9b87-63be82c3ecea/scratchpad/suite-030-unit.log`, `.../scratchpad/suite-030-tsc.log`, `.../scratchpad/suite-030-build.log`.

## Failures

None.

## Environment

- Declared runtime: `package.json` `engines.node` = `24.x`. No `.nvmrc`, `.node-version`, or `.tool-versions` in the repo.
- Installed: Node v24.22.2, npm 11.19.1 (via `$HOME/.nvm/versions/node/v24.22.2/bin`).
- Match: yes. No mismatch to report.
- Note: the `npm ci` log was written to `/tmp` rather than the scratchpad. It is a plain log file and has no effect on the result.
