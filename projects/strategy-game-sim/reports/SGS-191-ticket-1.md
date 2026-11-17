# SGS-191 ticket report

File: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-191-unit-line-data-in-result.md`

Summary: "Add `lineName` to unit series and `unit` to upgrade markers in the result" (Feature, M11, aoe4-build-order, risk standard, about 60 business-logic lines, Depends on none, On merge none). Scope: `model.ts` types, new `unit-lines.ts` `unitLineName`, `unitSeries` in `simulate.ts` (name from all data unit entries of the baseId), `researchMarker(entry, at, unit?)` in `markers.ts`, the `researchItem` call in `research.ts`, OpenAPI `UnitSeries`/`ChartMarker` plus 200 examples, format-doc sentences, and consumer fixes (`result-series.test.ts` fixtures, the two exhaustive key records in `aoe4-simulate-api-contract.spec.ts`). Criteria cover the every-baseId loop plus design samples, empty-suffix fallback and whole-word cases, equal `lineName` per baseId (including a run producing only the lowest tier), `unit` present iff in `upgradeTargets` (looped over every key, key absent not undefined), contract spec, and no other result change.

Diagrams: none (single-component, outside the control loop).
Open questions: none.
Overlap: none. `research.ts` and `model.ts` are shared with B and D in different functions and types; `openapi.json` in separate schemas.
Notes: `git fetch origin` printed a ref-lock error for `origin/code-factory-state` only; `origin/main` was at 87f0cd7 as planned. Lint passed with no output. No scratch checkout was made; I ran no mutation or command criteria, since all criteria are tests.
