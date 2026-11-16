# Suite report: batch SGS-178 (suite-1)

Verdict: **PASS**

- Task: SGS-178, branch `sgs-178-remove-unreferenced-named-build-version`, base `main`
- Branch tip SHA: `5188c080ff5c47a711e5bc54e86197cd221f266b`
- Scratch checkout: `suite-SGS-178` at the tip SHA (top branch listed so the SHA resolved)
- Command: `commands.unit` = `npm test` (`vitest run`), run in full through `run.sh`
- Log: `/tmp/claude-1000/suite-SGS-178-SGS-178/suite-SGS-178-SGS-178.unit.log`
- Summary line: `Test Files  84 passed | 1 skipped (85)`, `Tests  2616 passed | 15 skipped (2631)`
- Failures: none

## Tree state

`git status --porcelain` after the run is empty. The tree is clean after the run, so there is no codegen-dirty tree to report. `commands.codegen` is empty in REPO.md, so codegen did not run.

## Setup

- `commands.acceptanceSetup` was not run in full. Its `npm run acceptance:setup` step installs Playwright Chromium, which the vitest unit suite does not need. The `link-node-modules.sh .` part of it was run through `run.sh` so `node_modules` was available (linked from the factory nm-cache, key `d57d0fdd0e531d4b`).
- `commands.build` and `commands.lint` were not run; `commands.unit` is set, so they were not required.

## Environment

- Declared runtime: `engines.node` = `24.x` in `package.json`. REPO.md `shellSetup` is `source ~/.nvm/nvm.sh && nvm use 24`. No `.nvmrc`, `.node-version`, or `.tool-versions` exists.
- Installed through `run.sh`: node `v24.22.2`, npm `11.19.1`. This matches the declared 24.x, so there is no version mismatch.
- The one skipped test file and 15 skipped tests are reported by vitest as skipped. They were not run and were not investigated, since they do not fail the suite.

## Scratch removal

The scratch checkout `suite-SGS-178` is removed after this report is written.
