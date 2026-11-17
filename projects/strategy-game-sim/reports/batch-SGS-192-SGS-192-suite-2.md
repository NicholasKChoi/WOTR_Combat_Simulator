# Suite report: batch SGS-192-SGS-192

Verdict: PASS

Top-of-stack SHA: d30e22c409d1cdfccec78bad4a51dce075843065 (branch sgs-192-wait-details, base origin/main 22c47e0)

## Command

- `commands.unit` (`npm test`, which runs `vitest run`), run in the scratch checkout `suite-SGS-192-SGS-192` through `run.sh`.
- Log: `$TMPDIR/suite-SGS-192-SGS-192/suite-SGS-192-SGS-192.unit.log` (`/tmp/claude-1000/suite-SGS-192-SGS-192/suite-SGS-192-SGS-192.unit.log`)
- Summary line: `Test Files  90 passed | 1 skipped (91)`, `Tests  2817 passed | 15 skipped (2832)`, exit 0.
- Full command run, not a touched-package subset.

## Setup

- Ran `commands.acceptanceSetup` (`link-node-modules.sh` plus `npm run acceptance:setup`) before the unit run, since the checkout had no `node_modules`. It completed without error. No acceptance tests were run.
- `git status --porcelain` after the unit run: empty (clean tree). No codegen is configured (`codegen: ""`), so nothing else was generated.

## Environment

- Declared runtime: Node `24.x` (`engines.node` in `package.json`; the `shellSetup` loads nvm and `nvm use 24`).
- Installed: Node v24.22.2, npm 11.19.1. Matches the declared version; no mismatch.

## Failures

None.

## Cleanup

- Scratch checkout removal is in the next step: `checkout.sh remove` on `suite-SGS-192-SGS-192`.
- No processes were started that remain running.
