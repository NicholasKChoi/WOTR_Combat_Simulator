# Suite gate: batch SGS-209 (SGS-209), suite-2

Verdict: PASS

- Branch: sgs-209-rename-api-patch-named-builds
- Top-of-stack SHA: 3f948d434df1ebf513bb05dcdaa5694acb1c2c42
- Base: main
- Scratch checkout: suite-SGS-209-SGS-209 (created at the SHA above, removed at the end of the run)

## Commands run

1. `commands.acceptanceSetup` (`link-node-modules.sh . && npm run acceptance:setup`): exit 0. node_modules linked from the nm-cache; Chromium installed.
2. `commands.codegen`: empty in REPO.md, not run.
3. `commands.unit` (`npm test`, vitest run): exit 0, full suite (not a subset).
   - Summary: Test Files 91 passed | 1 skipped (92); Tests 2932 passed | 15 skipped (2947). No failures.
   - Log: `$TMPDIR/suite-SGS-209-SGS-209/suite-SGS-209-SGS-209.unit.log` (outside the scratch checkout and worktreeRoot).
4. `git status --porcelain` after the run: empty. Tree clean.

## Failures

None.

## Environment

- Node: installed v24.22.2 (via `commands.shellSetup`). Declared `engines.node` is `24.x` in package.json. Match, no mismatch.
- Skipped tests (1 file, 15 tests) are pre-existing skips; they did not fail the run.

## Cleanup

Scratch removal is run after this report is written.
