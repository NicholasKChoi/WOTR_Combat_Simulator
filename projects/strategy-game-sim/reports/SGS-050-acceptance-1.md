# SGS-050 acceptance 1: PASS

Spec: acceptance/aoe4-simulate-api-spear-longbow-build.spec.ts (4 tests, all pass; harness ran on port 3778 via Playwright and next dev).

Tests
- 1200 s and 3600 s: step 23 (man-at-arms) has armedAt and startedAt 681, and no step is waiting.
- 1200 s: gold, gold#2, gold#3 have depletedAt null; warnings empty.
- 3600 s: all three gold deposits run out; node-depleted warnings are exactly gold, gold#2, gold#3 at severity info; no warning-severity warning on a gold node.

Already covered, nothing added: page lists every prebuilt build (aoe4-build-order.spec.ts:52 asserts the select options equal listBuilds() names, default builds[0]); that spec also passed (23 tests).

Mutation checks (production JSON broken, test rerun, reverted with git checkout; git diff of non-test files clean)
- Removed the gold reaction step: 3600 s test failed.
- Moved man-at-arms after the 760 s rally: both step-23 timing tests failed.
- The 1200 s no-deposit test guards depletion appearing early; not separately mutated.

Failures: none. Criteria not expressible: none.
