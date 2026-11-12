# SGS-128 acceptance-test 1

Verdict: PASS. Tip c85f1e0, branch sgs-128-shared-test-helpers-and-jscpd-gates.

- Setup: `link-node-modules.sh` + `npm run acceptance:setup` (Chromium) ran clean.
- Targeted run (Playwright, Chromium): aoe4-my-builds, aoe4-save-open, aoe4-builds-api-contract,
  aoe4-named-builds-api-contract, aoe4-simulate-api-contract, fight-api-contract,
  aoe4-simulate-api-prebuilt-farms: 240 passed, 0 failed (2.4m).
- Full acceptance suite (`npx playwright test`): 1009 passed, 0 failed (3.3m).
- No new specs written (none requested), so no mutation checks apply. No commit made; worktree clean.
- Failures: none. Criteria not expressible: none. No processes left listening (Playwright webServer self-managed).
