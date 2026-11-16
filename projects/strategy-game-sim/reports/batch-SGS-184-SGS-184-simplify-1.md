# SGS-184 simplify pass 1

Verdict: no changes needed. Tip unchanged: 517ede8773e87f5e96ac3825d558cf1071669543. Nothing committed, nothing pushed.

Reviewed the diff c754c4c..HEAD against REPO.md styleSources (ARCHITECTURE.md, tsconfig.json), LESSONS.md (Playwright layout lesson: new specs read values in one evaluate under expect.poll, already satisfied) and the common.md comment bar.

Checked:
- No dead leftovers: grep finds no references to useSplitLayout, WORKBENCH_SPLIT_QUERY, workbench-tabs, tab-build/tab-results, startSpacer, or activeView. The removed helpers (showTab, SPLIT_MIN_WIDTH, TABS_VIEWPORT) are gone from acceptance/helpers.ts.
- WorkbenchColumns is a small, used component. No new comments were added, so the comment bar is met.
- step-annotation.module.css `.gutterEndTime` is now an unconditional display:none, still referenced from step-annotation.tsx. Removing the span would change behavior and rendered markup (step-finished testid), so it was left alone.

Unit tests: `npm test` passed (83 files passed, 1 skipped; 2613 tests passed, 15 skipped). No browser or e2e tests run.
