# Batch M5-w1 CI-parity suite gate (SGS-078, SGS-079)

## Verdict: PASS (SGS-078 branch at b6daa13)

- Command: `npm test` (REPO.md `commands.unit`, runs `vitest run`), run in a detached worktree at b6daa13.
- Summary line: `Test Files  44 passed (44)`, `Tests  1318 passed | 10 skipped (1328)`, exit 0.
- Log: `/tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/b25bc1b3-ed97-4df0-9eb2-fb70937f3290/scratchpad/suite-b6daa13.log`
- Failures: none.
- Skipped 10: all are `it.runIf(build.name.includes(...))` guards in `lib/aoe4-build-order/builds.test.ts` (lines 51, 87, 97, 109, 123). By design, per build, and that file is unchanged between ee7ecb9 and b6daa13.
- `git status --porcelain` after the run: clean (no codegen, no dirty tree).
- Scope of b6daa13 vs main ee7ecb9: 14 files, +235 / -56.

## SGS-079 (branch sgs-079-aoe4-prebuilt-docs-no-measured-results @ 7e6a085)

- Not run. The only change vs main is `data/aoe4-build-order/README.md` (16 insertions, 17 deletions).
- Grep for readers: no code, test, or config reads that README. The only reference is a prose pointer in `docs/aoe4-build-order.md:133` ("listed in `data/aoe4-build-order/README.md` under Known data gaps"). Under the rule in the brief, no run on 7e6a085 is needed.

## Environment

- Runtime mismatch (does not stop the run): installed Node `v22.17.0`, npm `10.9.2`. Declared in `package.json` `engines.node` = `24.x`. The repo has no `.nvmrc`, `.node-version`, or `.tool-versions`.
  - Install command to match: `nvm install 24 && nvm use 24`, then `npm ci` in the worktree.
  - Vitest passed on Node 22, so this does not change the verdict. A CI rerun on Node 24 is still advisable, since CI uses 24.x.
- `npm ci` completed with exit 0 (0 vulnerabilities).
- `commands.acceptanceSetup` was not run. It is Playwright/Chromium setup for the acceptance suite, which is outside `commands.unit`.
- `commands.codegen` is empty; nothing run.
- `commands.build`/`lint` not run; `commands.unit` is set, so the fallback does not apply.

## Cleanup

- Worktree `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-batch-M5-w1` removed with `git worktree remove --force`, followed by `git worktree prune`.
