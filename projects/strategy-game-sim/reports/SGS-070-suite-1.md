# SGS-070 suite-1: CI-parity gate

- Branch: sgs-070-aoe4-chart-legends-markers
- Tip SHA: f14c78961827eae93eb825888c48434518ccd61c
- Base: origin/main 54d7e90eeb2828fd5a09824107c1c80b35625871 (ancestor of tip)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/suite-SGS-070 (removed after run)
- Node: v24.22.2 (npm 11.19.1), via nvm 24

## Verdict: PASS

| Step | Command | Result |
|------|---------|--------|
| Install | `npm ci` | exit 0 |
| Acceptance setup | `npm run acceptance:setup` | exit 0 |
| Unit (CI-parity) | `npm test` (vitest run) | exit 0. Test Files 40 passed (40); Tests 1086 passed, 8 skipped (1094). Log: /tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/d25428ed-0c81-4238-ac7f-4830d6e9a031/scratchpad/unit.log |
| Lint: typecheck | `npx tsc --noEmit` | exit 0 |
| Lint: duplication | `npm run lint:dup` (jscpd) | exit 0. Found 0 clones. Log: /tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/d25428ed-0c81-4238-ac7f-4830d6e9a031/scratchpad/lint-dup.log |
| Acceptance (full) | `ACCEPTANCE_PORT=3795 npm run acceptance` | exit 0. 552 passed, 0 failed, 0 flaky retries. Log: /tmp/claude-1000/-home-choin-git-WOTR-Combat-Simulator/d25428ed-0c81-4238-ac7f-4830d6e9a031/scratchpad/acceptance-full.log |

- The pin-compare "a failed run after a successful one removes the charts" test (aoe4-build-order.spec.ts:123) passed on the first run. The --repeat-each=3 rerun was not needed.
- No ticket ids or Playwright retries were reported in the acceptance log.

## Failures

None.

## Environment

- Runtime matches the declared `engines.node` 24.x. No mismatch.
- Tree after the run: `git status --porcelain` is empty. No codegen (`commands.codegen` is empty).
- Vitest reports 8 skipped tests. A grep for literal `it.skip`, `test.skip`, `describe.skip`, `.only(` and `xit(` in the test files found none, so the skips are conditional. Not a failure, noted for awareness.
- Stray logs: the npm ci log was written to /tmp/claude-1000/suite-npmci.log, not the scratchpad. Harmless.
- No process left running. Port 3795 is free.
