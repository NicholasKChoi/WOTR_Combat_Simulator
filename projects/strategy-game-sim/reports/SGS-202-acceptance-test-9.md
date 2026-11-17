# SGS-202 acceptance-test report 9

Tip tested: c25d26e (branch sgs-202-house-demand-held-order). Base: main.

Verdict: PASS (regression run), no acceptance tests written. The held-instance criteria cannot be expressed through the shipped-data HTTP boundary.

## Harness

Playwright ran (acceptanceSetup done, Chromium, its own next dev). Scoped run, 133 passed, 0 failed, 42.8 s:
aoe4-simulate-api-busy-buildings, -house-gate, -house-plan-ahead, -house-rule, -knight-longbow-build, -contract, -checks, and aoe4-auto-run, aoe4-auto-run-contract.
Also `npx vitest run lib/aoe4-build-order`: 53 files passed, 1 skipped, 1881 tests passed, 15 skipped.

## Tests written

None; nothing committed, tip unchanged (c25d26e), checkout clean.

Why: every criterion that depends on the change (held instance excluded from demand, first-pass exclusion, third-pass inclusion, production-time throw with a held order) needs a producer that is held while another is busy, plus a house that becomes due inside that window. The unit tests get this by editing game data (unit times, wood costs, starting buildings and resources). The HTTP API only takes the shipped data, so the setup has to be built from real economy: three barracks built, man-at-arms gold/food, population near cap.

I swept 24 real-data variants through the simulator (3 barracks, man-at-arms on instance 2, spearman on instances 1 and 3, a trailing held spearman step, varied triggers and villager counts) on the base `simulate.ts` and on the fixed one. All 24 gave byte-identical results, and the step I meant to hold never reached a hold state. An HTTP test built from this could not fail on the changed behavior, which the rules make a delete. The production-time throw needs a `productionModifier` rule, which is not reachable through the API at all.

Also compared base against fixed on every shipped build (4 builds, 600 s and 1200 s, autoHouses on): result hashes identical. So no shipped build's timings move.

## Mutation checks

None (no tests written). Scratch exploration file and temporary `simulate.ts` swaps were reverted; `git diff --exit-code` clean, no untracked files.

## Failures

None.

## Criteria not expressible in this harness

Criteria 1, 3 and 4 (held exclusion, third-pass inclusion, held production-time throw) are pinned only by the implementer's unit tests in `lib/aoe4-build-order/simulate-busy-buildings.test.ts`; they need edited game data and a civ rule. Criteria 2 and 7 are covered by the same unit file plus the passing house-gate, plan-ahead, house-rule and knight-longbow specs (no regression). Criterion 6 (docs) is not machine-testable.

## Processes

No server left running (only the sandbox proxy on 3128 listens).
