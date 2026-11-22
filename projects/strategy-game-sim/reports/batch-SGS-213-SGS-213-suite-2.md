# CI-parity suite: SGS-213 (standalone)

Verdict: PASS

- Scratch: `suite-SGS-213-SGS-213` at `6f9b91f02772ee301b6db84dc8c3299b90b2ce28` (top branch `sgs-213-step-popover-beside-text`, base `main`).
- Unit command: `npm test` (`commands.unit`, Vitest `vitest run`), full suite.
- Summary line: `Test Files  95 passed | 1 skipped (96)`, `Tests  3116 passed | 15 skipped (3131)`. Exit 0. No failures in the log.
- Log: `${TMPDIR}/suite-SGS-213-SGS-213/suite-SGS-213-SGS-213.unit.log` (outside the checkout).
- Branch SHA: `6f9b91f02772ee301b6db84dc8c3299b90b2ce28`.
- Post-run `git status --porcelain`: empty (clean tree). No codegen configured.

## Setup

- `commands.acceptanceSetup` was not run. The unit suite needs only node_modules, so I ran the `link-node-modules.sh .` step of it through run.sh, and not the Chromium setup (`npm run acceptance:setup`).
- `commands.build` and `commands.lint` were not run; this gate covers unit only.

## Environment

- Declared: Node `24.x` (`engines` in `package.json`; `.nvmrc` not present).
- Installed through run.sh (`commands.shellSetup`): Node v24.22.2, npm 11.19.1. Matches the declared version; no mismatch.

## Failures

None.

## Scratch cleanup

Removing the scratch with `checkout.sh remove` after this report is written (see the result in the final hand-off).
