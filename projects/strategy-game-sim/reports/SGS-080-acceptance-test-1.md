# SGS-080 acceptance-test 1

Verdict: PASS (new tests all pass; only the 6 known SGS-081 failures remain). Node 24.22.2 (nvm), Playwright harness ran.
Test commit: see branch tip after 123936b (acceptance/aoe4-simulate-api-farm-slots.spec.ts, one new file, test-only).

## Tests written (8, all pass)
- lone farmer on a built farm: no farm-idle warning.
- starting farmers with no farm: food rate 0 at every sample, exactly one farm-idle at 0, full plural message.
- single idle farmer: singular message ("waits").
- moved villagers (1 then 2) add up: one warning, at first arrival (35 s), idleVillagers 3, food 0.
- 3 farmers + farm builds: 1x farmRate at first completion, 2x at second completion instant (not 3x), promotion; idleVillagers 5 (3 starters + 2 builders).
- builders 3, one farm: 1x income, one warning idleVillagers 2.
- move off a full farm takes the idle villager first: food unchanged, wood rises.
- wood not capped (6 wood = 6/5 of 5 wood), no warning.

## Mutation checks (production simulate.ts, each reverted; git diff on lib clean)
- slotsAt returns Infinity: 6 tests failed.
- fillSlots promotion 0: 2 failed (promotion, move-order).
- sendWalking gatherers-first: move-order test failed.
- no farmIdle recording: 5 failed.
- farmIdle keeps only last arrival: "moved villagers add up" and promotion test failed.
- slotsAt minus 1: lone-farmer test failed (and the beforeAll baseline).
- slotsAt caps wood at 2: wood-not-capped test failed (plus others).
- start-cap excess not idled: 5 failed.
- waitForSlot not incrementing idle: 2 failed.
A ninth test (idle farmers count in spawnedPopulation) did not fail under that last mutation (the series
does not move in a pause-only run), so it was deleted.

## Full run
`npm run acceptance`: 704 passed, 6 failed. `npx tsc --noEmit` and `npm run lint:dup` pass.
Failures, all expected-for-SGS-081 (shipped builds still idle farmers): knight-longbow-page:12,
spear-longbow-build:34 (x2: 1200 s, 3600 s) and :43, veterancy-conversion:38 and :44. No impl-defects, no spec-gaps.

## Not expressible in this harness
- Start-state cap with starting farm buildings / rules.startingState override: start.buildings is not an API input (covered by unit tests).
- Auto-house builders idle-first at a farm and houseBuilderSource not counting idle farmers: auto-houses are not visible as steps through the API.
- Population/`at N vils` trigger with idle farmers: no API-visible difference found in a mutation-sensitive way.
- Idle vs gatherer counts are not exposed; asserted via gatherRates.food.
