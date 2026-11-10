# SGS-104 acceptance-test 1

Result: PASS. Branch sgs-104-split-layout, tip 32d9d29be00937f22311c5592497c0ba085d671d (no commit added).

- Coverage: every acceptance criterion maps to an existing spec, per Review 1 (aoe4-split-layout.spec.ts: split at 1280, tabs at 390, breakpoint 1200, live switch, resize keeps focus/state in both round trips, view toggle in split, first paint hydration, resize while hidden; aoe4-results-split.spec.ts:108-126 for 1800; aoe4-step-table.spec.ts:470 for the start row and the Build-column scroll through step-delete/step-add at 1280). The wiring greps are not browser tests; Review 1 verified them. No missing test found, so no spec was added.
- Run: `ACCEPTANCE_PORT=3777 npm run acceptance` in the task worktree (Playwright started its own next dev): 805 passed, 0 failed, 1.8 min.
- Mutation checks: none (no tests written).
- Failures: none. Worktree clean after the run.
