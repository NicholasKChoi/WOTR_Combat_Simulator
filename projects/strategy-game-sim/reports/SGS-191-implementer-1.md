# SGS-191 implementer report 1

Ticket SGS-191, branch `sgs-191-unit-line-data`, tip `2b3eccf5f9fe7ad8dce13e2c04417055db5965b0`, base origin/main 87f0cd7.
Checkout: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-191-unit-line-data`

## Files
- `lib/aoe4-build-order/unit-lines.ts` (new): `unitLineName`.
- `lib/aoe4-build-order/model.ts`: `UnitSeries.lineName`, `ChartMarker.unit?` with comments.
- `lib/aoe4-build-order/markers.ts`: `researchMarker(entry, at, unit?)`, key set only when given.
- `lib/aoe4-build-order/research.ts`: passes `upgradeTargets.get(baseId)?.value`.
- `lib/aoe4-build-order/simulate.ts`: `unitSeries` sets `lineName` from all `type: 'unit'` entries of the baseId.
- `docs/api/openapi.json`, `docs/aoe4-build-order-format.md`: fields and rules; both 200 examples gain `lineName` (no example marker is an upgradeTargets research).
- `acceptance/aoe4-simulate-api-contract.spec.ts`: exhaustive key records gain `lineName` and `unit` (not run).
- `components/apps/aoe4-build-order/result-series.test.ts`: fixtures gain `lineName`.
- Tests: `unit-lines.test.ts` (new), `markers.test.ts`, `research.test.ts` (new describe `unit series lineName`).

## Tests
Full `npm test`: 2627 passed, 15 skipped, 0 failed. Targeted three files: 81 passed.
Invariants encoded: line name is a non-empty whole-word suffix of every tier for every English unit baseId; design samples; fallback to lowest-age name regardless of order; whole-word only; lineName equal across tiers and full-line when only tier 1 produced (`man-at-arms-1` "Vanguard Man-at-Arms" -> "Man-at-Arms"); `unit` equals target for every English `upgradeTargets` key run through the engine, key absent (not undefined) otherwise and on age-ups.

Pre-existing tests edited: `result-series.test.ts` fixtures (two literals gain `lineName`), allowed by the Scope consumer rule. No assertions changed.

## Mutation checks (each undone, tree verified clean afterward)
- `unit-lines.ts` lowest-age reduce -> `best`: fallback and whole-word tests failed (`expected 'Elite Archer' to be 'Rider'`).
- `split(' ')` -> `split('')`: the whole-word suffix loop and sample tests failed.
- `markers.ts` `if (unit !== undefined)` -> `if (true)`: `'unit' in marker` false-assertions failed.
- `markers.ts` `marker.unit = marker.kind`: failed `early-men-at-arms: expected 'unit-tier' to be 'man-at-arms'`.
- `research.ts` arg -> `undefined`: failed `early-men-at-arms: expected undefined to be 'man-at-arms'`.
- `simulate.ts` byBaseId -> `[entry]`: lineName tests failed (`Hardened Spearman` vs `Spearman`).

## Doc claims
- format doc `unitsProduced`: "`lineName` is the display name of the whole unit line, equal for every series of one `baseId` whichever tiers the run produced: the longest run of whole words (split on single spaces) that ends the name of every tier of that `baseId`, else the name of its lowest-age entry" (`unit-lines.ts:unitLineName`, `simulate.ts:unitSeries`); examples match English data names.
- format doc `markers`: "`unit` ... set whenever the researched tech is a unit upgrade of the civ data (whatever its `kind`); it is absent on `age-up` markers and on every other research" (`research.ts:researchItem`, `markers.ts:researchMarker`).
- OpenAPI field descriptions say the same.

## Build, lint
`npx tsc --noEmit` clean, `lint:dup` 0 clones, `next build` succeeded. No codegen configured. The `aoe4-simulate-api-contract` acceptance spec was not run (acceptance-gate owned); only its key records were updated.

## Invariants
A3: fields derive from data and run only. A1: line name comes from data entry names, no literal in code. No regressions seen.

## Unverified assumptions added
None. Out-of-scope findings: none.

Status: needs_review
