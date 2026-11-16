# Suite report: batch SGS-184-SGS-184

Verdict: **PASS**

- Branch: sgs-184-one-desktop-layout-width-floor (base main)
- Top-of-stack SHA: 517ede8773e87f5e96ac3825d558cf1071669543
- Scratch checkout: suite-SGS-184-SGS-184, at the SHA above (verified before the run)

## Commands run

1. `commands.acceptanceSetup` (`link-node-modules.sh .` then `npm run acceptance:setup`): exit 0. node_modules linked from the nm-cache, Chromium installed. Log: `/tmp/claude-1000/suite-SGS-184-SGS-184/acceptance-setup.log`.
2. `commands.codegen`: empty in REPO.md, not run.
3. `commands.unit` (`npm test`, via run.sh, teed to the scratchpad log): exit 0.
   Log: `/tmp/claude-1000/suite-SGS-184-SGS-184/suite-SGS-184-SGS-184.unit.log`

Summary line from the full run:
- Test Files: 83 passed, 1 skipped (84)
- Tests: 2613 passed, 15 skipped (2628)

The skipped file and tests are existing skips reported by Vitest. None failed.

## Working tree

`git status --porcelain` after the run: empty. The tree is clean.

## Failures

None.

## Environment

- Node: installed v24.22.2 (npm 11.19.1). Declared `engines.node` is `24.x` in package.json, which matches. No mismatch.
- node_modules was absent in the fresh scratch checkout, so acceptanceSetup linked it from the hardlinked cache before the unit run.
- Scratchpad: no scratchpad directory was given in the environment, so `$TMPDIR` (`/tmp/claude-1000`) was used with a `suite-SGS-184-SGS-184` subdirectory.

## Cleanup

Scratch checkout removal: see the `checkout.sh remove` result reported with this run.
