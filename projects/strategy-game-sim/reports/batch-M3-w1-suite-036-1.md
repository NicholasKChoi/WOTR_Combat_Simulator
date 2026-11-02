# CI-parity suite: sgs-036-aoe4-request-hardening (batch-M3-w1)

**Verdict: PASS** (all three gates green, no failures to classify)

## Subject

- Branch: `sgs-036-aoe4-request-hardening`
- Tip SHA: `b83701aa1372266cfa5e0b6a4fe285dc5e481a0a`
- Stack: `b83701a` -> `c7ef794` -> `618818b` -> `9998b4f` (sgs-053-aoe4-m2-doc-wording) -> `f078c11` (origin/main)
- Verified with `git merge-base --is-ancestor`: tip descends from 9998b4f and f078c11.
- Checked out detached in `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-036-b83701a-1` (removed after this report).

## Results

| Gate | Command | Result |
|------|---------|--------|
| Unit | `npm test` (REPO.md `commands.unit`, `vitest run`) | PASS: 27 of 27 files, 700 of 700 tests, exit 0 |
| Typecheck | `npx tsc --noEmit` | PASS: exit 0, no output |
| Build | `npx next build` (Next.js 16.4.3, Turbopack) | PASS: exit 0, compiled successfully, 6 static pages generated |

Unit summary line: `Test Files 27 passed (27)`, `Tests 700 passed (700)`.

Build routes: `/`, `/404`, `/apps/aoe4-build-order` (SSG), `/apps/combat-simulator`, `/apps/starcraft-helper` (static), `/api/aoe4-build-order/simulate`, `/api/fight` (dynamic).

Logs (scratchpad): `/tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/d25428ed-0c81-4238-ac7f-4830d6e9a031/scratchpad/unit.log`, `.../tsc.log`, `.../next-build.log`.

## Setup

- `npm ci` ran in the suite worktree (exit 0). `commands.acceptanceSetup` was not run: the Chromium step is for the Playwright acceptance suite, and the unit suite needs only `node_modules`.
- `commands.codegen` is empty in REPO.md; nothing run.
- `git status --porcelain` after tsc and after `next build`: empty. The tree is clean.

## Environment

- Runtime: Node `v24.22.2`, npm `11.19.1`, selected with `source ~/.nvm/nvm.sh; nvm use 24`.
- Declared: `package.json` `engines.node` = `24.x`. No `.nvmrc`, `.node-version`, or `.tool-versions` in the repo.
- Match. No mismatch to report.

## Failures

None.

## Side observation (out of scope for this suite)

When I started, a worktree directory named `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-batch-M3-w1` already existed and was registered as a detached worktree at `0dd2411`, created at 19:33 the same minute. It is not mine and I did not touch it. I created my worktree under a different name. Another agent may be running a parallel suite with the same name, and the manager should check it so the two do not collide.
