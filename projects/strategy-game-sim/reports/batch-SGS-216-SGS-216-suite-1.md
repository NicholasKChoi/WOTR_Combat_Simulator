# CI-parity suite report: batch-SGS-216-SGS-216 (suite-1)

**Verdict: PASS**

- Branch: `sgs-216-population-chart-cap-mark`
- Top-of-stack SHA: `29973d953fadc13837bbe89f906160c75852d017`
- Base: `main`
- Scratch checkout: `suite-SGS-216-SGS-216` (created at the SHA above, removed after this report)

## Commands run

1. `checkout.sh scratch` at the top SHA with the top branch listed. Succeeded. `HEAD` matches the SHA.
2. `commands.codegen`: empty, not run.
3. `commands.acceptanceSetup`: not run. The unit suite is Vitest and does not depend on the Playwright harness.
4. `commands.unit` (`npm test`, run through `run.sh`), exit 0. Log: `/tmp/claude-1000/suite-SGS-216-SGS-216/suite-SGS-216-SGS-216.unit.log`
   - Test Files: 95 passed, 1 skipped (96)
   - Tests: 3148 passed, 15 skipped (3163)
   - Duration: 6.93 s
5. `git status --porcelain` after the run: empty, the tree is clean.

Dependencies were installed in the scratch with `bin/link-node-modules.sh .`, run through `run.sh`.

## Failures

None.

## Environment

- Declared runtime: Node `24.x` (`engines.node` in `package.json`; `commands.shellSetup` is `nvm use 24`).
- Installed runtime through `run.sh`: Node `v24.22.2`. Matches the declared range, no mismatch.
- Skipped in the run: 1 test file and 15 tests were skipped by the suite itself. This is the suite's own skip markers, not a failure, and was not investigated further.
