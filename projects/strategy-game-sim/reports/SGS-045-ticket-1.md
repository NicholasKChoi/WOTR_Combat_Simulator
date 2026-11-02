# SGS-045 ticket report (ticket author, 1)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-045-aoe4-severity-message-lists.md

Summary: "Show result warnings and collapsible info messages on the AoE4 page". Component aoe4-build-order (UI only). About 100 business-logic lines (messages.ts, messages.tsx, results.tsx and page wiring). Depends on SGS-041 (note severity), transitively SGS-037 (Severity, SimWarning, warnings field). Covers M3.12 lists and toggle and M3.2 warning shown: pure resultMessages split, WarningMessages and InfoMessages with the design's test ids and toggle text, page-level persistent expanded state, vitest unit test, Playwright updates (notes test expands toggle first; no-notes test unchanged), a new Playwright test using a patched real response (route.fetch) so it does not depend on the engine emitting warnings yet, and the docs/aoe4-build-order.md lines 570-571 fix.

Risk: standard (not low): about 100 lines, and the M2 test id simulation-notes changes meaning. On merge: none.
Diagrams: none (single-component).
Checks run: git grep confirmed results.tsx:8 is the only `result.notes` match in components/pages today, as the criterion implies. No mutation criteria.
Overlap: results.tsx and page are also edited by M (SGS-047), N (048), O (049); rebase only. Playwright spec shared with U (SGS-055).
Open question (designer): what resultMessages does with an `error`-severity item (none in M3); no criterion depends on it.
Applied owner answers: none of the ten bear on K directly (the engine-independent Playwright design avoids relying on D/H).
