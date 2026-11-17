# Suite report: batch SGS-195-SGS-195 (suite-1)

## Verdict: PASS

- Branch: `sgs-195-marker-control`
- Tip SHA: `9bc74f960ab74f7b7a1bbd3d77dbd541dae1ee7c` (checked out in scratch `suite-SGS-195-SGS-195`, from the top-of-stack SHA as named)
- Command: `npm test` (commands.unit, Vitest `vitest run`), run through `run.sh`
- Summary line: `Test Files  88 passed | 1 skipped (89)`; `Tests  2733 passed | 15 skipped (2748)`
- Log: `/tmp/claude-1000/suite-SGS-195-SGS-195/suite-SGS-195-SGS-195.unit.log`
- Full unit suite run, not a subset.
- Failures: none. Blockers: none.

## Setup

- `commands.acceptanceSetup` run first (the unit suite needs `node_modules`, which was absent in the fresh scratch): `link-node-modules.sh .` linked `node_modules` from the lockfile cache, then `npm run acceptance:setup` (Playwright Chromium install). Exit 0.
- `commands.codegen` is empty; skipped.
- `commands.lint` and `commands.build` were not run; they are not part of the requested verdict.

## Tree check

- `git status --porcelain` after the suite: clean (no output). No dirty tree.

## Environment

- Declared runtime: Node `24.x` (`package.json` `engines.node`; `.nvmrc`, `.node-version`, `.tool-versions` absent). No Python/Go runtime files.
- Installed (through `run.sh`, so `commands.shellSetup` loaded): Node `v24.22.2`, npm `11.19.1`. Matches the declared range; no mismatch.
- Vitest reports `v5.0.5`.
- Skipped tests: 1 test file and 15 tests are skipped by the suite itself. The run does not fail on them; noted for awareness only.

## Process hygiene

- No dev server, preview, or browser process was started by this suite. Nothing left listening.
