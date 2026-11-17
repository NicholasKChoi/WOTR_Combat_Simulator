# Suite report: batch SGS-189 (CI-parity unit suite)

## Verdict: PASS

- Branch: `sgs-189-reorder-builds` (base `main`)
- Tested SHA: `b17652dd8bef709f3a6e7d049ff6b50ee28b629d`
- Command: `commands.unit` = `npm test` (Vitest, `vitest run`), run through `run.sh` with `shellSetup` loaded
- Scratch checkout: `suite-SGS-189` (removed after this report)
- Log: `/tmp/claude-1000/suite-SGS-189/suite-SGS-189.unit.log`
- Summary line: `Test Files  83 passed | 1 skipped (84)`, `Tests  2613 passed | 15 skipped (2628)`, 0 failed

`commands.acceptanceSetup` was not run, since the unit suite is Vitest only and does not need Playwright.
`commands.codegen` is empty, so it was skipped.

## Tree state

`git status --porcelain` in the scratch checkout after the run is empty. The tree is clean and HEAD is still `b17652dd`.

## Failures

None.

## Environment

- Installed Node: v24.22.2 (npm 11.19.1), loaded through `commands.shellSetup` (`nvm use 24`).
- Declared: `package.json` `engines.node` = `24.x`. No `.nvmrc`, `.node-version`, `.python-version`, or `.tool-versions` in the repo.
- Result: match, no mismatch.
- The one skipped test file and 15 skipped tests were not investigated; the run reports them as skipped, not failed.
