# SGS-077 spec gate 1

Verdict: NEEDS_SPEC. Risk: the ticket says standard; the gate says high.

Checked against main ee7ecb9.

## Gaps

1. Risk - understated. `simulateBuildOrder` is a REPO.md criticalPaths symbol, and this ticket changes what it samples and returns (new `gathered` series). It also adds a field to the public simulate response, which the "changes an existing public schema, API request/response" trigger covers. The ticket's own note says "no existing field or behavior changes", but the return shape of the listed symbol does change. Fix: set `Risk: high` and update the comment. Additive-only is a defensible counter-argument, so the manager may overrule, but the template rule says to go high.

2. Scope 4 / criterion 6 - old stored pin. `pin-storage.ts` stores only `{version, name, text, durationSeconds}`. The pinned result is re-simulated from text, so a stored result without `gathered` cannot exist. The scenario is impossible, the "check pin-storage.ts ... PR says which" instruction asks the implementer to guess, and the criterion cannot be tested. Fix: delete the old-pin paragraph and criterion 6. Replace with "the pinned overlay uses the pinned run's re-simulated `gathered`".

3. Scope 5 unit test - the "grows by `gatherRates/60*dt`" assertion. `gatherRates` is sampled at the sample instant, but the rate can change between samples (a villager spawns, a node runs out). The test fails on the default build. Fix: name the fixture, for example a build with no steps in the window, or assert only on intervals where `gatherRates` is equal at both ends. Also say "no node runs out" means `depletions` is empty. The weaker floating-bound fallback is fine, but pick one: no per-kind spend total exists (`spent` is by category), so state the weaker bound as the assertion.

4. Scope 3 / Docs - stale docs are not all listed. Besides lines ~663, ~710 and ~764 of `docs/aoe4-build-order.md`, two more places become untrue:
   - line 12 overview ("series ... gather rates, floating resources");
   - the chart table at ~865-870, which says "A 200 draws three line charts" and has one row per chart.
   Fix: add both to Scope. Add a table row, "Gathered resources | food, wood, gold, stone | Food, Wood, Gold, Stone", and change "three" to "four".

5. Scope 3 - OpenAPI. `docs/api/openapi.json` has an example response containing `floating` (~line 351). The implementer must add `gathered` there too, or the example no longer matches the schema. Fix: name the example in Scope. Also state the schema location (`SimulationResult.properties.gathered`, ~line 1724) and the `required` list (~line 1635).

6. Test fixtures - adding a required field to `SimulationResult` breaks typecheck in typed fixtures such as `components/apps/aoe4-build-order/result-series.test.ts` `result()`. Fix: add to Scope "update `SimulationResult` fixtures in tests".

7. Scope 4 / 5 - chart placement and existing tests. Scope calls the chart "fourth" but places it second-from-last, between "Gather rates" and "Floating resources". `acceptance/aoe4-build-order-pin-compare.spec.ts` (`CHART_IDS`, "all three charts") and `aoe4-build-order-m3-flow.spec.ts` (`RESOURCE_CHARTS`) enumerate the charts. Per the rule on behavior existing tests assert, Scope should say whether those lists get the new id or stay as is. Criterion 7 ("no expected test value changes") should be reconciled with that. Fix: state "add `chart-gathered-resources` to `RESOURCE_CHARTS` and `CHART_IDS` in those specs" or "leave them", and fix the "fourth" wording.

8. Invariants field. It says "A3-style determinism" and S3 only. Name A3 explicitly. A2 is also adjacent, since `creditIncome` credits `engine.resources` and the new counter must not alter that. Add A2 and "unchanged".

## Checked and fine

- Grounded scope: `creditIncome` is at simulate.ts:706 and is the only gather credit; the only other `resources +=` site is the stocked branch (713) inside it. `floating` sampling is at 961. `model.ts:123` has `floating`. `results.tsx` has `resourceSeries`, `SeriesChart` and the pinned overlay.
- `schema.ts` does not describe the result, so "update if it describes" is a no-op. Say so.
- `gathered` belongs on `Engine` or `EngineState` (simulate.ts:68 or 126); `createEngine` initialises it at ~790.
- No open questions, no CONTEXT.md Decisions conflict, no LESSONS entries predict a failure here.
- Size is well under 400 lines.
- Diagrams: the trigger does not fire.
- On merge: none is correct.
- Input validation: no new input.
- Gaps 1-8 are all closable by the ticket agent; none needs the owner.

## Notes

- The "fourth `SeriesChart`" wording is the count in the code (units, gather rates, floating plus the new one), but the chart sits third in order. See gap 7.
- The narrow-layout spec should be run after the change. The ticket already says so.
