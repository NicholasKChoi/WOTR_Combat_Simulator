# SGS-088 ticket report

Ticket: tickets/SGS-088-aoe4-workbench-ui-state-kept.md. Risk standard, dependsOn none, ~70 LOC, component aoe4-build-order.
Backlog lines covered: 51 (row-open flags by index), 52 (Text/Table remount loses row state; toggle inert on Results), 55 (stored pin with always-5xx restore cannot be removed). All three verified on origin/main cc9bb04.
Not covered (left in backlog): in bullet 52, the number-field draft lost on remount and the recharts resize-while-hidden spec gap; in bullet 55, the Strict Mode double POST.
Decisions to confirm (filed as owner questions): drop stored pin on any non-ok HTTP response (reverses M4 design row, manager to edit it); toggle on Results switches to Build tab.
Existing step-table spec requires a hand-opened row to stay open when its value is cleared, so the ticket carries explicit flags (swap on move, remove on delete, OR on external text edit) instead of deriving from content.
Criteria were not run as commands (none are grep-style except the docs grep, which matches today's docs and finds nothing after the doc edit). No tests added to acceptance/aoe4-build-order.spec.ts. No diagrams. No overlap with other tickets (SGS-082 deletes a different spec).
