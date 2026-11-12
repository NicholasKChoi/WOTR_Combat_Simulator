# Suite report: batch-SGS-127-SGS-129, suite-1

## Verdict: PASS

Branch `sgs-129-strict-typescript`, tip `75fa929f996b8b4559b725435ed7b03766eaf836`
(stack: `sgs-127-blob-strong-etag` 8691f1e > `sgs-128-shared-test-helpers-and-jscpd-gates` 9bbe59d > `sgs-129-strict-typescript` 75fa929).

- Command: `npm test` (REPO.md `commands.unit`, runs `vitest run`), run through `run.sh` in a detached worktree at 75fa929.
- Summary line: `Test Files  74 passed (74)`, `Tests  2360 passed | 13 skipped (2373)`. Exit code 0.
- Full log: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/reports/batch-SGS-127-SGS-129-suite-1.unit.log`
- Skipped tests: 13. Not investigated further; no `it.skip`, `test.skip`, `describe.skip`, or `.todo(` literals exist in `*.ts`, `*.tsx`, `*.js` under the worktree, so the skips come from conditional or parametrized skips.

## Environment

- Runtime: Node `v24.22.2`, npm `11.19.1` via `run.sh` (loads `commands.shellSetup`). Declared: `engines.node` = `24.x` in `package.json`. No `.nvmrc`, `.node-version`, or `.tool-versions` present. Match, no mismatch.
- Dependencies: `link-node-modules.sh .` (the node_modules step of `commands.acceptanceSetup`) linked `nm-cache/d57d0fdd0e531d4b`. I ran only this step, not the Chromium install (`npm run acceptance:setup`), because the unit suite does not use Playwright.
- `commands.codegen` is empty; not run.
- Touched-package pre-run skipped; the verdict is from the full `npm test`.
- Post-run `git status --porcelain` in the worktree: clean (empty). No codegen, so no generated-file drift.

## Failures

None.

## Blockers

None.

## Out-of-scope observations

- None.
