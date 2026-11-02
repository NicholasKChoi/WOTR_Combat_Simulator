# SGS-044 spec gate 3

Verdict: NEEDS_SPEC (one gap, found by checking the whole ticket, not by the item 8 edit).

Checked against origin/main 2049e95 and branch sgs-037-aoe4-node-refs-warnings-depletion-module (7db2324).

## Gaps

1. Scope item 8 / acceptance "no other test edits" - `acceptance/aoe4-simulate-api-edges.spec.ts` lines 47-49 ("result shape" > "a villager-only order returns every result field...") pins the exact response key list
   `['ages','civ','durationSeconds','floating','gatherRates','notes','sampleSeconds','steps','times','unitsProduced']`.
   Adding `markers` to the response makes it fail in `npm run acceptance`. The ticket does not list it, and its criterion says only the named test edits are allowed, so an implementer either breaks the suite or guesses.
   SGS-037 hit the same thing (its Scope lists this test for `depletions` and `warnings`). Fix: add to item 8 "`aoe4-simulate-api-edges.spec.ts`: the pinned key list gains `markers`; no other assertion changes", and add that file to the allowed-edit list in the "adds nothing else" criterion and to Out of scope's exception list. Not owner-only.

## Verification of the item 8 claims

- model.ts-exports test (`data.acceptance.test.ts:310-337`): on main it is "exactly the 19 documented types and the two shared lists" with runtime list `['GATHER_NODES','RESOURCE_KINDS']`. The SGS-037 branch tip leaves it unchanged, even though that branch's model.ts already adds 8 types and 6 runtime exports, so the test fails on that branch tip today. SGS-037's own ticket (respec 2, line 57) assigns the edit: rename to 27 types, runtime list `GATHER_NODES, RESOURCE_KINDS, FINITE_GATHER_NODES, MAX_DEPOSITS, NODE_REFS, FINITE_NODE_REFS, nodeKindOf, SEVERITIES`. So item 8's "relative to the base, SGS-037 leaves it pinned, no hard total" is consistent. SGS-044 adds 2 types and appends/inserts 2 runtime names in model.ts source order. The runtime regex is `^export (?:const|function|class|enum)` at column 0, so `CHART_MARKER_KINDS` and `AGE_NAMES` must be plain `export const`. The type list is sorted, so insert `ChartMarker`, `ChartMarkerKind` alphabetically. The test uses a sorted-names `toEqual`, so the "N" in the name is cosmetic; ok.
- Contract spec `simulationResult: Record<keyof SimulationResult, true>` (main line 336): `markers: true` is required or tsc fails. Confirmed.
- RESPONSE_SCHEMAS and SHARED_SCHEMAS (main lines 61-62): these lists drive (a) existence check, (b) for RESPONSE: closed `additionalProperties:false`, `required` equal to all properties minus an `optional` map, and (c) on the SGS-037 branch, a description on every property. Putting `ChartMarker` in RESPONSE and `ChartMarkerKind` (a plain enum) in SHARED is correct; an enum in RESPONSE would fail the closed check. Consistent.
- `typeKeys` entry: `keys()` sorts both sides, so a `chartMarker: Record<keyof ChartMarker, true>` literal (`kind,label,at`) plus a `ChartMarker: chartMarker` map entry is checked against `schemas.ChartMarker.properties`. Consistent. The ticket says "a `chartMarker` key literal" and "as SGS-037 does for NodeDepletion"; it should also say the map entry `ChartMarker: chartMarker` (an implementer would add it, minor). The schema-list and typeKeys edits are not strictly required for tsc (only the `markers: true` key is), but they are the contract spec's coverage of the new schemas; keep them.

## Other checks (whole ticket)

- Grounded scope: `simulate.ts` (`ages.push` main:298, `createEngine` ages at 598, return `ages: engine.ages` 667), `research.ts` `researchItem` (`researched.add` main:22), `result-series.test.ts` literal, openapi `ages` example (main:440) and `SimulationResult` required (main:1410) all exist. Line numbers in the ticket (`model.ts:80`, `simulate.ts:333`, `research.ts:27`) are off on main (102, 298, 22) but each is also named by symbol; non-blocking.
- Item 7 claim holds: the only typed `SimulationResult` literal outside lib is in `result-series.test.ts`.
- Criteria testable; open questions none; contracts match design names; deps (SGS-041) stated; size ~70 lines; diagram present; docs item 6 present.
- Risk: `simulateBuildOrder` (a criticalPaths symbol) gets a new return field and `completeConstruction` a push, but no decision, ordering or signature of the event loop changes. `standard` stays defensible, as earlier gates accepted.

## Notes

- openapi `ChartMarker` properties and `SimulationResult.markers` need `description` strings: on the SGS-037 branch the contract spec asserts a description on every property of REQUEST and RESPONSE schemas. Scope item 5 does not say so; add "each property has a description".
- Update stale line numbers or drop them.
