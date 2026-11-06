# Strategy Game Simulator: Task graph

Structured rows only. Narrative lives in the ticket file.

Statuses: `draft` → `spec_ready` → `ready` → `in_progress` → `needs_review` → `reviewed` → `tested`
→ `in_review` → `awaiting_merge` → `integrated`. Side states: `needs_spec`, `rework`, `bounced`,
`blocked`, `superseded`, `discarded`.

| id | title | milestone | criteria | component | risk | dependsOn | relatesTo | branch | branchTip | status | reworkCount | pr | ticket |
|----|-------|-----------|----------|-----------|------|-----------|-----------|--------|-----------|--------|-------------|----|--------|
| SGS-095 | Test hygiene follow-ups | - | - | | low | | | | | draft | | | tickets/SGS-095-test-hygiene-followups.md |
| SGS-097 | Docs and issue message cleanups | - | - | | standard | | | | | draft | | | tickets/SGS-097-docs-and-issue-messages.md |
| SGS-096 | Workbench UI bug fixes | - | - | | standard | | | | | draft | | | tickets/SGS-096-workbench-ui-bugs.md |
