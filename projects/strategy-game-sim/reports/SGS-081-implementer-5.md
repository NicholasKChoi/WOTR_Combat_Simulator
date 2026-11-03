# SGS-081 implementer 5 (transcribed by manager; agent did not write the file)

Rework 6 fixes, tip 021baa5 (from f0fe3d6), not pushed.
- README.md: farms paragraph, rally sentence, 790 s produce sentence replaced with review-3 text word for word.
- acceptance/aoe4-simulate-api-triggers.spec.ts: ownSteps uses r.steps.slice(0, -1) (all 40 non-reaction steps); 24 STARTED_AT pins kept; exact lengths 40 and 41.
- lib/aoe4-build-order/builds.test.ts: spear/longbow case, no idle-arrival or step-stuck through 1800 s. Mutation (filter node-depleted) fails as expected.
Gates: npm test 1350 passed / 10 skipped; tsc clean; lint:dup 0; next build ok; aoe4 acceptance 509 passed / 1 failed (marker labels, intermittent, different test each run).
