# SGS-154: Re-add AoE4 simulate-API acceptance coverage without pinned values

- **Type**: Chore
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: low
- **Risk**: low
- **Invariants**: A3 (assertions compare runs and read values from the response; they must not depend on run-to-run variation, since results are deterministic)
- **Unverified assumptions**: none
- **LOC estimate**: 0 (test-only: new cases in the existing `acceptance/aoe4-simulate-api-*.spec.ts` files named below, plus one restored file (`aoe4-simulate-api-veterancy-conversion.spec.ts`), roughly 150 test lines; no business logic)
- **Depends on**: none
- **On merge**: none
- **Source**: owner backlog triage Q64 (2026-11-12), the AoE4 acceptance-coverage bullet from the SGS-098 ticket report; deletion commit 27e8840 holds the removed tests

## Context

The deleted tests are readable at `git show 27e8840^:acceptance/<file>`. They went stale because they pinned engine-tunable numbers (timelines, banks, counts, instants), so the owner chose deletion over re-pinning. The API behaviors they guarded are uncovered at acceptance level. Re-add each behavior as a rule over the response (relations between fields, between runs, and against the build or request that produced them), never as a literal the engine produces today.

## Scope

All work is in `acceptance/`. Each item below is a test to add to the named spec (restoring the deleted file where a whole file was removed). A test derives its instants, step indexes, and horizons from the response or the build JSON it posts, so an engine change moves them with it. Values that are inputs (`nodeAmounts`, produce `count`, a unit's cost from the data snapshot) may be literals. Follow the file's existing helpers; `acceptance/helpers.ts` exports `postSimulate`, `simulateOk`, `buildOrderFrom`, `INFINITE_NODES`, and `WARM_UP_TIMEOUT_MS`, and a spec imports what it lacks (the deleted tests imported `INFINITE_NODES` where a spec no longer does). The per-`baseId` sum helper the deleted tests used was deleted; write an independent one locally or in `acceptance/helpers.ts`. A spec's local result type may lack fields a restored test reads (the spear-longbow spec's `Result` no longer has `steps`); extend it.

1. `aoe4-simulate-api-edges.spec.ts`, result shape. A villager-only order returns a 200 JSON body with the documented top-level keys; `times` starts at 0, ends at `durationSeconds`, and has `durationSeconds / sampleSeconds + 1` entries; every `unitsProduced[*].counts` and every `gatherRates` series has one entry per `times` entry; the villager series never decreases and ends at or above the order's produce count (an input, fixed at the deleted test's order, `produce villager` x3; a precondition asserts the order's produce count is that value, since a larger count could hit the population cap;  starting villagers never appear in `unitsProduced`, per its schema, and the default continuous villager order keeps producing after a `produce villager` step, so the end may exceed the count: no equality); `steps` has one `completed` entry. Source: the deleted "villager-only order returns every result field" test. The key list is derived from the `SimulationResult` schema's `properties` (`schemas` is exported by `acceptance/openapi-schemas.ts`), not hand-written: the deleted test's list predates later response changes.
2. `aoe4-simulate-api-markers.spec.ts`, truncated horizon. Run `english-1tc.json` (imported there as `english1tc`) in full and take the `completedAt` of a research step (the build's `research` steps, for example `horticulture`). The before-horizon is the largest integer strictly below that `completedAt`, asserted to be at or after the step's `startedAt` (so its status is `in-progress`, not `waiting`). The after-horizon is `ceil(completedAt)`. Before: the step's status is `in-progress` and no marker's `label` equals the step's `tech`. After: its status is `completed` and a marker with that `tech` as its `label` exists. In every run each marker's `at` is at most the horizon. Source: the deleted "gives no marker to research still in progress" test.
3. `aoe4-simulate-api-veterancy-conversion.spec.ts` (restore the file). Post `english-knight-longbow.json` with `durationSeconds` 1800 (an input). The two longbow series are the `unitsProduced` entries with `baseId === 'longbowman'`, ordered by `tier`; assert there are exactly two (lower tier first). With the `completedAt` of the `veteran-longbowmen` research step: the lower-tier series is positive at the last sample strictly before `completedAt` and zero at every sample at or after it; the upper-tier series is zero at the last sample strictly before it and positive at the first sample at or after it (each asserted to exist). The per-sample sum of the two series never decreases, and at the last sample equals both the upper tier's last count and the total of an independent per-`baseId` sum helper for `longbowman` (it sums each series' last count by `baseId`, not reusing the test's own per-sample sum). Source: the deleted veterancy-conversion file.
4. `aoe4-simulate-api-spear-longbow-build.spec.ts`, men-at-arms timing over the API wire path (a unit test already pins arming at the trigger), at the horizons 1200 and 3600 (inputs, `durationSeconds`). The step is the first `produce` step of `man-at-arms` in the build JSON whose trigger has `kind` `time`; read its trigger `seconds` and find its result step by its index in `steps`. Its `armedAt` equals that trigger `seconds`, its `startedAt` is at or after `armedAt`, its `waitBreakdown.resources` is within 1e-3 of `startedAt - armedAt`, and no step has status `waiting`. Source: the deleted men-at-arms test (its Castle-landmark constant was this trigger value; the build has no landmark step).
5. `aoe4-simulate-api-triggers.spec.ts`, infinite-node run. On `english-1tc.json` at `durationSeconds` 3600 (an input), run the default request and the request with `INFINITE_NODES`. Every step that starts before the earliest finite `depletedAt` of the default run has the same `startedAt` in both runs. Also, in the default run, every node whose depletion row has a `depletedAt` has exactly one `node-depleted` warning with that node, `at` equal to `depletedAt`, an integer `idleVillagers` of at least 0, and severity `warning` exactly when `idleVillagers` is above 0 and `info` otherwise; a node with a null `depletedAt` has no `node-depleted` warning. A test asserts a depletion exists, so the step comparison covers at least one step. Source: the deleted "keeps every step start time of the infinite-node run" and "runs the sheep out" tests.
6. `aoe4-simulate-api-depletion-engine.spec.ts`, three cases using the deleted tests' own setups (they use the file's `order` helper, `PAUSE` step and `autoHouses: false`), with only the rate-derived expected instants dropped. Do not recompute the per-villager rate from a probe run.
   - (a) Start villagers on berry 3 and wood 3, rally wood, steps `[PAUSE]`, `nodeAmounts: { berry: <stock> }` with the stock fixed at 601 (the deleted test's value, an input; another stock is not covered by the rule). Precondition: the berry row's `depletedAt` is not null. The `gathered.food` series rises by exactly the stock (last sample minus first, within float tolerance); the `floating.food` rise plus the `spent.villagers` rise over the same samples also equals the stock (the default villager order pays food, so `floating.food` alone rises by less); and `depletedAt` is not a multiple of `sampleSeconds`.
   - (b) Start villagers on sheep 6, rally sheep, one `produce` step of villagers from the capital town center with `rally: 'berry'` and a small `walkSeconds`, `nodeAmounts: { berry: 0 }`. Precondition: an `idle-arrival` warning for berry exists. The produce `count` is fixed at 2 (the deleted test's value, an input; `autoHouses: false` caps the population, so a larger count may never be produced). A second precondition: the villager series' last count is at least the count, so a cap change fails with that message. There is exactly one `idle-arrival` warning for berry (the test does not assert the total warning count, since the run carries other warnings), its `at` is above 0, and its `idleVillagers` is at least the count and at most the villager series' last count (the producer's rally persists, so villagers the default continuous order produces later also walk to the dry node; no equality).
   - (c) Start villagers on `gold` 2 and `gold#2` 4, rally gold, steps `[PAUSE]`, with finite stocks fixed at 100 and 300 (the deleted test's values, inputs). Making deposit 1 infinite (`nodeAmounts.gold: null`, deposit 2 unchanged) leaves deposit 2's depletion row equal to the run where both are finite in `node` and `amount`, with `depletedAt` within 1e-6 (the two runs differ by float rounding, so no deep equality), and deposit 1's row equals `{ node: 'gold', amount: null, depletedAt: null }`. Precondition: deposit 2's `depletedAt` in the both-finite run is not null.
7. `aoe4-simulate-api-spend-population.spec.ts`. A 40-villager order with no house step and infinite nodes, at the default horizon (an input). A precondition asserts every produced villager is paid and spawned by the horizon (the villager series' last count is at least 40, the produce count), so a slower engine fails with that message rather than a bare mismatch. Then: `spent.villagers` is a whole multiple of the villager cost from the data snapshot and at least the villager series' last count times that cost (continuous producers pay ahead of spawning, so no equality with 40 times the cost); `spent.buildings` is positive and a whole multiple of the house cost; and `spent.military` and `spent.research` end at 0. Source: the deleted "counts an auto-house under buildings" test.

**Dropped, not re-added** (each would need an engine-tunable number or compares against code that no longer exists):
- The pinned prebuilt English timelines and floating-bank values, and the one-unit-ahead and snapshot-cost spend sum for the prebuilt build (it asserts how far ahead continuous producers pay, an engine detail).
- The house-lead-time series and the 1800 s digest tests. House planning is covered by the house-rule and house-gate specs.
- The "differs only by farm builders joining" and ulp-timing tests against the pre-depletion engine; there is no such engine to compare to.
- The contract spec's buildOrder 200-body example. Examples validating against their schema and a real 200 validating are already covered in the contract spec; the example's literal body churns with every engine change.
- The knight/longbow `auto-houses-held` warning test: that warning and `auto-houses-never-start` were removed from the engine, result type, schema, and docs when houses began to be planned from the start; no replacement.
- "At 1200 s no gold deposit has run out and no warning": it depends on starting amounts and rates.

**Docs:** no doc becomes untrue. Do not touch product code, docs, or data files.

**Out of scope:** product code; docs; re-pinning any value; changing a remaining test's assertions.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] Each of items 1 to 7 has at least one test that runs in `npm run acceptance` and passes, with no skipped or fixme'd test.
- [ ] No added test asserts a number that the engine or data tuning decides: no literal instant, bank value, count, or step index appears unless it is an input to the run or a cost read from the data snapshot. Instants, step indexes, and horizons are read from the response or the build JSON.
- [ ] Item 2 (respec 2): a test fails if a marker labeled with the researched `tech` is emitted at a horizon where its step is still `in-progress`, and fails if no such marker appears at `ceil(completedAt)`; the before-horizon is asserted to be at or after the step's `startedAt`.
- [ ] Item 3 (respec 3): a test fails if the lower tier is not zero at every sample from the research completion on, if the upper tier is not positive at the first sample at or after it, if the summed count drops at any sample, or if the final sum differs from the independent per-`baseId` sum or from the upper tier's last count; the two series are selected by `baseId` and `tier`, and exactly two exist.
- [ ] Item 4 (respec 1): a test fails if the first time-triggered men-at-arms step arms at any instant other than its own trigger seconds, if `startedAt` precedes `armedAt`, if `waitBreakdown.resources` differs from `startedAt - armedAt` by more than 1e-3, or if a step is left `waiting`.
- [ ] Item 5 (respec 2): a test fails if a step starting before the earliest depletion differs between the finite and infinite runs, if a depleted node lacks its `node-depleted` warning or an undepleted node has one, or if a warning's severity does not match its `idleVillagers` (`warning` exactly when above 0).
- [ ] Item 6 (respec 2, respec 4): the three cases hold with only input literals; (a) (respec 4) fails if the `gathered.food` rise differs from the stock, or if the `floating.food` rise plus the `spent.villagers` rise does; (b) (respec 6) fails if there is not exactly one berry `idle-arrival` warning (the total warning count is not asserted), or its `idleVillagers` is below the produce `count` (fixed at 2) or above the villager series' last count, and fails with a clear message when the villager series' last count is below the count; and (c) (respec 4) fails if deposit 2's `node` or `amount` changes, or its `depletedAt` moves by 1e-6 or more, when deposit 1 is made infinite, or if deposit 1's row is not null in `amount` and `depletedAt`.
- [ ] Item 1 (respec 4): a test fails if the villager series ends below the produce count or decreases at any sample, or if it asserts equality with the produce count or a count that includes starting villagers.
- [ ] Item 7 (respec 4): a test fails with a clear message when the villager series' last count is below 40 at the default horizon, before the `spent` comparisons run; `spent.villagers` is asserted as a whole multiple of the villager cost and at least the last count times it, never as 40 times the cost.
- [ ] Every added test has a precondition assertion where its meaning depends on the data (a depletion exists before the compared steps, a research completes within the horizon, the `idle-arrival` row exists, a finite node's `depletedAt` is not null).
- [ ] Nothing outside `acceptance/` changes; no existing test's assertions or expected values change; every test the diff edits or deletes is listed in the implementer's report.
- [ ] `npm run acceptance`, `npm test`, and `npx tsc --noEmit` pass.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-12

- Underspecified: item 4 tested a warning removed from the engine, and item 5 named a Castle landmark step the build lacks (the 681 s value is a time trigger on the first man-at-arms step); the size estimate counted files that do not exist.
- Changed: item 4 moved to Dropped; item 5 (now item 4) restated on the time trigger with a stated tolerance; items renumbered; item 1's key list derives from the schema; size fixed.
- Stands: none of the branch work is relevant; items 1 to 3 and 6 to 8 of the original are unchanged apart from numbering.

## Re-spec 2 - 2026-11-12

- Underspecified: horizons, builds, and series selection were left to the implementer; item 5 required a positive `idleVillagers` though the schema allows 0 (severity `info`); item 3 had a tautological sum check; item 6 did not name the bank field or setups.
- Changed: items 1 to 3, 5 and 6 now state horizons, builds, marker and tier selection, the `floating` bank, setups and `depletedAt` preconditions; item 4 states horizons 1200 and 3600; severity follows `idleVillagers`.
- Stands: item 7 and the Dropped list; no branch work exists.

## Re-spec 3 - 2026-11-12

- Underspecified: item 1 added start villagers to the produce count, adopted from a gate note unchecked; the schema says starting units never appear and the deleted test asserted the produce count (3 for `produce villager x3` with 6 starting sheep). Item 7 stated no horizon or paid-all precondition. Helper claims were stale (`finalCount` absent, `INFINITE_NODES` import dropped from spend-population, spear-longbow `Result` lost `steps`).
- Changed: item 1 villager series ends at the produce count; item 7 states the default horizon and a precondition; `finalCount` replaced by an independent per-`baseId` sum helper; helper notes corrected. Other claims about the deleted tests and the result schema were re-verified against 27e8840^ and origin/main and hold.
- Stands: items 2 to 6 and the Dropped list; no branch work exists.

## Re-spec 4 - 2026-11-12

- Underspecified: items 1, 6 and 7 took rules from the deleted tests that the engine at origin/main breaks: the default continuous villager order keeps producing past a `produce villager` step, the producer rally sends later villagers to the same node, and `depletedAt` of a numbered deposit differs by float rounding between runs.
- Changed: item 1 (villager series at or above the count, never decreasing), item 6 (a: `gathered.food` rise, and `floating` rise plus `spent.villagers` rise; b: `idleVillagers` between the count and the villager series' last count; c: `depletedAt` within 1e-6) and item 7 (precondition at least 40; `spent.villagers` a multiple of the cost and at least last count times cost). Each rule was run against origin/main in a throwaway probe test at the default horizon and at 3600 s, and holds.
- Stands: items 2 to 5 and the Dropped list; no branch work exists.

## Re-spec 5 - 2026-11-12

- Underspecified: item 6(b) allowed any count above 1, but the `order` helper's `autoHouses: false` caps villagers (count 5 gives `idleVillagers` 3, below the count); other rules left inputs free (item 1's count, item 6a's stock, item 6c's stocks) so they held only at the probed value.
- Changed: item 6(b) count fixed at 2 with a precondition that the villager series' last count is at least the count, and its criterion restated; item 1's order fixed at `produce villager` x3, item 6a stock at 601, item 6c stocks at 100 and 300, all the deleted tests' own values, which gate 5 verified at 1200 s and 3600 s.
- Stands: items 2 to 5, item 7 (count 40 already fixed), and the Dropped list; no branch work exists.

## Re-spec 6 - 2026-11-12

- Underspecified: item 6(b) said "exactly one warning", but the run carries 3 warnings and only the berry `idle-arrival` is one of them.
- Changed: item 6(b) and its criterion say exactly one berry `idle-arrival` warning and that the total warning count is not asserted. Other counts in the ticket (per-node `node-depleted`, two longbow series, one `completed` step) each name their kind and were left as is.
- Stands: all other items and the Dropped list; no branch work exists.
