# SGS-191 review 1

Branch `sgs-191-unit-line-data`, tip `2b3eccf5f9fe7ad8dce13e2c04417055db5965b0`, diff `origin/main...HEAD` (one commit, 12 files). Full review (not delta).

**Verdict: APPROVE**

## Blocking findings

None.

## Spec gaps

None.

## Acceptance criteria

1. `unitLineName` English loop + design samples: **pass**. `lib/aoe4-build-order/unit-lines.test.ts:26-45` groups every `type: 'unit'` entry of `ENGLISH.byId` by `baseId`, asserts the data condition (`size > 5`), and checks for each line a non-empty result that is a whole-word suffix (`' ' + name` ends with `' ' + line`) of every tier name. The `it.each` table pins all five samples. Checked against the snapshot: spearman tiers are Hardened/Veteran/Elite Spearman, man-at-arms Vanguard/Early/(bare)/Elite Man-at-Arms, so the samples fail under a lowest-tier-name or per-produced-tier implementation.
2. Fallback and whole-word cases: **pass**. `unit-lines.test.ts:47-55`: entries out of age order (`Elite Archer` 4, `Rider` 2, `Hardened Scout` 3) expect `Rider`, which fails for first-entry, last-entry or highest-age picks; `Xspearman`/`Spearman` expect the lowest-age name in both age orders, which fails for a character split (common character suffix is `pearman`). Implementer mutation record matches.
3. `lineName` equal across tiers, full-line name with only the lowest tier: **pass**. `research.test.ts:150-169`: a spearman run converted by `veteran-spearmen` asserts the two series exist (`spearman-2`, `spearman-3`) and both carry `Spearman`; a man-at-arms-only run asserts `man-at-arms-1` / `Vanguard Man-at-Arms` / `Man-at-Arms`, which fails if the name came from produced tiers only.
4. `researchMarker` sets `unit` exactly when given: **pass**. `markers.test.ts:129-165` runs every English `upgradeTargets` key through the engine at age 4 (asserting `completed`) and checks `unit` equals the target; `steeled-arrow` (asserted not in `upgradeTargets`, kind `blacksmith`) and the age-up marker are checked with `'unit' in`, which fails for an `undefined`-valued key or a kind-derived value; a direct `researchMarker` call checks both arities.
5. OpenAPI and contract spec: **pass (by reading; acceptance not run by this gate)**. `UnitSeries` lists `lineName` in `required` and `properties`; `ChartMarker` adds optional `unit`; both 200 examples with a `unitsProduced` entry gain `lineName`; the only example markers are `survival-techniques` (economy) or empty, so no example needs `unit`. `acceptance/aoe4-simulate-api-contract.spec.ts:492,507` key records gain `unit` and `lineName`.
6. Existing result fields unchanged: **pass**. Only additive fields; `unitSeries` order/sort and counts untouched; `compareMarkers` untouched. Pre-existing test edits are the two `result-series.test.ts` fixture literals and the contract key records, both named by the Scope consumer rule; no assertion changed. Full `npm test`: 84 files passed, 2627 tests passed, 15 skipped (run by me).
7. Format doc sentences: **pass**. `docs/aoe4-build-order-format.md:360-369` (`lineName` rule) and `:402-409` (`unit` set for unit upgrades whatever the kind, absent on age-ups and every other research).
8. No invariant regressions: **pass** (below).

## Invariants touched

- A1: holds. The line name is derived from snapshot entry names; no literal in code.
- A2: not affected (no spend path changed).
- A3: holds. `byBaseId` tiers are sorted by age at load; `unitLineName` is pure and ties resolve to the first entry deterministically; no randomness or clock.
- S1-S3, W*, H*: paths not touched.

## Spec checklist

- Contracts: `lineName`, `unit`, `unitLineName`, `researchMarker(entry, at, unit?)` match design M11 C3, C4, C7b and the Modules table exactly.
- Scope: no UI, `result-series.ts`, `valueAt`, `docs/aoe4-build-order-ui.md`, or marker sort change; nothing under `golang/`.
- No open question; no invented constant.
- Naming: intent-stating; no enum changes.

## Linter

`npx tsc --noEmit` clean; `npm run lint:dup` 0 clones (161 files). `npx next build` succeeded.

## Bot reconciliation

No `reviewBot.cli` or `rulesFile` configured; section skipped.

## Conventions

- `unit-lines.ts` follows `production-buildings.ts` (small pure module, one-line JSDoc with `(Outputs)` tag, 2-space style). Field comments in `model.ts` use `//` like `SimInputs` fields at `model.ts:95-102`.
- `unit-lines.test.ts` uses a local `SnapshotEntry` builder; `test-helpers.ts` exports none and `markers.test.ts:9-19` also builds its own, so this matches nearby practice. No exemplar covers lib unit tests.
- Test-each/table use matches siblings (`markers.test.ts:21-29`).

## Correctness

- `markers.ts:20-26`: key assigned only when `unit !== undefined`; correct, matches C3 "absent".
- `research.ts:27`: looked up by `entry.baseId` (upgradeTargets is keyed by baseId), correct.
- `simulate.ts:986`: computed from all `type: 'unit'` entries of the baseId, so equal across series of one line.
- `unit-lines.ts`: loop bounds correct (`shared < shortest`), compares from the end; returns `words[0]` suffix which equals every entry's suffix by construction.

## Non-blocking notes

- `docs/aoe4-build-order-format.md:367`: the example lists `Hardened Spearman`, `Veteran Spearman` but omits `Elite Spearman`, while the Man-at-Arms example lists all four tiers. True as written; adding `Elite Spearman` would make the two examples consistent.
- `docs/aoe4-build-order-format.md:407-408` and the OpenAPI `unit` description say "a unit upgrade of the civ data". The engine uses `upgradeTargets` keys. In English data, `upgrade-king-3`/`-4` are class `scar_unit_upgrade` (so `unit-tier` kind) but not in `upgradeTargets`; they have no producer, so they never complete and no contradiction is observable today. Naming `upgradeTargets` in the sentence would remove the ambiguity.
- `simulate.ts:986`: the `?? []` fallback is unreachable (the entry is in its own `byBaseId` list) and would make `unitLineName` throw on an empty `reduce` if ever reached. Harmless today.

## Coverage

Reviewed every file in the diff: `lib/aoe4-build-order/{unit-lines,markers,model,research,simulate}.ts`, the three test files, `components/apps/aoe4-build-order/result-series.test.ts`, `acceptance/aoe4-simulate-api-contract.spec.ts`, `docs/api/openapi.json`, `docs/aoe4-build-order-format.md`. Checked consumers of `ChartMarker`/`UnitSeries` (`line-chart.tsx`, `chart-rows.ts`, acceptance specs with exact marker assertions) for breakage: none, as the fields are additive and no exact assertion covers an `upgradeTargets` research.
UI inspection did not run: the diff changes no UI (engine, types, docs, tests only). REPO.md "load each touched page" step: no page touched. Acceptance specs were not run (not this gate's role). LSP not available; callers found by grep.
