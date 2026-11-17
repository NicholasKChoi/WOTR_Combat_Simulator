# SGS-199 ticket report 1

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-199-page-help-modal.md (lint clean)

Summary: "Add the How this page works help modal", component aoe4-build-order, Feature, M11, Risk low, about 120 LOC, Depends on SGS-193, SGS-198, SGS-197 (SGS-195 and SGS-192 transitive), On merge none. Scope: new `page-help.tsx` (C18, seven B-H6 sections, native dialog), `page-help.module.css`, heading row in `pages/apps/aoe4-build-order.tsx` and `workbench.module.css`, `StepKindLegend` removed from `build-text-editor.tsx` and `step-table.tsx`, existing legend assertions in unit and acceptance specs rewritten by rule (examples named). Per owner decision Q128 B, sections 4 and 5 describe the wait text, marker control, unit lines and dots, and zoom/pan/reset as live features with no caveat; the plan's default (J describes the page as it is, K updates sections 4/5) is removed and the ticket says K only documents. Criteria cover B-H1..B-H9, section 4 and 5 content per feature (names read from the live page, spec fails on a missing or invented feature), absorbed legend, placement, server render, unit test. Docs are left to K (UI doc sentences about the legend above the editor are K's grep targets); the ticket says so.

Diagrams: none needed (stated).
Open questions: none.
Overlaps: none with open tickets. SGS-193 (E) and SGS-198 (H) tickets were not on disk; I relied on plan rows E and H and the design (C17, B-W10, C16). Names there (`step-blocked-by`, `chart-upgrade-dot`, `chart-pinned-upgrade-dot`) come from the design's test id list.
Scratch checkout: none created.
