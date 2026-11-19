# SGS-210 ticket 5 (re-spec 2)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-210-annotations-group-repeated-step-copies.md

## Summary

SGS-210 (aoe4-build-order, M12, Feature, risk standard, LOC ~195, depends on SGS-208). Re-specced against
reports/SGS-210-spec-gate-4.md, one blocking gap.

## Finding folded in

The planner row 7 criterion said the combined run must not take copy 2's wood wait, which contradicted the Scope rule
that merges `waits` by `text` across all copies (a waiting copy's `waitDetails` already holds its accrued seconds).
The criterion, now tagged `(respec 2)`, uses a fixture whose copy 2 has non-empty `waitDetails`. It asserts:

- the combined run has `waitingOn` `earlier-step` and `waitingForText` `null`;
- `blockedBy` ends with `not reached (earlier-step)` and contains no `still waiting`;
- copy 2's wood seconds appear in the merged `waits`;
- copy 2's own run keeps its `waiting` status and its wood text.

A test fails if the selected cause is copy 2's wood wait instead of copy 3's `earlier-step`. The wording that the
combined run must not take the wood wait is gone. Scope is unchanged.

The other criteria do not make the same assumption. The planner row 6 `waiting` and `not-reached` cases already put
the merged waits first.

## History

Appended `## Re-spec 2 - 2026-11-18`. No branch exists.

## Diagrams, questions, overlap

No diagram (single component). Open questions: none. No new overlap.

## Lint

ticket-lint (--graph, --spec, origin/main): exit 0, no errors, no warnings.
