# BATCH-025-027 CI-parity suite, run 1

Verdict: **PASS**

Tip tested: `e0bf45537d5e042bf8a43e7f3ffc5a2fb41788da` (sgs-027-aoe4-effects-gather-construction)
Batch (linear stack on main 68e004a): SGS-025 c763bec, SGS-026 1fc08bd, SGS-027 e0bf455.
Worktree: detached at e0bf455 under `$FACTORY_DIR/worktrees/suite-025-027`, removed after the run.

## Results

| Command (REPO.md) | Result | Summary |
|---|---|---|
| `commands.unit` (`npm test`, vitest run) | PASS, exit 0 | Test Files 14 passed (14); Tests 186 passed (186) |
| `commands.lint` (`npx tsc --noEmit`) | PASS, exit 0 | no output |
| `commands.build` (`npx next build`, the Vercel check) | PASS, exit 0 | all routes built, including `/apps/combat-simulator` and `/api/fight` |
| `commands.codegen` | not set | skipped |
| `commands.acceptanceSetup` / `acceptance` | not run | the unit verdict does not depend on them; Playwright is not part of `commands.unit` |

Install: `npm ci` exit 0, 0 vulnerabilities.

Tree status after unit and after build: `git status --porcelain` is empty. No codegen, so no dirty-tree failure.

Logs (scratchpad): `/tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/9e073c9d-a56e-49b2-9b87-63be82c3ecea/scratchpad/suite-unit.log`, `.../suite-lint.log`, `.../suite-build.log`.

## Failures

None.

## Classification

No failures to classify.

## Environment

- Node installed: v24.22.2 (via `$HOME/.nvm/versions/node/v24.22.2/bin`). Declared: `engines.node` is `24.x`, and no `.nvmrc`, `.node-version`, or `.tool-versions` exists. No mismatch.
- npm ci: exit 0.
- No blockers.
