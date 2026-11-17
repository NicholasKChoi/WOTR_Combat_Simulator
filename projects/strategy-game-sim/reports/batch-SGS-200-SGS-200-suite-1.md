# Suite report: batch SGS-200-SGS-200 (suite-1)

## Verdict: PASS

- Command: `npm test` (`commands.unit`, Vitest `vitest run`), run through run.sh.
- Summary line: `Test Files  91 passed | 1 skipped (92)`, `Tests  2856 passed | 15 skipped (2871)`. Exit 0.
- Branch: `sgs-200-m11-docs`
- Branch SHA tested: `bb27bc2a4930c788bf3c8c8d9fd7068f905a1ed2` (base `main` 74984be)
- Log: `$TMPDIR/suite-SGS-200-SGS-200/suite-SGS-200-SGS-200.unit.log` (`/tmp/claude-1000/suite-SGS-200-SGS-200/suite-SGS-200-SGS-200.unit.log`)

## Steps

1. Scratch checkout created with `checkout.sh scratch` at `bb27bc2a4930c788bf3c8c8d9fd7068f905a1ed2`, top branch `sgs-200-m11-docs` listed. Exit 0.
2. Runtime check: `node -v` reports v24.22.2, npm 11.19.1. Declared `engines.node` is `24.x` in `package.json`. No `.nvmrc`, `.node-version`, or `.tool-versions` in the repo. Match.
3. Setup: `commands.acceptanceSetup` was not run in full. The unit suite needs only the dependencies, so I ran the dependency-linking step of it (`bin/link-node-modules.sh .`), which exited 0. The Playwright Chromium install step was skipped because unit tests do not use it. `commands.codegen` is empty, so no codegen step.
4. `npm test` run in full, output teed to the log above. Passed.
5. `git status --porcelain` after the run: empty. Tree clean.

## Failures

None.

## Environment

- Node v24.22.2 installed, `engines` declares `24.x`. No mismatch.
- Dependencies were linked from the cached `node_modules` (`nm-cache/d57d0fdd0e531d4b`), not installed fresh.
- Scratch checkout removal is recorded in the run output below.
