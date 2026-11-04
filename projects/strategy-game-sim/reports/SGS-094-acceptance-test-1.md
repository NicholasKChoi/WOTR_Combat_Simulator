# SGS-094 acceptance-test 1

Verdict: PASS. New tip 24a7963 (tests only) on sgs-094-aoe4-deer-pack-2450, on top of 2782f95.

## Existing coverage found sufficient (no new cases)
- Default run lists deer amount 2450: acceptance/aoe4-simulate-api-triggers.spec.ts:397 (DEFAULTS).
- Explicit nodeAmounts override wins: triggers spec :402.
- docs/api/openapi.json deer examples (2450 at lines 706 and 1705) equal live responses: aoe4-simulate-api-contract.spec.ts "the <name> request example returns the documented 200 body".
- git grep for "deer: 1750|7 deer x 250|1750" finds only the unrelated aoe4world/english.json hitpoints.

## Gap filled
- acceptance/aoe4-simulate-api-deer-pack.spec.ts: each of the three shipped builds, default run via /api/simulate, returns depletions deer `{amount: 2450, depletedAt: null}` (3 tests, one table loop).

## Run
- Contract, triggers and new spec: 132 passed (3.7 s), Playwright harness ran.
- tsc --noEmit and lint:dup ran clean.

## Mutation
- Changed base.json deer value 2450 to 1750: all 3 new tests failed. Undone with git checkout; git diff --exit-code clean.

## Failures
None. Spec-gaps or criteria not expressible: none.
