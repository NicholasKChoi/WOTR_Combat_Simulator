# CI-parity suite: batch SGS-028 + SGS-029

Verdict: **PASS**

- Stack: `sgs-028-aoe4-parse-build-order-text` (442832e) under `sgs-029-aoe4-validate-build-order`.
- Base: origin/main 72d74a0 (ancestor of tip, verified).
- Tested SHA: d8bce08 (`sgs-029-aoe4-validate-build-order`, local only), detached worktree
  `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-batch-028-029`, removed after the run.

## Results

| Step | Command | Verdict | Summary |
|------|---------|---------|---------|
| Install | `npm ci` | exit 0 | 0 vulnerabilities |
| Unit (REPO.md `commands.unit`) | `npm test` (`vitest run`) | PASS, exit 0 | Test Files 18 passed (18); Tests 486 passed (486) |
| Typecheck | `npx tsc --noEmit` | PASS, exit 0 | no output |
| Build | `npx next build` | PASS, exit 0 | Next.js 16.4.3 compiled; routes `/`, `/apps/combat-simulator`, `/apps/starcraft-helper`, `/api/fight` built |

- `commands.acceptanceSetup` was not run: the unit suite does not need Chromium.
- `commands.codegen` is empty; nothing run.
- Logs: `/tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/9e073c9d-a56e-49b2-9b87-63be82c3ecea/scratchpad/unit.log`, `tsc.log`, `build.log`, `npm-ci.log`.

## Tree state

- `git status --porcelain` after the run: empty. Nothing dirty after build.

## Failures

None.

## Environment

- Node: installed v24.22.2 (via `$HOME/.nvm/versions/node/v24.22.2/bin`), matches the declared `engines.node` 24.x, `.nvmrc` absent, no other version files. No mismatch.
- No leftover processes (checked for next/vitest/playwright).
