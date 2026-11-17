# CI-parity suite: batch SGS-191

Verdict: **PASS**

- Task branch: `sgs-191-unit-line-data` (base `main`)
- Tested SHA: `3e13a62dd9ec953e22b4a4dfcbfb862a89396e14`
- Scratch checkout: `suite-SGS-191` (removed after this report)
- Command: `commands.unit` = `npm test` (Vitest, `vitest run`), run in full
- Log: `/tmp/claude-1000/suite-SGS-191/suite-SGS-191.unit.log` (outside the checkout)

Summary line:

```
Test Files  84 passed | 1 skipped (85)
Tests       2627 passed | 15 skipped (2642)
```

No failures, so no classification was needed.

## Setup

- `commands.acceptanceSetup` was not run in full. Its Chromium install (`npm run acceptance:setup`) is for Playwright and the unit suite does not use it. I ran only its first step, `link-node-modules.sh .` (through `run.sh`), which linked the cached `node_modules` (`nm-cache/d57d0fdd0e531d4b`). `commands.codegen` is empty, so it was not run.
- `git status --porcelain` after the run: clean (no output). Nothing was committed.

## Environment

- Installed Node: v24.22.2 (through `run.sh`, after `commands.shellSetup`).
- Declared: `engines.node` = `24.x` in `package.json`; `.nvmrc` matches (`24`). No mismatch.
- No other runtime version files are declared for this repo.
