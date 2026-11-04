# SGS-084 acceptance-test 1 (rerun at tip 94a0c7b)

Verdict: PASS. Tip 94a0c7b (base fad1e41). No new commit: the spec acceptance/aoe4-gather-rates-per-villager.spec.ts is already committed at the tip and still fully covers the page criteria. tsc and lint:dup clean; tree clean.

## Tests (harness ran: Playwright/Chromium, own next dev)
1. Checkbox gather-rates-per-villager starts unchecked, y label `Per minute`; Food tooltip = gatherRates.food[i]; checked: label `Per villager per minute`, other charts' labels unchanged, Food = rate/gatherers; unchecked restores. PASS.
2. Pinned `start 3 sheep 3 berry -> sheep`, current `start 6 sheep -> sheep`: `Food (pinned)` and `Food` tooltips = respective rate/gatherers after checking (values differ); hidden legend entry stays hidden across the toggle. PASS.
Also run with them: aoe4-simulate-api-contract, aoe4-gathered-resources, aoe4-chart-readability. 77 passed, 0 failed.

## Mutation checks (each undone via git checkout; git diff --exit-code clean)
- results.tsx pinned series left raw: test 2 failed, test 1 passed.
- perVillagerSeries divides by 1: both failed.
- results.tsx current series left raw: both failed.
- perVillagerSeries reads gatherers at index 0: both failed.
- key={String(perVillager)} on the Gather rates chart (forces remount): test 2 failed (hidden-legend survival now covered).

## Failures
None.

## Not expressible
None.
