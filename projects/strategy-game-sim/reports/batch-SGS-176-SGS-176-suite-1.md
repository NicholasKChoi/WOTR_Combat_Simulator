# Suite report: batch SGS-176-SGS-176 (suite-1)

## PASS

- Command: `npm test` (REPO.md `commands.unit`, Vitest `vitest run`), run through `run.sh` in the scratch checkout.
- Summary line: `Test Files  84 passed | 1 skipped (85)`, `Tests  2609 passed | 15 skipped (2624)`. No failures.
- Branch: `sgs-176-lib-export-doc-comments`, top-of-stack SHA `8484866049756b092a3e56f1083e23d229af52cd`.
- Full log: `/tmp/claude-1000/suite-SGS-176-SGS-176/suite-SGS-176-SGS-176.unit.log`.
- Tree after the run: `git status --porcelain` is empty (clean).

## Environment

- Runtime: Node `v24.22.2`, npm `11.19.1` (via `commands.shellSetup`). Declared `engines.node` is `24.x`, so it matches. No mismatch.
- `node_modules` was absent in the scratch checkout. It was linked from the cached install with `bin/link-node-modules.sh` (the first half of `commands.acceptanceSetup`). The Playwright `acceptance:setup` step (Chromium install) was not run, since the unit suite does not use it.
- Vitest reports `v5.0.5`.

## FAIL

None.

## BLOCKER

None.

## Cleanup

- Scratch checkout: `checkout.sh remove` is run after this report is written (result reported in the manager summary).
- No processes were started by this run.
