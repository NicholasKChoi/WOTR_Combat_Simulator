# SGS-081 simplify pass 1
Scope c8cca5f..884b1c6, done inline (no sub-agents).
Changed: acceptance/helpers.ts (new simulateOk<T>), acceptance/aoe4-simulate-api-prebuilt-farms.spec.ts and -prebuilt-plans.spec.ts now use it instead of two copies of the same simulate+200 check. No assertions, tolerances or 1TC steps touched.
Skipped: no narrating comments found in the diff; floors test duplicated between vitest and playwright is intentional (separate layers).
Results: tsc clean, lint:dup pass, vitest lib/aoe4-build-order 1073 passed / 10 skipped.
