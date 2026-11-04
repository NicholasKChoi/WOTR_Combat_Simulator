# SGS-089 CI-parity suite run 1

## Verdict: PASS

- Branch: sgs-089-aoe4-engine-guard-crashes-hangs
- Tip SHA: 308d8f958a042a4a631ab8c2c4ca3ec95a266110 (verified against the local branch; based on origin/main fcfbaf1)
- Worktree: detached at 308d8f9, created under `$FACTORY_DIR/worktrees/suite-SGS-089`, removed with `git worktree remove --force`, then `git worktree prune`. Confirmed absent from `git worktree list`.
- Command: `npm test` (REPO.md `commands.unit`, runs `vitest run`), exit 0.
- Log: `/tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/fe37a078-0455-4b3a-a6fa-5c6b2dc1f4c4/scratchpad/suite-SGS-089-unit.log`
- Summary line: `Test Files  47 passed (47)`, `Tests  1378 passed | 10 skipped (1388)`.
- Skipped tests: the 10 skips are conditional `it.runIf(build.name.includes(...))` cases in `lib/aoe4-build-order/builds.test.ts` (lines 52, 106, 116, 128, 142 seen), so they are data-driven per-build selections, not disabled tests. Not counted individually; no failures.
- Tree after run: `git status --porcelain` empty. No codegen configured (`commands.codegen` empty), so no codegen tree check applied beyond this.

## Commands not run

- `commands.build` and `commands.lint` were not run: `commands.unit` is set, so they are not needed for the verdict.
- `commands.acceptance` / `acceptanceSetup` Chromium install was not run: the unit suite does not need it. Only `npm ci` was run to install dependencies.

## Failures

None.

## Environment

- Node: installed v24.22.2, declared `engines.node` = `24.x`. Match. No `.nvmrc`, `.node-version`, or `.tool-versions` in the repo.
- npm: 11.19.1.
- `npm ci` completed (exit 0, 0 vulnerabilities reported). No install issues.
- No runtime mismatch to report.

## Blockers

None.
