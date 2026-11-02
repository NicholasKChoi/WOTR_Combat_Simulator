# SGS-042 acceptance-test 1: PASS (tip 6c76b95)

Written by the manager from the agent's returned text.

- Added `acceptance/aoe4-simulate-api-waits.spec.ts` (21 API tests), commit 6c76b95. Test-only. All 21 pass; the aoe4-simulate-api* set passes 211/211; tsc and lint:dup clean.
- Baseline vs origin/main 1d5f5c9 (seven requests): after stripping waitingOn, waitBreakdown and step-stuck, responses are byte-identical.
- Covers each wait reason through the API, breakdown sums, step-stuck (1-based message, 0-based step, at, ordering), determinism.
- 17 mutation checks, each failed a test. The unregistered-action fallback cannot be reached through the API (unit test with withHandler covers it).
