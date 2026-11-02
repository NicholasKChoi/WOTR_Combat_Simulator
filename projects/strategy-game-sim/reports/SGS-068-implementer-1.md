# SGS-068 implementer report 1

Status: needs_review
Branch: sgs-068-aoe4-step-table-polish (from sgs-059-aoe4-page-posts-build-order 41e648d)
Tip: 63cdd045e6f4d99f350a6f08274000784ee1cb8c
Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-068-aoe4-step-table-polish

## Files
- components/apps/aoe4-build-order/step-table-model.ts: FIELD_LABELS, TRIGGER_KIND_LABELS, ACTION_LABELS, nodeLabel, optionLabel, hasOptionalField, start edits (startPairs, setStartRally, setStartCount, setStartNode, addStartPair, firstUnusedStartNode, deleteStartPair).
- components/apps/aoe4-build-order/step-table.tsx: labels, option text, step-more disclosure (per-row state, reset on row-count change, collapsed on action change), icon buttons with aria-labels, StartRow replacing the pre, CSS module.
- components/apps/aoe4-build-order/step-table.module.css (new): top-aligned cells; under 768 px rows become stacked cards.
- components/apps/aoe4-build-order/step-table-model.test.ts: label, nodeLabel, optionLabel, hasOptionalField, start-edit tests (round trip through format/parse after each).
- acceptance/aoe4-step-table.spec.ts: 6 new tests (raw names, data-name option, step-more behavior, button names, start row editing, customize/add/disabled/no sum hint, 390/1280 layout).
- docs/aoe4-build-order.md: Page table paragraph rewritten.

## Tests
- npm test: 41 files, 1249 passed, 8 skipped (pre-existing skips). Model test file: 85 passed.
- npm run acceptance (Node 24, ACCEPTANCE_PORT=3873): 625 passed.
- Invariants encoded: start dropped when no villagers and no rally; pair order preserved; no duplicate node across pairs; rejected count draft leaves order unchanged; add uses first unused node with count 1 and no-ops when all used; every start edit re-parses to the same start; optional-field default per action.

## Pre-existing tests edited
None. Existing step-table acceptance tests pass unchanged (no step-more clicks were needed).

## Mutation checks (each failed, then restored)
- withStart always keeps start: failed. setStartNode duplicate guard removed: failed. hasOptionalField some->every: failed (3). addStartPair count 2: failed. nodeLabel drops deposit form: failed (2). setStartCount without the draft check: failed (6). firstUnusedStartNode picks a used node: failed (2).
- Acceptance tests were not mutation-checked individually.

## Gates
- tsc --noEmit: clean. lint:dup: 0 clones (first run flagged a duplicated label table in the test; rewritten as it.each). next build: success. codegen: none.
- Criteria greps (raw label=, label={field.name}, Up/Down/Delete text, not editable there / set or not): all print nothing.

## Invariant check
S3: start count inputs are not capped in the table; Run and the route validate. Table edits never post to simulate (existing test passes).

## Notes and decisions
- Deleting the last villager pair removes the `villagers` key (the text grammar cannot write an empty clause), so `start` is dropped when no rally remains.
- Cells are `vertical-align: top` at all widths so trigger and action selects share a y at 1280 px; this is a small desktop look change.
- Expansion state resets only when the row count changes (as specified), so replacing the text with a same-length build keeps the old open flags.
- Trigger-kind and action option wording: Right away, At time, At villager count, When node runs out, When bank reaches; Produce, Pause, Build, Research, Move villagers, Set rally. The trigger/action select aria-labels are now capitalised ("Trigger", "Action").
- Did not touch the page or build-input.tsx. Another agent's Playwright run (SGS-066 worktree) was active; I started nothing that is still running.

## Out-of-scope findings
None.
