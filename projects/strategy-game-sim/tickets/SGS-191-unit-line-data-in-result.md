# SGS-191: Add `lineName` to unit series and `unit` to upgrade markers in the result

- **Type**: Feature
- **Component**: aoe4-build-order
- **Milestone**: M11
- **Priority**: medium
- **Risk**: standard
- **Invariants**: A3 (the new fields are derived from data and the run, no randomness or clock); A1 (the line name comes from data entry names, no literal in code)
- **Unverified assumptions**: none
- **LOC estimate**: 60 (new `unit-lines.ts` about 20, `markers.ts` and the `research.ts` call about 10, `unitSeries` in `simulate.ts` about 10, `model.ts` types about 10; tests, OpenAPI and docs excluded)
- **Depends on**: none
- **On merge**: none
- **Source**: `design/M11.md` C3, C4, C7b (the `ChartMarker.unit` and `UnitSeries.lineName` parts), M11.2 engine half; `plans/M11-20261116.md` outline C

## Context

The M11 Units chart draws one line per unit line (all tiers of one `baseId` summed) with a dot where each
veterancy upgrade of that line finished. The UI half needs two engine facts that the result does not carry
today: a display name for the whole line (`UnitSeries.name` is per tier, e.g. `Veteran Spearman`) and, on a
research marker, which unit line the upgrade targets (`ChartMarker.label` is only the tech `baseId`). This
ticket adds both as additive result fields and OpenAPI schema fields. The page does not read them yet.

## Scope

- `lib/aoe4-build-order/model.ts`: `UnitSeries` gains required `lineName: string`; `ChartMarker` gains
  optional `unit?: string`. Doc comments say what each means (C3, C4).
- New `lib/aoe4-build-order/unit-lines.ts` exporting `unitLineName(entries: readonly SnapshotEntry[]): string`
  per design C4: the longest run of whole words (split on single spaces) that ends every entry's `name`; when
  that run is empty, the `name` of the lowest-age entry. Pure, no new data file (A1).
- `lib/aoe4-build-order/simulate.ts` `unitSeries`: every `UnitSeries` carries `lineName`, computed from all of
  the civ data's `type: 'unit'` entries of that `baseId` (`engine.data.byBaseId`), not only the tiers that were
  produced, so it is equal for every series of one `baseId` whatever the run produced. Series order and every
  existing field are unchanged.
- `lib/aoe4-build-order/markers.ts` `researchMarker(entry, at, unit?: string)`: sets `unit` on the marker only
  when `unit` is given (the key is absent otherwise, not `undefined`).
- `lib/aoe4-build-order/research.ts` `researchItem`: passes `state.data.upgradeTargets.get(entry.baseId)?.value`
  to `researchMarker`. This is a different function from the ones the busy-building tickets edit.
- `docs/api/openapi.json`: schema `UnitSeries` adds required `lineName` (string); schema `ChartMarker` adds
  optional `unit` (string); every 200 example that carries `unitsProduced` entries gains `lineName`, and any
  example marker of an `upgradeTargets` upgrade gains `unit`. Descriptions say what the fields mean.
- `docs/aoe4-build-order-format.md`: the `unitsProduced` and `markers` result sentences name `lineName` and
  `unit` and their rules (the markers sentence currently lists the marker as `kind`, `label`, `at`; the
  `unitsProduced` sentence lists the series fields).
- Consumers that must follow the new types (rule, not a closed list): every unit test or acceptance helper that
  builds a `UnitSeries` literal gets `lineName` (example: `components/apps/aoe4-build-order/result-series.test.ts`
  fixtures); the exhaustive `Record<keyof UnitSeries, true>` and `Record<keyof ChartMarker, true>` in
  `acceptance/aoe4-simulate-api-contract.spec.ts` gain the new keys. Existing tests otherwise keep their
  expected values: the search found no test that asserts the absence of these fields, and the marker specs'
  exact-marker assertions (example: `acceptance/aoe4-simulate-api-markers.spec.ts`) cover techs outside
  `upgradeTargets`, so they stay unchanged.

**Out of scope:** any UI change (Units chart lines, dots, `result-series.ts`, `valueAt`); `StepTiming` and wait
details; removing `unitSeries` in the UI; `docs/aoe4-build-order-ui.md`; marker kinds or `compareMarkers`
order (the new field does not take part in the sort); the pinned-run storage (it stores no result).

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [ ] `unitLineName` has a test that loops over every English unit `baseId` (group the data's `type: 'unit'`
  entries by `baseId`) and checks the rule for each: the result is non-empty and is a whole-word suffix of every
  entry's `name`. The test also pins the design's samples: `spearman` gives `Spearman`, `man-at-arms` gives
  `Man-at-Arms`, `longbowman` gives `Longbowman`, `knight` gives `Knight`, `villager` gives `Villager`.
- [ ] `unitLineName` has a case for the empty common-suffix fallback (hand-built entries sharing no final word
  return the lowest-age entry's `name`, with the entries given out of age order) and for a suffix that is not
  whole-word (names ending `Xspearman` and `Spearman` do not share `spearman`). A test fails if the function
  splits on characters instead of words, or takes the first entry instead of the lowest-age one.
- [ ] In a simulation result, every `UnitSeries` has a `lineName`, and the series of one `baseId` all carry the
  same value, including when the run produced only one tier of that line. A test runs a build that produces
  a unit and converts it to a higher tier (the existing veterancy tests are a model) and checks both properties,
  and checks that a run which produced only the lowest tier still gets the full-line name (a name taken from the
  produced tiers alone would be wrong for a line whose tier-1 name has a prefix, e.g. `man-at-arms`).
- [ ] `researchMarker` sets `unit` exactly when it is given one, and the key is absent otherwise. A test loops
  over every key of the English `upgradeTargets` and runs the research for it through the engine: the marker's
  `unit` equals that key's target `baseId` whatever the marker's `kind`; and a research that is not in
  `upgradeTargets`, plus every age-up marker, has no `unit` key (a test fails if `unit` is `undefined`-valued
  rather than absent, or if it is set from the marker kind).
- [ ] The simulate response validates against `docs/api/openapi.json` with the new fields: the
  `aoe4-simulate-api-contract` acceptance spec passes with `lineName` required on `UnitSeries`, `unit` allowed on
  `ChartMarker`, and the exhaustive key records updated. Every 200 example in the spec that shows a
  `unitsProduced` entry shows `lineName`.
- [ ] Sample times, series order, counts, marker order, step timings and every other existing result field are
  identical to the base for the same input: the pre-existing unit tests keep their assertions apart from the
  literal-fixture additions named in Scope.
- [ ] The format doc's `unitsProduced` and `markers` sentences describe `lineName` and `unit`, including that
  `unit` is absent for age-ups and for researches outside the unit upgrades.
- [ ] No INVARIANTS.md regressions

## Open questions

none
