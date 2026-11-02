# CI-parity suite: sgs-035-aoe4-engine-common-dup-check

- Branch: `sgs-035-aoe4-engine-common-dup-check`
- Tip verified: `b52e9f5b1e8cc82039c8ee3392f62c7ee9b863e5` ("Share the Resources type from engine-common")
- Base: `origin/main` f078c11
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-035` (detached, removed after this report)
- Node: v24.22.2, npm 11.19.1 (`source ~/.nvm/nvm.sh; nvm use 24`)

## Verdict: PASS (all four commands exit 0)

| Command | Result | Log |
|---|---|---|
| `npm ci` (setup) | exit 0, 0 vulnerabilities | `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-035.npmci.log` |
| `npm test` (REPO.md `commands.unit`) | exit 0. Test Files 29 passed (29); Tests 704 passed (704) | `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-035.unit.log` |
| `npx tsc --noEmit` | exit 0, no errors | `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-035.tsc.log` |
| `npm run lint:dup` (jscpd) | exit 0. Clones found 0; duplicated lines 0 (0%) across 49 files | `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-035.lintdup.log` |
| `npx next build` | exit 0. Compiled successfully; 6 static pages generated; routes include `/api/fight` and `/api/aoe4-build-order/simulate` | `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-035.build.log` |

- `npm run lint:dup` is not in REPO.md `commands`; it was run because the requester asked for it.
- `commands.acceptanceSetup` was not run. The unit suite (Vitest) passed without Chromium. `commands.codegen` is empty, so it was not run.
- `commands.acceptance` (Playwright) was not run; it is outside this suite's scope.

## Failures

None.

## Post-run tree check

`git status --porcelain` in the worktree is empty. The only artifacts are gitignored build outputs (`.next/`, `next-env.d.ts`, `tsconfig.tsbuildinfo`) and `node_modules/`. Nothing to commit. No codegen ran.

## Environment

- Runtime matches the declared version. `package.json` `engines.node` is `24.x`; installed is v24.22.2. No `.nvmrc`, `.node-version`, `.python-version`, or `.tool-versions` exists.
- Worktree path note: `worktrees/suite-batch-M3-w1` already existed as a registered worktree of another agent (detached at 0dd2411, created 19:33). It was not touched. This run used `worktrees/suite-SGS-035` instead.

## Processes

No dev server, preview, or browser was started. `next build` ran to completion in the foreground.
