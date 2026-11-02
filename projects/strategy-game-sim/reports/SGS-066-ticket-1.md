# SGS-066 ticket author report 1

File: tickets/SGS-066-aoe4-workbench-tabs-editor.md. M4 / M4.7, risk standard, depends on SGS-059, about 190 business-logic lines.
Covers: tabs and panels, sticky run bar, text/table toggle, BuildTextEditor with gutter and auto-size rows, lineCount, tab-after-run rule, spec rules A-D, docs Page section.
Diagrams: tab state machine and Run read/act/record flow.
Open questions (all designer): (1) where build-order-issues shows in table view (ticket renders it under whichever view is open); (2) fallback to Build when unpinning on Results with no result; (3) errorLines prop and data-error shipped in J with page passing [] until the inline issues ticket.
Overlap: SGS-059 (same page and build-input.tsx, built on its IssueList/issues prop/runRejected, removes the issues prop); later inline-issues and pin tickets edit the same files.
Checked on origin/main d5c2549: rows={16} 1 hit, build-order-text testid 1 hit, docs lines 764/765 match the docs grep; no mutation run (new files).
