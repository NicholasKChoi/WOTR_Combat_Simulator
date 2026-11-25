# SGS-215 acceptance-test 13

Verdict: PASS. Branch sgs-215-production-past-population-cap, input tip 0d06791, new tip 1871d68d5d6339e7119d8bd64d1ebc7d94842ef2 (one commit, test file only).

## Tests written

File: `acceptance/aoe4-simulate-api-population-limit.spec.ts` (4 tests, all through POST /api/aoe4-build-order/simulate on the real 200 cap, prebuilt ENG 1TC). All pass.

1. Spawned population keeps growing after the cap: > 200 at 1800 s, 3600 s above 1800 s, and strictly up at every 300 s sample from 1200 s to 3600 s.
2. No house is paid after the cap: `spent.buildings` at the cap sample equals the final value, buildings were paid before it, and population grows by more than 100 after it.
3. A `produce` step armed after the cap (3 spearmen at 1500 s appended): it starts, no step's `waitBreakdown.population` exceeds the time from its `armedAt` to the cap instant, and no step has `waitingOn: 'population'` at the horizon. The loop uses `expect.soft`, so each assertion reports its own failure.
4. Default villager order stops at the villager target after the cap (still hiring after the cap, flat from 3000 s to 3600 s) while a `produce villager` step keeps going (above the default run and still growing 3000 to 3600 s).

## Runs

- Harness ran: `acceptanceSetup` then Playwright. New spec 4 passed. Whole `acceptance/aoe4-simulate-api*` set (463 tests) passed, including the implementer's edited `aoe4-simulate-api-spend-population.spec.ts`.
- Lint: `npx tsc --noEmit` clean, `lint:dup` 0 clones.
- The pre-existing `fight-api-spec-surface.spec.ts` failure (SGS-218) is not in the touched component and was not run.

## Mutation checks

All in scratch `mutate-sgs-215` (task branch plus the new spec committed there), provisioned with `link-node-modules.sh .` and `npm run acceptance:setup`. Each break reset with `git checkout -- <file>` and `git diff --exit-code`. Scratch removed.

| # | Break | Item | Failing assertion |
|---|---|---|---|
| 1 | `simulate.ts` `hasPopulationRoom`: lift removed (base behavior) | tests 1, 2, 3, 4 | test 1 `expected 200 > 200`; test 2 `population grows after the cap, expected > 300, got 200`; test 3 `startedAt` null; test 4 `expected 53 > 53` |
| 2 | `simulate.ts` `produce` handler only: back to inline `population + popcap > supply` | test 3 | `step 42 population wait <= 1e-9, got 2100`; `step 42 at the horizon not "population"`; `late.startedAt` not null (three separate soft/hard failures) |
| 3 | `simulate.ts` `payOrder` only: back to inline check | tests 1, 2, 4 | test 1 `> 200`; test 2 `> 300 got 200`; test 4 `> 53` |
| 4 | `simulate.ts` `hasPopulationRoom` lift only while `state.time < 2400` | test 1 per-sample row | `3000 s: expected > 586` |
| 5 | `houses.ts` `planAutoHouse` room uses `maxPopCap + 1000` | test 2 house assertion | `spent.buildings final: expected 3692, got 104892` |
| 6 | `simulate.ts` spent series records 0 for buildings | test 2 precondition (buildings paid before the cap) | `expected > 0, got 0` |
| 7 | `defaultVillagersDone` returns false once cap reached (default order applies the produce-step rule) | test 4 flat-after-target | `expected 126 to be 109` |
| 8 | `defaultVillagersDone` applies to produce steps too (rejected alternative: cap on both) | test 4 step-above-default | `expected > 94, got 94` |
| 9 | default order stops at `time > 1100` | test 4 still-hiring-after-cap | `expected > 54, got 54` |
| 10 | default order stops at `time > 1800` | test 4 hires-to-target | `expected > 74, got 74` |
| 11 | villager order (step and default) stops at `time > 3000` | test 4 step keeps going | `expected > 109, got 109` |

Choices: "lift keyed on supply alone" (`state.supply >= maxPopCap` only) was substituted as the rejected alternative; no test I wrote fails it. I tried a test of the cap instant on ENG 1TC and it passed under that break, because supply reaches 200 only after spawned population does on this build. That test (and a pinned-instant row) was deleted. The criterion stays covered only by the implementer's unit digests (1060 s and 1090 s), which I did not re-check here.

Assertions kept as data-condition guards that no production break targets beyond break 6: `populationCapReachedAt < 1800` (tests 4), `late.armedAt >= 1500` and `capInstant < late.armedAt` (test 3), `afterCap` count style guard removed. Per-sample row in test 1 is covered by break 4.

tree-record of the task checkout: before (taken before the scratch, spec as first written) `?? acceptance/aoe4-simulate-api-population-limit.spec.ts`, hash ccc4c5f897ab0ae17ba68a5a766a035c75950653; after (scratch removed) same listing, hash 1f453965e851be23e3c287d830ba61d0fa277a26. The hashes differ only because I edited my own new spec (deleted the pinned-instant test, switched to `expect.soft`) after the first record; no production or other file changed (status lists only the new spec).

## Failures

None.

## Not expressed in this harness

- Criteria needing `maxPopCap` lowered through `editGameData` (supply below the cap after the cap is reached, instant-of-spawn start, population wait after the cap with a lowered cap, S3 worst-case bound): the API cannot lower the cap; the implementer's unit tests own them.
- "Runs that never reach the cap give the base result" and the prebuilt-build pre-cap digests: digests pinned from the base are unit-level.
- Supply-alone-lift rejection (above): no API-observable difference on the prebuilt builds.
