# SGS-137 acceptance-test 1

Verdict: PASS. No tests written or changed by me; no commit. Tip stays 6de222d on sgs-137-chart-view-toggles. The implementer's specs already cover the Playwright criteria; I ran them and mutation-checked them.

## Harness
acceptanceSetup ran (node_modules linked, Chromium installed). Ran `acceptance/aoe4-chart-views.spec.ts`, `aoe4-chart-layout.spec.ts`, `aoe4-chart-readability.spec.ts`, `aoe4-build-order-pin-compare.spec.ts` with the harness's own dev server (per-checkout port): 75 passed. `tsc --noEmit` and `lint:dup` clean. `git grep` for `gather-rates-per-villager|perVillagerSeries` and `Per villager` (docs, ARCHITECTURE.md, acceptance, components) has no match. Nothing of mine is left running; only the sandbox proxy listens on 3128.

## Tests (all in aoe4-chart-views.spec.ts, all passing)
- Gather rates starts Rate, y label `Per minute`; Villagers gives label `Villagers` and the tooltip value equals `gatherers` at the sample (rate and gatherers asserted to differ first); Rate restores; re-clicking Villagers changes nothing; other charts' labels unchanged.
- Units produced starts Units/`Count`; Buildings gives `Buildings`, legend equals response `productionBuildings` names (non-empty asserted), path count matches; Units restores; other labels unchanged.
- Toggle visible and works while Gather rates is collapsed (body hidden asserted before and after click); new view shown on expand.
- Reload resets both charts to Rate and Units.
- Enter and Space on a focused option select it.
- Pin, Villagers: `food` and `pinned:food` paths both drawn, differ, and each differs from its Rate-view path (gatherer difference asserted from responses first); hidden `wood` stays hidden (both lines absent, legend pressed) across rate, villagers, rate.
- Pin, Buildings: `pinned:barracks` drawn with no solid `barracks` line (asserted from responses); a shared building has both lines.
- aoe4-chart-layout.spec.ts collapse cases use the Villagers toggle (pass).

## Mutation checks (each undone with `git checkout -- components`, `git diff --exit-code` clean)
- result-series.ts gatherRatesSeries: Villagers reads `gatherRates` -> views spec line ~108 (tooltip value vs `gatherers`) and pinned test line 215 (path unchanged from Rate) failed.
- result-series.ts unitsProducedSeries: Buildings returns unit series -> views spec line 141 (legend equals building names) and line 246 (`pinned:barracks` count 0) failed.
- results.tsx gather series always reads current `result` (ignores run) -> pinned test line 214 (current path equals pinned path) failed.
- results.tsx initial states set to villagers/buildings -> reload test failed at the `aria-pressed` assertion after reload.
- results.tsx Villagers y label forced to `Per minute` -> views spec lines 103 and 164 failed (the latter is the collapsed-then-expand case).
- chart-view-toggle.tsx onClick made a no-op -> keyboard test failed at `aria-pressed` true.

Not mutation-checked: the hidden-legend-across-switch assertions (the behavior lives in untouched line-chart/legend code, and the break would be outside this ticket's files); the pass is unverified against a break. The "clicking the selected option does nothing" criterion cannot be observed through the DOM (no onChange visible); the re-click assertions pin only that state is unchanged.

## Failures
None.

## Not expressible
- Vitest and markup criteria (series selection, `buildingSeries` order, toggle markup) are the implementer's unit tests, not this harness.
- Selected-option click firing no `onChange` is not observable at the browser boundary.
