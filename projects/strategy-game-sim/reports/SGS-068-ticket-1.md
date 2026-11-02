# SGS-068 ticket author report

File: tickets/SGS-068-aoe4-step-table-polish.md. M4 / M4.9, standard, component aoe4-build-order, about 230 business-logic lines, depends on SGS-059, base main.
Covers C9: FIELD_LABELS, step-more, step-start-row, start-* ids, icon controls, cards under 768 px, docs paragraph.
No diagram (single component). Open questions (designer): 1 Add-villager default pair; 2 sum-mismatch hint in table.
Notes: design paths say components/aoe4-build-order/ but files are in components/apps/aoe4-build-order/ (ticket uses the real path). Mutation check not applicable (code does not exist yet); grep counts verified on origin/main (6, 1, 3, 2). Local main checkout is 22 commits behind origin/main; explored via origin/main d5c2549.
Overlap: SGS-059 edits step-table.tsx prop and the docs Page paragraph one sentence above; SGS-068 rebases on it. Later 390 px ticket (Q) uses the cards.
