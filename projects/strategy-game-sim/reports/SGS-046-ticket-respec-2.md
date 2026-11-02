# SGS-046 ticket re-spec 2

File: tickets/SGS-046-aoe4-step-table-editor.md (edited in place; id, file and graph row unchanged; no sections appended).

Folded in the four spec-gate-1 notes:
1. Scope now names the model helpers: `changeProducer`, `changeTriggerKind`, `setReaction`, `setNumberField`.
2. Scope says selecting the empty option in the `then`, `to` (rally) and `at` selects deletes the field.
3. Invariants A1 line reworded: `defaultTrigger` and `defaultStep` carry the design's UI defaults (100, 1, 0, wood), which are form starting values, not game rates, costs or times.
4. Unknown-values Playwright criterion uses `research not-a-tech`, expecting `not-a-tech (unknown)` with `data-unknown="true"`.

Changed spots are tagged (respec 2). Risk, size, dependencies and open questions (none) are unchanged. No runnable-command criteria changed.
