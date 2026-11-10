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
| SGS-100 | Auto-run controller | M6 | M6.1 | | high | | | sgs-100-auto-run-controller | 6c4f90b561ba95c1843e0349bd1a22e39965596c | integrated | 1 | 111 | tickets/SGS-100-auto-run-controller.md |
| SGS-099 | Saved-build record, id and save checks | M6 | M6.4,M6.6 | | standard | | | sgs-099-saved-build-record | 5efa6eeb15c6e90930e0329f11a233d73a9531d5 | integrated | 1 | 108 | tickets/SGS-099-saved-build-record.md |
| SGS-101 | Build store seam, Blob adapter, save rate limit | M6 | M6.4,M6.6 | | high | SGS-099 | | sgs-101-build-store-and-rate-limit | 28717290e957ee670c6d2d74bceb40456a24d9c9 | integrated | | 109 | tickets/SGS-101-build-store-and-rate-limit.md |
| SGS-102 | Wire auto-run into the page | M6 | M6.1,M6.3,M6.9 | | high | SGS-100 | | sgs-102-use-auto-run | 2a6dc69e9ecf8f2e9964a5a1b67a7c3cc5d2d73d | integrated | | 112 | tickets/SGS-102-wire-auto-run.md |
| SGS-104 | Split layout at 1200 px and resize-while-hidden spec | M6 | M6.2,M6.9 | | standard | SGS-102 | | sgs-104-split-layout | 32d9d29be00937f22311c5592497c0ba085d671d | integrated | 1 | 113 | tickets/SGS-104-split-layout.md |
| SGS-103 | Builds API routes, OpenAPI 2.4.0 and contract check | M6 | M6.4 | | standard | SGS-099,SGS-101 | | sgs-103-build-routes | 55a864461a6835a8c6a1192297e568ef747ad407 | integrated | | 110 | tickets/SGS-103-builds-api-routes.md |
| SGS-105 | Save button, copyable link and ?b= load | M6 | M6.5,M6.9 | | standard | SGS-103,SGS-102 | | sgs-105-save-and-open-by-link | c401f2d071fc48d968199506b4f4de33f44e7a98 | integrated | 3 | 114 | tickets/SGS-105-save-and-open-by-link.md |
| SGS-106 | smoke:preview script and agent how-to | M6 | M6.7,M6.9 | | standard | SGS-103,SGS-105 | | sgs-106-smoke-preview | 0aee0751a40e8e7ac9159cb9bb682770f75412d4 | integrated | | 115 | tickets/SGS-106-smoke-preview-and-agent-howto.md |
| SGS-107 | Step annotation model and resultsStale | M7 | M7.1,M7.2,M7.4 | aoe4-build-order | standard | | | sgs-107-step-annotation-model | adde412 | tested | | | tickets/SGS-107-step-annotation-model.md |
| SGS-110 | Text-tab gutter annotations | M7 | M7.6,M7.7 | aoe4-build-order | standard | SGS-108,SGS-109 | | sgs-110-text-gutter-annotations | d7b7e01 | reviewed | | | tickets/SGS-110-text-gutter-annotations.md |
| SGS-111 | Explicit build house steps no longer freeze production | M7 | M7.8 | aoe4-build-order | high | | | sgs-111-drop-house-gate | 8ac8ee9 | integrated | | 117 | tickets/SGS-111-drop-house-gate.md |
| SGS-108 | Run cell on each step-table row; charts dim on stale | M7 | M7.1,M7.2,M7.4,M7.7 | aoe4-build-order | standard | SGS-107 | | sgs-108-step-run-cell | 5bda0f7 | tested | 1 | | tickets/SGS-108-step-run-cell.md |
| SGS-109 | Row hover shades the charts; step timeline removed | M7 | M7.3,M7.5,M7.7 | aoe4-build-order | standard | SGS-108 | | sgs-109-row-hover-drop-timeline | e708ee5 | tested | 1 | | tickets/SGS-109-row-hover-drop-timeline.md |
