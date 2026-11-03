# SGS-077 spec gate 2

Verdict: READY. Risk high matches the template (criticalPaths symbol `simulateBuildOrder` changes what it returns, plus a public response field).
Checked against main ee7ecb9.

## Gaps 1-8 from gate 1

1. Risk: closed. `Risk: high` with an accurate comment.
2. Old-pin case: closed. Paragraph and criterion deleted; Scope 5 says the pinned overlay uses the re-simulated `gathered`.
3. Unit test soundness: closed. Constant-rate fixture (paused TC, INFINITE_NODES, premise asserted via `depletedAt === null` and zero spend) plus a sum identity and per-kind bound on `listBuilds()`. The `depletedAt === null` wording is right: `depletions` has one entry per run ref and is never empty. `listBuilds`, `INFINITE_NODES`, `pauseTownCenter` (in simulate-series.test.ts) and `ENGLISH.civData.startingState.resources.value` all exist.
4. Docs: closed. Lines 12, 663, 710, 763-764 and 866-872 of `docs/aoe4-build-order.md` are all named. A grep for "floating" found no other stale doc outside openapi.json.
5. OpenAPI: closed. `required` (~1635), `properties` (~1724), the 200 example (~351) and the version bump are named. The note to copy the example from a real response is correct.
6. Typed fixtures: closed. `result-series.test.ts` `result()` and the contract spec's `Record<keyof SimulationResult, true>` are named, with a catch-all for any other fixture tsc flags.
7. Chart lists and placement: closed. I confirmed every enumerating site: `CHARTS` (aoe4-build-order.spec.ts:12), the yLabels map (:365), the literal loop (:66), `CHART_IDS` and `RESOURCE_CHARTS` (pin-compare:10-11, title at :56) and `RESOURCE_CHARTS` (m3-flow:10). The other `CHARTS` loops pick up the new id automatically. "Four in all, third on the page" is consistent.
8. Invariants: closed. A2 unchanged, A3 and S3 are named, and their reasoning is sound.

## New text checks

No new gaps. Open questions: none. Contracts match (`gathered` is `Record<ResourceKind, number[]>` after `floating`). Size is about 30 lines. No LESSONS entry is hit, and the Playwright lesson applies only to layout reads. Input validation: no new input. On merge none is correct. The diagram trigger does not fire. The exact-position edits in Scope are all grounded in code that exists.

## Notes (non-blocking)

- The y-label test in `acceptance/aoe4-build-order.spec.ts` (~365-380) checks that tick values do not overlap the y label, and special-cases the floating chart for 4+ digit ticks. The new chart on `start -> sheep` at 3600 s may have different tick widths. If that test fails at the new chart, the implementer should fix the chart's margin, not loosen the assertion.
- SGS-076 also edits `results.tsx`; whichever lands second rebases, as the ticket says.
