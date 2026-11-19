# SGS-208 ticket report 1

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-208-repeat-a-build-or-move-step.md
Mode: New. Base origin/main d80751b. ticket-lint (with --spec and --graph): clean.

Summary: Feature, aoe4-build-order, M12 (M12.1, M12.3), Risk high, about 150 business-logic lines, Depends on none.
Covers design C1 (schema field, tier-2 rule, tier-3 expanded cap, OPTIONAL_STEP_FIELDS), C2 (`repeat.ts`), C4
(`StepTiming.source`/`copy`, expansion at the top of `simulateBuildOrder`, step-stuck copy wording), OpenAPI 2.7.0 plus
the four pinned specs, docs, and the new API acceptance spec. Planner rows 2 and 3 (shared 2.7.0 bump, interim state,
no spec saves a repeated build) are stated in Context and Scope.

Diagram: one Mermaid flowchart (read / act / record) for the `simulateBuildOrder` core loop change.

Open questions: none. Unverified assumptions: none.

Deviation from the planner outline, for the manager: the outline puts `FIELD_LABELS.repeat` in C. Because A adds `repeat`
to `OPTIONAL_STEP_FIELDS`, the existing `step-table-model.test.ts` tests ("labels every field a row can render", and the
label count of 19) would fail on A alone. The ticket therefore has A add `FIELD_LABELS.repeat` (a label only, no table
field) and the `schema.test.ts` OPTIONAL_STEP_FIELDS `full` table gain `repeat`. C's ticket should not add the label again
(it still adds the table field and `changeAction` rule).

Overlap: none with open tickets (no open tickets in the graph). B and C touch disjoint files from A. The rename ticket D
makes the identical 2.7.0 edit.

Notes: the ticket includes the cap rule that a tier-2 `invalid` issue on repeat does not suppress the field-pass check
(tier-2 issues carry a scope, so `withCrossChecks`' `failed('steps')` ignores them); the expanded-count issue can therefore
accompany a tier-2 `invalid` in a doubly broken order, which the design allows. No scratch checkout was made; no command
criteria were written beyond the standard typecheck/test/lint line.
