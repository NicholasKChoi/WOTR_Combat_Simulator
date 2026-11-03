# batch-M5-w3 suite report (run 1)

Task in batch: SGS-077 (branch `sgs-077-aoe4-gathered-resources-chart`).
Tested commit: e9a428dfce3fb56d08e3b28f0257fffa3c34b8f4 (`Add acceptance specs for the gathered resources series and chart`).
Base: origin/main ae2d45f.

## Verdict: PASS

- Command: `npm test` (REPO.md `commands.unit`, runs `vitest run`), run from a detached worktree at e9a428d.
- Summary line: `Test Files  44 passed (44)`, `Tests  1322 passed | 10 skipped (1332)`, exit 0.
- The 10 skipped are `it.runIf(...)` cases in `lib/aoe4-build-order/builds.test.ts`, gated per build name (for example the 1TC and King builds). They are by design, not `.skip` calls.
- `commands.acceptanceSetup` was not run: the unit suite (Vitest, `include` limited to utils/lib/components) does not use Chromium. `commands.codegen` is empty.
- `commands.build` and `commands.lint` were not run; `commands.unit` is set.
- `git status --porcelain` after the run: clean (no output).

## Failures

None.

## Environment

- Node: installed v24.22.2 (via `nvm use 24`). Declared: `engines.node` = `24.x` in package.json, REPO.md acceptance note says Node 24.x. Match, no mismatch.
- Install: `npm ci` (exit 0, 0 vulnerabilities).
- Vitest v5.0.5.
- No runtime version mismatch.

## Cleanup

Worktree `worktrees/suite-M5-w3` removed with `git worktree remove --force` and `git worktree prune` (run after this report was written). Logs `worktrees/suite-M5-w3.ci.log` and `worktrees/suite-M5-w3.unit.log` removed with it.
