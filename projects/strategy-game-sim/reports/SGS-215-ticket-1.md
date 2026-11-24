# SGS-215 ticket author report 1

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-215-production-past-population-cap.md
Branch to name: sgs-215-production-past-population-cap. Base origin/main 7d74800.

## Summary

"Let production continue past the population cap", Feature, component aoe4-build-order, milestone M13, Risk high (simulation rules, `simulate.ts` critical path), no dependencies. About 40 lines of business logic: export `hasPopulationRoom(state, popcap)` (design C1), move `populationCapReachedAt` from `Engine` to `EngineState`, `noteCapReached` takes `EngineState`, and replace the two inline gates (`produce` handler, `payOrder`). Also covers the Spear/Longbow build retune (D7), the tests the change moves, and the engine doc, format doc, OpenAPI description and data README fixes (C5).

Criteria cover:
- both gates;
- the pre-cap rule, including the D1 case where supply is at the cap but the spawned population is not;
- the lift with a lowered `maxPopCap`;
- the "set but supply below cap" case;
- the same-instant ordering;
- no `population` wait after the lift;
- the villager rules (D11);
- the ENG 1TC 1060 s and 1090 s digests with a `null` precheck;
- unchanged results before the cap for every prebuilt build;
- the retuned build passing the builds bar;
- the field move and the typecheck;
- `maxPopCap` read from data;
- the docs and the OpenAPI descriptions, with `info.version` unchanged.

## Probe (scratch checkout, removed)

I applied the engine change in a scratch checkout of origin/main and ran the AoE4 unit tests. Nine failures in 5 files:
- `builds.test.ts`, 3 Spear/Longbow tests: `idle-arrival` at 1800 s and at 3600 s, and the gold run-out moving from 1206.874 to 1204.848 s.
- `simulate-construction.test.ts`, 2 tests: the villager count 23 becomes 45 under `maxPopCap` 30.
- `simulate-house-gate.test.ts`, 2 digests.
- `research.acceptance.test.ts`: 71 becomes 143 tier-3 longbowmen.
- `simulate.test.ts` "exports exactly the seam names": it pins the export list and the count 15. The design and plan did not list this one. The ticket covers it.

`acceptance/aoe4-simulate-api-spend-population.spec.ts` also asserts that the last `spawnedPopulation` equals 200 at 1800 s. The ticket covers it. I did not run acceptance specs.

One retune probe is ruled out and recorded in the ticket: adding `rally` reactions to `gold#2` after the `depleted gold` trigger leaves the same three failures. The retune approach is left to the implementer.

## Other checks

- OpenAPI `info.version` 2.7.0 is pinned by four acceptance specs, so the ticket says no bump.
- `ticket-lint.py --spec`: exit 0, no warnings, after I fixed the `Invariants` naming and replaced the `design/M13.md` and plan path mentions with prose.
- Scratch checkout `ticket-SGS-215` removed.

## Diagrams

One Mermaid flowchart (read, act, record phases for the production gate).

## Open questions

none (no `owner` or `designer` questions).

## Overlap

- SGS-216 (chart): none. It touches `chart-markers.ts`, `result-series.ts`, `line-chart.tsx`, `chart-layout.ts`, `results.tsx`, the UI doc, page help and ARCHITECTURE.md; this ticket touches none of them.
- No other open ticket changes the code this one touches, and none deletes it.

## Proposed docs item

Not applicable (Feature).
