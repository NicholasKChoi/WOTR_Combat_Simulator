# SGS-046 implementer 1

Branch sgs-046-aoe4-step-table-editor, tip 4652ca9e0836fd7bc706b4cf4cc10904c3f5ac38 (base origin/main 835aceb).
Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-046-aoe4-step-table-editor

Files
- lib/aoe4-build-order/step-options.ts: StepOptions, stepOptions(data) (pure, age-then-baseId order, plain arrays/records).
- lib/aoe4-build-order/step-options.test.ts: constants, counts, ordering, classifyTech filter (editGameData), determinism, JSON round trip.
- components/apps/aoe4-build-order/step-table-model.ts: defaultStep/defaultTrigger, insert/delete/move/replaceStep, changeAction, changeProducer, changeTriggerKind, setReaction, selectChoices, setNumberField, setTriggerNumber (trigger numeric fields), withoutField.
- components/apps/aoe4-build-order/step-table-model.test.ts: 41 tests incl. per-action default validate/round-trip, edit round trip through text.
- components/apps/aoe4-build-order/step-table.tsx: StepTable with test ids, draft number inputs, unknown option choices.
- pages/apps/aoe4-build-order.tsx: options in PageProps/getStaticProps, parsed useMemo, StepTable or step-table-unavailable. BuildInput unchanged.
- docs/aoe4-build-order.md: Page section describes the step table ("paste textarea" now 0 matches).

Tests: step-options 7 + model 41 pass; full `npm test` 39 files / 1037 tests pass.
Pre-existing tests edited: none.
Acceptance specs not authored (separate gate owns them). Ran existing aoe4 specs (36 pass), plus a throwaway Playwright spec (deleted, not committed) covering load rows, clear x3, add, invalid draft + blur, reaction uncheck, unknown options, unavailable notice, no POST from buttons: pass.

Mutation checks (each failed, then reverted): changeAction drop trigger / drop reaction / same-action no-op; changeProducer unit rule; leaving depleted keeps reaction; same-kind no-op; setReaction false stores key; empty required field; negative accepted; all accepted outside move.count; moveStep one-end check; insertStep bound; non-integer index; selectChoices undefined; defaultTrigger out of bounds; stepOptions skip classifyTech; producers not filtered to buildings; no baseId tiebreak; min->max age.

Gates: tsc --noEmit clean; lint:dup 0 clones; next build ok; import grep for data/validate/simulate in model/table empty; no "byBaseId" in .next/static.

Decisions / notes
- `producers` is filtered to building baseIds: the snapshot lists wynguard-army/footmen/raiders/rangers as producedBy of units; they are not buildings.
- `changeProducer` keeps the unit when the new producer lists no units at all.
- Trigger numeric fields use `setTriggerNumber` (extra export); `setNumberField(step, field, text)` is 3-arg, optionality derived (only move.count is required among step fields).
- tsc is non-strict here, so the page uses `parsed.ok === true` for narrowing.

Invariants: A1 (only literals: VILLAGER_ID, HOUSE_ID, 'wood', 100/1/0 defaults), A3 (pure), S1 upheld.

Out-of-scope findings: none.
Status: needs_review
