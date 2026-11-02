# SGS-046 spec gate 1

Verdict: READY

## Checks
1. Grounded scope: existing files and symbols read on main f078c11 and match the ticket: `validate.ts:62-69` STEP_FIELDS (field lists match exactly), `classifyTech` in `effects.ts`, `parse-text.ts` (all fields have paste grammar, so the table never produces unparsable text), `pages/apps/aoe4-build-order.tsx` (single `text` state, `listBuilds` in getStaticProps), docs Page section at `:553-577`. New files are declared new. Snapshot facts verified against `english.json`: 30 building baseIds; villager `producedBy` = capital-town-center, kings-palace, town-center, which sorts to capital-town-center, town-center (age 1), kings-palace (age 2); capital-town-center makes `scout`, `villager`; default build step 0 is `produce villager` from capital-town-center. Dependency names (`NODE_REFS` 15, `FINITE_NODE_REFS` 13, `ENGLISH`, `editGameData`, `VILLAGER_ID`/`HOUSE_ID`, `formatBuildStep`, `whenever`/`when` grammar) agree with SGS-035/037/040.
2. Criteria: all observable (exact arrays, counts, test ids, text before and after). Bundle criterion (no `byBaseId` in route chunks) is checkable. `engine-common.ts` imports `effects.ts`, which imports `data.ts` as type only, so the model's value import of `VILLAGER_ID`/`HOUSE_ID` does not pull the snapshot into the browser.
3. Open questions: none; design pass 4 decisions folded in.
4. Invariants: A1, A3, S1 named; no contradiction.
5. Contracts: `StepOptions`, defaults, trigger defaults, test ids (`step-field-trigger-count`) match design/M3.md.
6. Dependencies and size: stated; ~330 lines, split line given.
7. Diagrams: flowchart present.
8. Lessons: both LESSONS.md files empty.
9. Decisions: body agrees with design behavior rows (all `step table` rows covered).
10. On merge: none; nothing new for the factory.
11. Risk: high, justified by `lib/**` criticalPaths.
12. Docs: the one stale sentence (`docs/aoe4-build-order.md:555`, "paste textarea", sole grep hit in docs) is in Scope with a grep criterion. No README/ARCHITECTURE mention of the page.

## Notes (non-blocking)
- Criteria reference `changeProducer` by name while Scope says the helpers are "named by the implementer". Suggest naming them in Scope (`changeProducer`, `changeTriggerKind`, `setReaction`, `setNumberField`) so the criteria and SGS-055 line up.
- Selecting the empty option in the `then`, `rally` and `at` selects should delete the field; the ticket implies it but does not say so. Add one sentence.
- Invariants line says the model has "no game number", but `defaultTrigger` carries the UI defaults `atLeast: 100`, `count: 1`, `seconds: 0`, and `defaultStep` uses literal `wood`. They are design-fixed defaults, not game data; reword to "no game rate, cost or time".
- Unknown-values criterion says "a tech the options do not list" without a concrete id; name one (for example `research not-a-tech`).
