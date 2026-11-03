# SGS-078 spec gate 1

Verdict: READY. Risk tier low confirmed.

Checked against main ee7ecb9: step-timeline.tsx, step-timeline-rows.ts, results.tsx, results.module.css, simulate.ts (LANDMARK_CLASS at line 25, used at 393), schema.ts (BuildOrderCatalog, buildOrderCatalog), engine-common.ts (VILLAGER_ID exported), pages/apps/aoe4-build-order.tsx (has catalog, renders Results at 270), acceptance specs, docs/aoe4-build-order.md, english.json.

## Check results
1 Scope grounded: all named files and functions exist; landmarks.ts is marked new. Villager id is exported as VILLAGER_ID.
2 Criteria testable. Landmark list from the data: abbey-of-kings, berkshire-palace, council-hall, kings-palace, the-white-tower, wynguard-palace. No existing test asserts the old column order except aoe4-build-order.spec.ts:643, which Scope names.
3 No open questions.
4 INVARIANTS: none adjacent, plausible.
5 Contracts: BuildOrderCatalog.landmarks is new and added in Scope. No design doc for this milestone (none yet); no conflict.
6 No dependencies; ~70 LOC.
7 Diagram trigger does not fire.
8 LESSONS: no entry predicts a failure (the layout-rect lesson applies only if a new layout check is written; the legend check should be visibility, not two sequential boundingBox reads).
9-10 Fine; On merge none is right.
11 Risk low: LANDMARK_CLASS is not a listed critical symbol (completeConstruction is not in the list) and the move keeps behavior; no strongModelTriggers hit.
12 Docs: docs/aoe4-build-order.md lines ~888-897 state the column order "Step, Started, Finished, Waited and Blocked by" and "the step's text"; Scope item 6 covers this. No other doc mentions the order.
13 No trust-boundary input.

## Gaps
None blocking.

## Notes (non-blocking)
- Legend: "one-line legend under the caption" cannot sit inside a table between caption and thead. Say it is a div above the table (inside or outside step-timeline-scroll) and allow wrapping (flex-wrap). Six items on one non-wrapping line would overflow 390 px and break the narrow-layout "passes unchanged" criterion.
- Scope names landmarks as "includes abbey-of-kings, council-hall, kings-palace"; the full confirmed list above has six ids (add berkshire-palace, the-white-tower, wynguard-palace) so the unit test is fixed.
- A landmark of a later age than the current one is labelled age-up by the row builder though the engine would not advance (entry.age === state.age check). Acceptable; state it so no one adds an age argument.
- Spec lines needing repoint in timeline-compare.spec.ts: td nth(1)->0, nth(2)->1 at 47-48; nth(4) unchanged at 49 and 57; aoe4-build-order.spec.ts:637 nth(4) unchanged. Grep for other td.nth uses on step-timeline rows before editing.
- Check contrast of --bs-info / --bs-gray-400 border on the yellow table-warning row; the text badge carries the meaning so it is cosmetic.
