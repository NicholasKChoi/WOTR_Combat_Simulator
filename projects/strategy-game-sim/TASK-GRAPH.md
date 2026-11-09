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
| SGS-100 | Auto-run controller | M6 | M6.1 | | high | | | | | draft | | | tickets/SGS-100-auto-run-controller.md |
| SGS-099 | Saved-build record, id and save checks | M6 | M6.4,M6.6 | | standard | | | | | draft | | | tickets/SGS-099-saved-build-record.md |
| SGS-101 | Build store seam, Blob adapter, save rate limit | M6 | M6.4,M6.6 | | high | SGS-099 | | | | draft | | | tickets/SGS-101-build-store-and-rate-limit.md |
| SGS-102 | Wire auto-run into the page | M6 | M6.1,M6.3,M6.9 | | high | SGS-100 | | | | draft | | | tickets/SGS-102-wire-auto-run.md |
| SGS-104 | Split layout at 1200 px and resize-while-hidden spec | M6 | M6.2,M6.9 | | standard | SGS-102 | | | | draft | | | tickets/SGS-104-split-layout.md |
| SGS-103 | Builds API routes, OpenAPI 2.4.0 and contract check | M6 | M6.4 | | standard | SGS-099,SGS-101 | | | | draft | | | tickets/SGS-103-builds-api-routes.md |
| SGS-105 | Save button, copyable link and ?b= load | M6 | M6.5,M6.9 | | standard | SGS-103,SGS-102 | | | | draft | | | tickets/SGS-105-save-and-open-by-link.md |
| SGS-106 | smoke:preview script and agent how-to | M6 | M6.7,M6.9 | | standard | SGS-103,SGS-105 | | | | draft | | | tickets/SGS-106-smoke-preview-and-agent-howto.md |
