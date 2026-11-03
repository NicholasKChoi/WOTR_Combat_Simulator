# SGS-081 suite-1: CI-parity unit suite and prebuilt AoE4 Playwright specs

Verdict: **PASS**

Branch: sgs-081-aoe4-retune-prebuilt-farms, tip 0af3967 (run on a detached worktree at 0af3967; the working tree stayed clean).
Stack context: SGS-080 (c8cca5f, PR #88) is the base of this branch; run covers the full stack tip.

## 1. Unit suite (`commands.unit`: `npm test`, i.e. `vitest run`)

- Command: `npm test` (log: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/reports/SGS-081-suite-1.unit.log`)
- Result: exit 0
- Summary: `Test Files  45 passed (45)`, `Tests  1350 passed | 10 skipped (1360)`
- Failures: none

Note: the 10 skipped tests are pre-existing skips in the repo, not introduced by this run. No classification needed.

## 2. Playwright specs not run by the simplify pass

Command: `npx playwright test acceptance/aoe4-simulate-api-prebuilt-farms.spec.ts acceptance/aoe4-simulate-api-prebuilt-plans.spec.ts`
Result: exit 0, `29 passed (3.5s)`, chromium, no failures.

- `acceptance/aoe4-simulate-api-prebuilt-farms.spec.ts`: all farm-coverage and production-floor cases pass for English 1TC, knight/longbow, spear/longbow into men-at-arms/crossbow at 1200, 1800 and 3600 s.
- `acceptance/aoe4-simulate-api-prebuilt-plans.spec.ts`: all plan-runnability cases pass for the three builds, plus the 1TC guide-transcription checks (first guide steps unchanged, gold-depleted reaction is the first reaction step, every later step is a reaction or has a time trigger of 420 s or later).

Playwright started and stopped its own dev server. After the run, no `next`, `playwright` or `vitest` process was running and nothing was listening on a port in the 3000s range.

## 3. Other steps

- `commands.acceptanceSetup` (`npm ci && npm run acceptance:setup`): `npm ci` exit 0, `playwright install chromium` exit 0.
- `commands.codegen`: empty in REPO.md, not run.
- `git status --porcelain` after the runs: empty (clean).

## Environment

Runtime mismatch:
- Declared: `engines.node` = `24.x` in `package.json` (REPO.md also says Node 24.x for the acceptance harness). No `.nvmrc`, `.node-version`, or `.tool-versions` in the repo.
- Installed: Node `v22.17.0`.
- Install command to match: `nvm install 24 && nvm use 24` (or `fnm install 24`), then rerun `npm ci && npm run acceptance:setup`.
- Impact: the unit suite and both Playwright specs passed on Node 22.17.0, so the mismatch did not produce a failure here. CI parity on 24.x is not verified by this run.

## Failures

None. No stale-test, impl-defect, spec-gap, environmental, or BLOCKER findings.
