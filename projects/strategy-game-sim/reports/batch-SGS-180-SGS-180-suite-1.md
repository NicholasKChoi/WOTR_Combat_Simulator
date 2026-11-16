# Suite report: batch SGS-180-SGS-180 (suite-1)

## Verdict: PASS

- Command: `npm test` (`commands.unit`, Vitest `vitest run`), run in the scratch checkout through `run.sh`.
- Summary line: `Test Files  84 passed | 1 skipped (85)`, `Tests  2623 passed | 15 skipped (2638)`, exit 0.
- Branch: `sgs-180-split-layout-specs-to-desktop-viewports`
- Branch SHA tested: `f4d0c1b1db92b14d0d4d3453600217aaefad7e25`
- Log: `/tmp/claude-1000/suite-SGS-180-SGS-180/suite-SGS-180-SGS-180.unit.log`
- Scratch tree after the run: `git status --porcelain` empty (clean). No codegen configured (`commands.codegen` is empty), so no codegen step ran.

## Steps

1. Scratch checkout `suite-SGS-180-SGS-180` created at `f4d0c1b1db92b14d0d4d3453600217aaefad7e25` with the top branch listed. HEAD matches the SHA.
2. Runtime check: `node --version` through `run.sh` gives `v24.22.2`. Declared `engines.node` is `24.x` (`package.json`). No `.nvmrc` present. Match.
3. Setup: `node_modules` linked through `bin/link-node-modules.sh` (cache `nm-cache/d57d0fdd0e531d4b`). `commands.acceptanceSetup` was not run: it installs Chromium for Playwright, and the unit suite does not use it.
4. Unit: full `commands.unit` run, no subset.
5. Post-run `git status --porcelain`: clean.

## Failures

None.

## Environment

- Node `v24.22.2` matches the declared `24.x`. No mismatch.
- The 1 skipped test file and 15 skipped tests are reported by Vitest as skipped, not failed. Not investigated; they are not failures in this run.

## Cleanup

Scratch checkout removed with `checkout.sh remove` (exit 0).
