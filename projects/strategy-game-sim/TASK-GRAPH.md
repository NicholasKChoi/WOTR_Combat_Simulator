# Strategy Game Simulator: Task graph

Structured rows only. Narrative lives in the ticket file.

Statuses: `draft` → `spec_ready` → `ready` → `in_progress` → `needs_review` → `reviewed` → `tested`
→ `in_review` → `awaiting_merge` → `integrated`. Side states: `needs_spec`, `rework`, `bounced`,
`blocked`, `superseded`, `discarded`.

| id | title | milestone | criteria | component | risk | dependsOn | relatesTo | branch | branchTip | status | reworkCount | pr | ticket |
|----|-------|-----------|----------|-----------|------|-----------|-----------|--------|-----------|--------|-------------|----|--------|
| SGS-076 | Show the step timeline beside the charts on wide screens | | | | low | | SGS-077 | sgs-076-aoe4-timeline-beside-charts | | draft | | | tickets/SGS-076-aoe4-timeline-beside-charts.md |
| SGS-077 | Add a cumulative gathered resources series and chart | | | | standard | | SGS-076 | sgs-077-aoe4-gathered-resources-chart | | draft | | | tickets/SGS-077-aoe4-gathered-resources-chart.md |
| SGS-078 | Step timeline reads in time order and colour-codes rows by step type | | | | low | | SGS-076 | sgs-078-aoe4-timeline-started-first-type-colors | | draft | | | tickets/SGS-078-aoe4-timeline-started-first-type-colors.md |
| SGS-079 | Make the prebuilt build entries state choices and rules, not measured results | | | | low | | | sgs-079-aoe4-prebuilt-docs-no-measured-results | | draft | | | tickets/SGS-079-aoe4-prebuilt-docs-no-measured-results.md |
