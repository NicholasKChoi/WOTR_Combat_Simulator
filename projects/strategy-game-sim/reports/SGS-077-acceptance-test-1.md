# SGS-077 acceptance-test 1

Result: PASS, no failures. New tip e9a428d on sgs-077-aoe4-gathered-resources-chart (on 33a02ac). Not pushed. Node 24, Playwright harness ran.

File: acceptance/aoe4-gathered-resources.spec.ts (5 tests, all pass)
1. Starting resources excluded (gathered[0]=0 while floating food[0]>0) and per-interval growth = gatherRates/60*dt, via the API with infinite nodes; unused kinds stay 0.
2. Finite berry stock (601): gathered food equals exactly the stock after depletion and stays there (stocked drawDown path).
3. OpenAPI: version 2.1.0, gathered required, four kinds, closed.
4. A real response validates against SimulationResult; missing gathered, a negative entry and an extra kind are rejected.
5. Page: charts in order units, rates, gathered, floating; y label "Resources"; with a pin of a different duration the dashed pinned:food path differs from the current path (pinned overlay uses the pinned run's data), dashed vs solid.

Run: new spec + spend-population, contract, pin-compare, results-split: 115 passed. tsc clean, lint:dup 0 clones.

Mutation checks (each reverted with git checkout; tree clean):
- remove unstocked credit (simulate.ts:710): test 1 failed
- remove stocked credit (:716): test 2 failed
- start gathered 100 (:794): tests 1, 2 failed
- sampled value scaled 0.5 (:967): tests 1, 2 failed
- pinned overlay uses result.gathered (results.tsx:65): test 5 failed
- drop "gathered" from openapi required: tests 3, 4 failed
Not mutated: chart order (test 5 asserts it by DOM order).

Failures: none. Criteria not expressible: none. The unit-test criteria (simulate-series) are the implementer's and were not rerun here beyond the implementer's reported suite.
