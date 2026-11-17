# SGS-200 ticket re-spec 3

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-200-m11-docs-ui-doc-and-architecture.md

## Summary

SGS-200, "Document the M11 page and module changes in the UI doc, the model and format docs, the lib README and ARCHITECTURE.md". Docs ticket for component aoe4-build-order, risk low, about 100 to 150 changed doc lines. It depends on SGS-190, 191, 192, 193, 197, 198 and 199; Depends on is unchanged. This re-spec folds in spec-gate-3 gap 1:

- New criterion (respec 3): the model doc or the format doc must state each of B-B1 to B-B12 and each of B-W1 to B-W9, B-W11 and B-W12 in at least one sentence. The report maps each rule number to its doc, section and quoted sentence, and names any sentence the ticket adds. A rule that only states engine internals can be marked not applicable, with the reason. B-B13 is left out because it belongs to SGS-190. B-W10 is left out because the UI wait-text criterion covers it.
- Help-dialog criterion (respec 3): the report now maps each of B-H1 to B-H5 and B-H7 to B-H9 to its UI doc sentence. B-H7 maps to the rewritten step-kind-legend sentences. B-H6 is left out because it is the dialog's content, which the doc does not copy.
- UI rule-map criterion (respec 3): the lead-in now names all four groups, B-T, B-M, B-Z and B-U.
- Scope: the lead-in now says which rule ranges go in which doc. The model and format doc bullet now names the rule ranges. It also notes that at origin/main (683991c) SGS-190 and SGS-192 are merged, so the Priority and Queues paragraphs and the format doc's wait-reasons table and Wait details section already state most of these rules. The implementer checks each rule number against them and fills any gap.

A Re-spec 3 history section was added. ticket-lint.py prints no errors.

## Checks run

- The stale-phrase searches from criterion 58 were re-run against origin/main. `still waiting on resources` (the format doc's `step-stuck` example), `kind legend renders above` (UI doc line 20) and `tier <tier>` (UI doc line 114) still match. `Queue length is not consulted` and `replaces its order (a switch)` no longer match: SGS-190, now integrated, removed them, as the criterion already says.
- The model and format docs at origin/main were spot-checked: the new criterion can be met with existing sentences plus fills. For example, the Queues paragraph covers B-B1, the Priority paragraph covers B-B9, Queues also covers B-B12, the wait-reasons table covers B-W1 and B-W2, and Wait details covers B-W5 to B-W9 and B-W11.

## Diagrams

None. The ticket stays "no diagram required" (docs only).

## Open questions

None.

## Overlap

No new overlap. The non-blocking notes in spec-gate-3 were not folded in because they do not change scope.
