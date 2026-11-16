# Suite report: batch SGS-185-SGS-185 (run 1)

Verdict: **PASS**

- Branch: `sgs-185-docs-desktop-only-page` (base `main`)
- Tip SHA tested: `c009c66dd0469fe5fba5b3584bfc986df9b0298f`
- Scratch checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-185-SGS-185` (removed after this report)
- Unit command: `npm test` (from `commands.unit`), run through run.sh
- Log: `/tmp/claude-1000/suite-SGS-185-SGS-185/suite-SGS-185-SGS-185.unit.log`
- Summary line: `Test Files  83 passed | 1 skipped (84)`, `Tests  2613 passed | 15 skipped (2628)`, exit 0

## Skipped tests

The one skipped file is `lib/aoe4-build-order/blob-build-store.live.test.ts`. It is gated on `BLOB_LIVE=1` and is skipped by design in the unit run. Its 15 skipped tests are not failures.

## Tree state

`git status --porcelain` after the run: empty. `node_modules` (linked from the nm-cache by `bin/link-node-modules.sh`) does not appear as untracked, so the tree is clean.

## Environment

- Runtime: Node `v24.22.2`, npm `11.19.1`, checked through run.sh (`commands.shellSetup`). Declared `engines.node` is `24.x`, so it matches. No mismatch.
- Setup: ran only the `link-node-modules.sh` step of `commands.acceptanceSetup`. The Chromium install (`npm run acceptance:setup`) was not run, since the unit suite does not need it.
- `commands.codegen` is empty, so no codegen step ran.
- `commands.lint` and `commands.build` were not run; the verdict covers `commands.unit` only, as instructed.

## Failures

None.
