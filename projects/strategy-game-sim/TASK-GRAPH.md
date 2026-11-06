# Strategy Game Simulator: Task graph

Structured rows only. Narrative lives in the ticket file.

Statuses: `draft` → `spec_ready` → `ready` → `in_progress` → `needs_review` → `reviewed` → `tested`
→ `in_review` → `awaiting_merge` → `integrated`. Side states: `needs_spec`, `rework`, `bounced`,
`blocked`, `superseded`, `discarded`.

| id | title | milestone | criteria | component | risk | dependsOn | relatesTo | branch | branchTip | status | reworkCount | pr | ticket |
|----|-------|-----------|----------|-----------|------|-----------|-----------|--------|-----------|--------|-------------|----|--------|
| SGS-095 | Test hygiene follow-ups | - | - | | low | | | sgs-095-test-hygiene | | in_progress | | | tickets/SGS-095-test-hygiene-followups.md |
| SGS-097 | Docs and issue message cleanups | - | - | | standard | | | sgs-097-docs-issue-messages | 9e52088d830a08db1f6ee9805afd9fdd452aea09 | needs_review | | | tickets/SGS-097-docs-and-issue-messages.md |
| SGS-096 | Workbench UI bug fixes | - | - | | low | | | sgs-096-pinned-legend-doc | 1097a882d808ae2e9ca899e127400555e820f3a0 | integrated | | 104 | tickets/SGS-096-workbench-ui-bugs.md |
