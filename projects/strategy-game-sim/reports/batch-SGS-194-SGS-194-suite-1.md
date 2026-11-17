# Suite report: batch SGS-194

Verdict: PASS

- Branch: sgs-194-results-charts-table (base main)
- SHA: 4dc3bd8a899aede40b41fd95e543b560895260fe
- Scratch checkout: suite-SGS-194 (created with checkout.sh scratch, removed at the end of the run)
- Command: `npm test` (REPO.md commands.unit), run through run.sh
- Log: /tmp/claude-1000/suite-SGS-194/suite-SGS-194.unit.log
- Summary line: `Test Files  83 passed | 1 skipped (84)`, `Tests  2614 passed | 15 skipped (2629)`, exit 0
- Tree after the run: `git status --porcelain` empty (no dirty tree after codegen; codegen is unset)

Setup steps:
- `commands.acceptanceSetup` ran (`link-node-modules.sh .` plus `npm run acceptance:setup`) to provide node_modules for the unit run. It exited without error output.
- `commands.codegen` is empty, so it was skipped.

## Environment

- Runtime: Node v24.22.2, npm 11.19.1 (through run.sh, so commands.shellSetup loaded).
- Declared: `engines.node` is `24.x` in package.json. No `.nvmrc`, `.node-version`, or `.tool-versions` file exists. Installed and declared versions match.

## Notes

- The skipped file and the 15 skipped tests are reported by vitest as skipped, not failed. This run did not check whether those skips are intentional.

## Failures

None.
