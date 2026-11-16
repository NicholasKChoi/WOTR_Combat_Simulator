# SGS-171 ticket report

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-171-split-aoe4-build-order-doc.md (lint clean)

Summary: Docs ticket, component aoe4-build-order, Milestone none, Priority low, Risk standard (not low, because CONTEXT.md names docs/aoe4-build-order.md authoritative for the simulation model and outputs). LOC 0 business logic; about 1,300 doc lines are moved. No dependencies.

Split by heading at origin/main:
- Model doc (stays): Purpose and model through Technologies, CivRules seams, Extension points.
- Format doc (new): Build order input, Route (with Builds and Named builds routes), the Outputs text before its Page subsection.
- UI doc (new): Page, saving a build and opening by link, saving from a script, smoke test.

Also covers the condition-chain reflow (open-flag paragraph is the named example), cross-file "see below/above" becoming links, and the ARCHITECTURE.md "App design doc" row, Rules, and add-an-app step. On merge sets the CONTEXT.md Design docs row. No references to the doc exist outside ARCHITECTURE.md and the doc itself at the base.

Diagrams: none (docs only).
Open questions: none. No decision requiring code knowledge was needed.
Overlap: none checked against open tickets beyond the graph not being read; the manager should confirm no open ticket edits docs/aoe4-build-order.md, since this move conflicts with any such edit.
Judgment call: "Saving from a script" sits in the UI doc per the backlog bullet ("Page, saving, smoke test"), though it describes an API use.
Scratch checkout: none made.
