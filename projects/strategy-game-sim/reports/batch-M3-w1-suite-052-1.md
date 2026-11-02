# CI-parity suite: sgs-052-aoe4-chart-yaxis-overlap

- Branch: sgs-052-aoe4-chart-yaxis-overlap
- Tip: 0dd24116a1837be86025f69eaea3139e6965b24a ("Reserve room for 4-digit Y ticks so the axis label does not overlap them", Nick Choi)
- Base: origin/main f078c11 (tip is a descendant; `git log f078c11..HEAD` is one commit)
- Worktree: detached at tip, removed after this report.

## Verdict: PASS

All three gates passed under Node 24.22.2.

| Gate | Command | Result |
|------|---------|--------|
| unit | `npm test` (REPO.md commands.unit, `vitest run`) | PASS: Test Files 27 passed (27), Tests 695 passed (695), exit 0 |
| typecheck | `npx tsc --noEmit` | PASS, exit 0, no output |
| build | `npx next build` | PASS, exit 0. Next.js 16.4.3 (Turbopack), compiled successfully, 6 static pages generated, routes: `/`, `/404`, `/apps/aoe4-build-order`, `/apps/combat-simulator`, `/apps/starcraft-helper`, `/api/aoe4-build-order/simulate`, `/api/fight` |

Logs:
- `/tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/d25428ed-0c81-4238-ac7f-4830d6e9a031/scratchpad/unit.log`
- `/tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/d25428ed-0c81-4238-ac7f-4830d6e9a031/scratchpad/tsc.log`
- `/tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/d25428ed-0c81-4238-ac7f-4830d6e9a031/scratchpad/build.log`
- `/tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/d25428ed-0c81-4238-ac7f-4830d6e9a031/scratchpad/npmci.log`

## Failures

None.

## Codegen and tree state

- `commands.codegen` is empty in REPO.md; no codegen step ran.
- `commands.acceptanceSetup` was not run: it installs Chromium for the Playwright acceptance suite, which is not part of `commands.unit`.
- `git status --porcelain` after the runs: empty (clean). Only git-ignored build output exists (`.next/`, `next-env.d.ts`, `tsconfig.tsbuildinfo`), created by `next build`.

## Environment

- Runtime: Node v24.22.2 via `nvm use 24`. Matches the declared `engines.node` = "24.x" in package.json. No mismatch. No `.nvmrc` or `.node-version` file exists in the repo.
- Dependencies: `npm ci` under Node 24 completed with 0 vulnerabilities.
- Not run: `commands.acceptance` (Playwright), `golang/` (no Go toolchain, out of scope per REPO.md).
- No long-running processes were started; `next build` and vitest exited on their own.
