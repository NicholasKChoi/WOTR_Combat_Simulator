# Suite gate: batch SGS-153 (suite 1)

Verdict: **PASS** (unit and lint). The ticket's Playwright criterion (`npx playwright test acceptance/smoke-preview.spec.ts`) was not run by this gate; see Not run.

## Input

- Branch: `sgs-153-smoke-script-hardening`, tip `93f6cf5` (base `41b3ed3`).
- Run on the branch rebased onto `origin/main` `5371c25`, in detached worktree `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-153`.
- Rebase result: clean, no conflicts. Two commits replayed:
  - `93d78dc` Harden the preview smoke script against redirects and stray errors
  - `3eff50d` Doc: state which smoke requests fail on a redirect (SHA after rebase; the branch tip `93f6cf5` is the pre-rebase SHA)
- Post-rebase HEAD: `3eff50d239f89aacc4ad2d7a037f4952d6aaeaf4`.
- Diff vs `origin/main`: `acceptance/smoke-preview.spec.ts`, `docs/aoe4-build-order.md`, `scripts/smoke-preview.mjs` (3 files, +204 / -44).

## Results

- `commands.unit` (`npm test`, full command, exit 0): `Test Files 82 passed | 1 skipped (83)`, `Tests 2539 passed | 15 skipped (2554)`. Log: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/reports/batch-SGS-153-SGS-153-suite-1.unit.log`
- `commands.lint` (`npx tsc --noEmit && npm run lint:dup`, exit 0): tsc clean; jscpd `Found 0 clones` (typescript, 156 files). Log: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/reports/batch-SGS-153-SGS-153-suite-1.lint.log`
- `commands.codegen`: not set.
- `git status --porcelain` after the runs: empty (clean tree).

## Not run

- `npx playwright test acceptance/smoke-preview.spec.ts` (ticket criterion). The suite gate does not run `commands.acceptance`, so the redirect rows and the signal/secret tests have not been executed here. Vitest excludes `acceptance/**`, so the unit verdict does not cover them. The acceptance-test or manager should run this spec.
- `commands.acceptanceSetup` was not run. The unit suite does not need Chromium, and `link-node-modules.sh` (the first step of acceptanceSetup) was run to provide node_modules.

## Environment

- Declared: `package.json` `engines.node` = `24.x`; no `.nvmrc` or `.node-version`.
- Installed (via run.sh, `commands.shellSetup`): Node `v24.22.2`, npm `11.19.1`. Matches the declared range; no mismatch.
- node_modules: linked from the hardlink cache with `bash /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/bin/link-node-modules.sh .`.

## Failures

None.

## Cleanup

- Worktree removal and prune: see the manager-facing summary (run after this report is written).
