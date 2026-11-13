# SGS-154: Re-add AoE4 simulate-API acceptance coverage without pinned values

- **Type**: Chore
- **Component**: aoe4-build-order
- **Milestone**: none
- **Priority**: low
- **Risk**: low
- **Invariants**: A3 (assertions compare runs and read values from the response; they must not depend on run-to-run variation, since results are deterministic)
- **Unverified assumptions**: none
- **LOC estimate**: 0 (test-only: new or restored cases in new or restored cases in the existing `acceptance/aoe4-simulate-api-*.spec.ts` files named below, plus one restored file (`aoe4-simulate-api-veterancy-conversion.spec.ts`), roughly 150 test lines; no business logic)
- **Depends on**: none
- **On merge**: none
- **Source**: owner backlog triage Q64 (2026-11-12), the AoE4 acceptance-coverage bullet from the SGS-098 ticket report; deletion commit 27e8840 holds the removed tests

## Context

The deleted tests are readable at `git show 27e8840^:acceptance/<file>`. They went stale because they pinned engine-tunable numbers (timelines, banks, counts, instants), so the owner chose deletion over re-pinning. The API behaviors they guarded are uncovered at acceptance level. Re-add each behavior as a rule over the response (relations between fields, between runs, and against the build or request that produced them), never as a literal the engine produces today.

## Scope

All work is in `acceptance/`. Each item below is a test to add to the named spec (restoring the deleted file where a whole file was removed). A test derives its instants, step indexes, and horizons from the response or the build JSON it posts, so an engine change moves them with it. Values that are inputs (`nodeAmounts`, produce `count`, a unit's cost from the data snapshot) may be literals. Follow the file's existing helpers (`postSimulate`, `buildOrderFrom`, `INFINITE_NODES`, `WARM_UP_TIMEOUT_MS`); a helper the deleted tests used and that was deleted (`finalCount`) may be re-added to `acceptance/helpers.ts` or written locally.

1. `aoe4-simulate-api-edges.spec.ts`, result shape. A villager-only order returns a 200 JSON body with the documented top-level keys; `times` starts at 0, ends at `durationSeconds`, and has `durationSeconds / sampleSeconds + 1` entries; every `unitsProduced[*].counts` and every `gatherRates` series has one entry per `times` entry; the villager series ends at the order's villager count; `steps` has one `completed` entry. Source: the deleted "villager-only order returns every result field" test. The key list is derived from the `SimulationResult` schema's `properties` (`schemas` is exported by `acceptance/openapi-schemas.ts`), not hand-written: the deleted test's list predates later response changes.
2. `aoe4-simulate-api-markers.spec.ts`, truncated horizon. Run the prebuilt English build in full, take the completion instant of a research step, then run with a horizon strictly before and one at or after it. Before: the step's status is `in-progress` and no marker carries its label. At or after: its status is `completed` and a marker with its label exists. In every run each marker's `at` is at most the horizon. Source: the deleted "gives no marker to research still in progress" test.
3. `aoe4-simulate-api-veterancy-conversion.spec.ts` (restore the file). On the knight/longbow build at a long horizon: the lower-tier longbowman series is positive at a sample before the Veteran Longbowmen research completes and zero at every sample from its completion on; the upper tier is zero before and positive at or after it; the summed per-`baseId` count never decreases between samples and equals the sum of the tier series at the last sample. The research completion instant comes from that step's `completedAt`. Source: the deleted veterancy-conversion file.
4. `aoe4-simulate-api-spear-longbow-build.spec.ts`, men-at-arms timing over the API wire path (a unit test already pins arming at the trigger), at the two horizons the deleted loop used. The step is the first `produce` step of `man-at-arms` in the build JSON whose trigger has `kind` `time`; read its trigger `seconds` and find its result step by its index in `steps`. Its `armedAt` equals that trigger `seconds`, its `startedAt` is at or after `armedAt`, its `waitBreakdown.resources` is within 1e-3 of `startedAt - armedAt`, and no step has status `waiting`. Source: the deleted men-at-arms test (its Castle-landmark constant was this trigger value; the build has no landmark step).
5. `aoe4-simulate-api-triggers.spec.ts`, infinite-node run. On the prebuilt English build, every step that starts before the earliest finite `depletedAt` has the same `startedAt` in the default run and in the run with `INFINITE_NODES`. Also, every node whose depletion row has a `depletedAt` has exactly one `node-depleted` warning with that node, `at` equal to `depletedAt`, and a positive integer `idleVillagers`; a node with a null `depletedAt` has none. A test asserts the earliest depletion exists, so the comparison covers at least one step. Source: the deleted "keeps every step start time of the infinite-node run" and "runs the sheep out" tests.
6. `aoe4-simulate-api-depletion-engine.spec.ts`, three cases using only inputs: (a) a finite node run to exhaustion adds exactly its `nodeAmounts` stock to the bank, and its `depletedAt` is not a multiple of `sampleSeconds`; (b) villagers produced with a rally to an already-empty node yield one `idle-arrival` warning whose `idleVillagers` equals the produced count; (c) with numbered gold deposits, making deposit 1 infinite leaves deposit 2's depletion row exactly equal to the run where both are finite, while deposit 1's row shows a null amount and `depletedAt`. Do not recompute the per-villager rate from a probe run. Source: the three deleted depletion-engine tests that do not compare against the pre-depletion engine.
7. `aoe4-simulate-api-spend-population.spec.ts`. A 40-villager order with no house step and infinite nodes: `spent.villagers` equals 40 times the villager cost from the data snapshot, `spent.buildings` is positive and a whole multiple of the house cost, and `spent.military` and `spent.research` end at 0. Source: the deleted "counts an auto-house under buildings" test.

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
- [ ] Item 2: a test fails if a marker is emitted for research whose step is still in progress at the horizon, and fails if no marker appears once the horizon passes the completion.
- [ ] Item 3: a test fails if the lower tier is not zero after the research completes, and fails if the summed count drops at any sample.
- [ ] Item 4 (respec 1): a test fails if the first time-triggered men-at-arms step arms at any instant other than its own trigger seconds, if `startedAt` precedes `armedAt`, if `waitBreakdown.resources` differs from `startedAt - armedAt` by more than 1e-3, or if a step is left `waiting`.
- [ ] Item 5: a test fails if a step starting before the earliest depletion differs between the finite and infinite runs, and fails if a depleted node lacks its `node-depleted` warning or an undepleted node has one.
- [ ] Item 6: the three cases hold with only input literals, and a test fails if the depletion row of deposit 2 changes when deposit 1 is made infinite.
- [ ] Every added test has a precondition assertion where its meaning depends on the data (a depletion exists before the compared steps, a research completes within the horizon, the an `idle-arrival` row exists).
- [ ] Nothing outside `acceptance/` changes; no existing test's assertions or expected values change; every test the diff edits or deletes is listed in the implementer's report.
- [ ] `npm run acceptance`, `npm test`, and `npx tsc --noEmit` pass.
- [ ] No INVARIANTS.md regressions

## Open questions

none

## Re-spec 1 - 2026-11-12

- Underspecified: item 4 tested a warning removed from the engine, and item 5 named a Castle landmark step the build lacks (the 681 s value is a time trigger on the first man-at-arms step); the size estimate counted files that do not exist.
- Changed: item 4 moved to Dropped; item 5 (now item 4) restated on the time trigger with a stated tolerance; items renumbered; item 1's key list derives from the schema; size fixed.
- Stands: none of the branch work is relevant; items 1 to 3 and 6 to 8 of the original are unchanged apart from numbering.
