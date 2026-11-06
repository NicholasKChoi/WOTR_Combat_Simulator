# Strategy Game Simulator: Task graph

Structured rows only. Narrative lives in the ticket file.

Statuses: `draft` → `spec_ready` → `ready` → `in_progress` → `needs_review` → `reviewed` → `tested`
→ `in_review` → `awaiting_merge` → `integrated`. Side states: `needs_spec`, `rework`, `bounced`,
`blocked`, `superseded`, `discarded`.

| id | title | milestone | criteria | component | risk | dependsOn | relatesTo | branch | branchTip | status | reworkCount | pr | ticket |
|----|-------|-----------|----------|-----------|------|-----------|-----------|--------|-----------|--------|-------------|----|--------|
| SGS-095 | Test hygiene follow-ups | - | - | | low | SGS-098 | | sgs-095-test-hygiene | fa3ab81340d3869db75fe8c766d29b608116b36d | integrated | | 107 | tickets/SGS-095-test-hygiene-followups.md |
| SGS-097 | Docs and issue message cleanups | - | - | | standard | | | sgs-097-docs-issue-messages | 4458555c7e0b12069b11e4fd3e32212380012736 | integrated | | 105 | tickets/SGS-097-docs-and-issue-messages.md |
| SGS-096 | Workbench UI bug fixes | - | - | | low | | | sgs-096-pinned-legend-doc | 1097a882d808ae2e9ca899e127400555e820f3a0 | integrated | | 104 | tickets/SGS-096-workbench-ui-bugs.md |
| SGS-098 | Delete failing AoE4 acceptance tests | - | - | | low | - | | sgs-098-delete-failing-aoe4-acceptance | | integrated | | 106 | tickets/SGS-098-delete-failing-aoe4-acceptance-tests.md |
