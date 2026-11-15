# Suite report: batch SGS-165-SGS-165 (suite-1)

## Verdict: PASS

- Command run: `npm test` (REPO.md `commands.unit`), run through `run.sh`, full suite, no touched-package shortcut.
- Summary line: `Test Files  84 passed | 1 skipped (85)`, `Tests  2609 passed | 15 skipped (2624)`. Exit clean.
- Branch: `sgs-165-doc-pinned-color-wraps`
- Tip SHA tested: `8330189f3c6e53432a3870325898859bfc154771`
- Change under test: docs only (`docs/aoe4-build-order.md`, 2 insertions, 1 deletion).
- Log: `/tmp/claude-1000/sgs-165-unit.log`
- `acceptanceSetup` and `codegen`: not run. Unit suite does not need them, and REPO.md `codegen` is empty.
- Git status after the run: clean (no untracked or modified files).

## Environment

- Declared runtime: `engines.node` in `package.json` is `24.x`. No `.nvmrc`, `.node-version`, `.python-version`, or `.tool-versions` present.
- Installed (via `run.sh`, which loads `commands.shellSetup`): Node v24.22.2, npm 11.19.1. Matches the declared version. No mismatch.

## Failures

None.

## Scratch cleanup

Removal of `suite-SGS-165-SGS-165` is issued after this report is written. Result is noted in the handback.
