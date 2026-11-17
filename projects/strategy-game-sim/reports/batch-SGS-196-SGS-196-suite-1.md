# CI-parity suite: batch SGS-196

**Verdict: PASS**

- Branch: `sgs-196-chart-window-math` (base `main`)
- Tested SHA: `7364631ff491489f3e01599afac930da4da88606`
- Scratch checkout: `suite-SGS-196`, created at the SHA, clean tree after the run (`git status --porcelain` empty).
- Command: `npm test` (from `commands.unit`), run through `run.sh`.
- Summary line: `Test Files  85 passed | 1 skipped (86)`, `Tests  2663 passed | 15 skipped (2678)`, exit 0.
- Log: `/tmp/claude-1000/suite-SGS-196/suite-SGS-196.unit.log` (outside the checkout).
- `commands.codegen` is empty, so it did not run. The full command was the verdict; no touched-package subset was run.
- `commands.acceptanceSetup` ran first (`link-node-modules.sh` plus `npm run acceptance:setup`, which installs Chromium). It succeeded.

## Failures

None.

## Environment

- Installed Node: v24.22.2 (via `run.sh`, after `commands.shellSetup`).
- Declared: `engines.node` = `24.x` in `package.json`. No `.nvmrc`, `.node-version`, or `.tool-versions` in the repo. Match, no mismatch.
- Install used: `link-node-modules.sh` (hardlinked node_modules from the lockfile-hash cache).

## Cleanup

- Scratch checkout removal: see the `checkout.sh remove` result recorded in the run log for this batch.
