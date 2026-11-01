# SGS-034 acceptance-test 1

Verdict: PASS. Tip 1bfff2a. No new tests needed; no commit made.

Coverage check: acceptance/aoe4-build-order.spec.ts (12 tests) and acceptance/landing.spec.ts cover every Playwright case in Scope item 9 (title/select/text, prebuilt run with series paths, pasted rally run, duration 300, invalid paste then recovery, stale-chart removal, 59 and emptied duration, non-JSON HTTP 500, legend toggle, notes present/absent). No waitForTimeout; networkidle plus POST wait used.

Run: 18/18 passed (aoe4 spec + landing spec) via npx playwright test, Chromium, Node 24.

Mutations (each failed, then undone; git diff --exit-code clean):
- page keeps result on 400 (setResult(null) removed): "failed run after a successful one removes the charts" failed.
- results.tsx always renders notes: "no notes element" failed.
- page sends 1200 instead of Number(duration): "sends the duration" failed.

Failures: none. Not expressible: unit-level criteria (builds.test.ts, result-series.test.ts) are Vitest, out of my scope; the PR-description mutation record is not a test.
