# BATCH-032 suite gate 1 (CI parity)

Verdict: **PASS**

Batch: SGS-032 (research handler and veterancy)
Branch: sgs-032-aoe4-research-veterancy
Tested SHA: 7e41e687f81ef522eed5d870c25c7a3269ce3490 (local branch tip, matches the SHA given by the manager)
Base: origin/main a714a235a873101e0367517ed35fd82686cf225e
Worktree: detached at 7e41e68, removed after the run

## Results

| Command | Result | Summary |
|---------|--------|---------|
| `npm test` (REPO.md commands.unit) | PASS, exit 0 | Test Files 22 passed (22); Tests 613 passed (613) |
| `npx tsc --noEmit` | PASS, exit 0 | no output |
| `npx next build` | PASS, exit 0 | Compiled successfully; routes `/`, `/404`, `/api/fight`, `/apps/combat-simulator`, `/apps/starcraft-helper` built |
| `npm run acceptance:setup` | PASS, exit 0 | Chromium installed |
| `npm run acceptance` (Playwright) | PASS, exit 0 | 209 passed (10.2s) |

Dependencies: `npm ci` completed with exit 0 and reported 0 vulnerabilities.

Git status in the worktree after the run (codegen is empty, so none ran): clean, no output from `git status --porcelain`.

Logs (session scratchpad):
- /tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/9e073c9d-a56e-49b2-9b87-63be82c3ecea/scratchpad/npm-ci.log
- /tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/9e073c9d-a56e-49b2-9b87-63be82c3ecea/scratchpad/unit.log
- /tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/9e073c9d-a56e-49b2-9b87-63be82c3ecea/scratchpad/tsc.log
- /tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/9e073c9d-a56e-49b2-9b87-63be82c3ecea/scratchpad/build.log
- /tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/9e073c9d-a56e-49b2-9b87-63be82c3ecea/scratchpad/acc-setup.log
- /tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/9e073c9d-a56e-49b2-9b87-63be82c3ecea/scratchpad/acceptance.log

Failures: none. Blockers: none.

## Environment

- Node v24.22.2 (installed via nvm, used via PATH). The repo declares `"engines": {"node": "24.x"}`. No mismatch. No `.nvmrc`, `.node-version`, or `.tool-versions` file exists.
- Acceptance webserver emitted a Next.js console notice about `scroll-behavior: smooth` on `<html>`. It is informational and did not fail any test.

## Cleanup

- `git worktree remove --force` on the suite worktree, then `git worktree prune`.
- No dev server, Playwright, or vitest process was left running.
