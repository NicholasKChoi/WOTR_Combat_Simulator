# SGS-204 simplify pass 1

Verdict: trimmed. New tip 2318283 (was d09af46) on sgs-204-upgrade-dot-tier-indicator. Nothing pushed.

Loaded: common.md, REPO.md, LESSONS.md (Playwright layout rule; no acceptance spec touched), styleSources.

Changes (3 files):
- result-series.ts: export tierTextBox and boxesIntersect.
- result-series.test.ts: drop the test's private copies (tierBox body, intersect) and use the exported helpers.
- line-chart.tsx: build the tierTexts list once from (dot, r) pairs instead of two duplicated object literals.

Comments: reviewed against the comment bar; kept (each states a hidden constraint). No change.
Checks: tsc clean, vitest components/apps/aoe4-build-order 944 passed, lint:dup passed. No browser tests run.
