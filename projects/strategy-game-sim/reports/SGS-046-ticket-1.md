# SGS-046 ticket report 1

File: projects/strategy-game-sim/tickets/SGS-046-aoe4-step-table-editor.md
Title: Add a step table editor to the AoE4 page, kept in sync with the paste text.
Component aoe4-build-order. Risk: high (REPO.md criticalPaths `lib/**` applies through the new `lib/aoe4-build-order/step-options.ts`; plan said medium; template rule wins, as for SGS-040). About 330 lines (options ~45, model ~110, component ~150, page ~25); under the 400 split line, split candidate named (model + options first, component + page second). Depends on SGS-040 (transitively 039, 038, 037, 035). On merge: none.

Covers M3.4: `stepOptions(data)` and `StepOptions` (design shape, ordering rule, classifyTech filter for techs), `step-table-model.ts` (defaultStep, defaultTrigger, insert/delete/move/replace, changeAction, selectChoices, plus producer/trigger-kind/reaction/number helpers), `step-table.tsx`, page wiring (`PageProps.options`, one `text` state, `step-table-unavailable`), docs Page section. Criteria: unit tests for options and model, 12 Playwright criteria (sync both ways, every step form, unparsable text, unknown values, number fields drafts, move buttons, prebuilt select and run, buttons do not submit), import/bundle check, docs, mutation checks.

Diagrams: one short flowchart (text/table loop and static props); no control loop change.

Criteria checks run on main: `git grep -n "paste textarea" docs/aoe4-build-order.md` = 1 line (:555), becomes 0; `git grep` for step-table/stepOptions/step-options in pages, components, lib, acceptance, docs = 0 hits; the non-type-import grep on components prints nothing. English snapshot facts used in criteria were read from the snapshot: villager producedBy = capital-town-center, kings-palace, town-center (ages 1, 2, 1, so sorted: capital-town-center, town-center, kings-palace); capital-town-center makes scout and villager; 30 buildings. Mutation criteria cannot run now (the code does not exist); the ticket says the PR states they were run.

Choices made where the design leaves them: time field is whole seconds (not m:ss); number fields keep a local draft so a field can be cleared and retyped while the step stays unchanged until valid; defaultStep values (build house from wood, move 1 from nodes[0] to wood, rally to nodes[0], research techs[0], pause villagerProducers[0]); unknown values render as `<id> (unknown)` with `data-unknown`; table buttons are `type="button"`.

Open questions (both `designer`):
1. The design's test ids give `count` for both the action field and a `villagers` trigger's count, which can sit in the same row. The ticket names the trigger control `step-field-trigger-count`; confirm before SGS-055 (U) uses it. Time in seconds, confirm.
2. defaultStep values beyond `produce` are the ticket's choice.

Overlap: results.tsx and the page are also edited by SGS-045, 047, 048, 049 (this ticket touches the page only, not results.tsx); docs Page section also edited by SGS-045 and 047 (rebase only). Uses SGS-040's `formatBuildOrderText`; no new parse-text or validate change.
