# SGS-200 ticket report (n=1)

File: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-200-m11-docs-ui-doc-and-architecture.md (lint clean)

Summary: Docs ticket, component aoe4-build-order, Milestone M11, risk low, about 80-120 doc lines, depends on SGS-190, 191, 192, 193, 197, 198, 199. Scope covers the UI doc (Units row rewrite and upgrade dots, chart table, marker control B-M, zoom B-Z, wait text B-W10, legend sentence, help dialog behavior section), a check of the model and format docs against B/C/D edits, and ARCHITECTURE.md entries for wait-detail.ts, unit-lines.ts, chart-markers.ts, chart-zoom.ts, use-chart-zoom.ts, page-help.tsx. Per Q128 B it does not touch the help modal's content or page-help.tsx (it documents the dialog's behavior only; ARCHITECTURE.md still names the file). On merge is the exact line given.

Finding: the plan's grep `still waiting on resources` matches today's `step-stuck` message example at docs/aoe4-build-order-format.md (the warning text itself is unchanged, B-W12). The ticket has the docs agent change the example's cause (e.g. `prerequisite`) so the grep returns nothing. The phrase "kind legend renders above" is not literally in the docs; the real sentence is in the UI doc cell paragraph (`step-kind-legend` above the table / above the editor), which the ticket targets. I ran the grep against origin/main: hits were only the format doc example, UI doc `tier <tier>` row, and model doc lines for the two queue phrases (the latter fixed by SGS-190).

Diagrams: none (docs only).
Open questions: none.
Overlap: none with open tickets; no doc statement duplicated from other tickets (the ticket says to check, not redo, their edits). The ticket depends on SGS-194/195/196 only transitively (via 197/198).
Scratch checkouts: none made.
