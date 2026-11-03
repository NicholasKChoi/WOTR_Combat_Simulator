# Strategy Game Simulator: Task graph

Structured rows only. Narrative lives in the ticket file.

Statuses: `draft` → `spec_ready` → `ready` → `in_progress` → `needs_review` → `reviewed` → `tested`
→ `in_review` → `awaiting_merge` → `integrated`. Side states: `needs_spec`, `rework`, `bounced`,
`blocked`, `superseded`, `discarded`.

| id | title | milestone | criteria | component | risk | dependsOn | relatesTo | branch | branchTip | status | reworkCount | pr | ticket |
|----|-------|-----------|----------|-----------|------|-----------|-----------|--------|-----------|--------|-------------|----|--------|
| SGS-076 | Show the step timeline beside the charts on wide screens | | | | low | | SGS-077 | sgs-076-aoe4-timeline-beside-charts | cda1497 | integrated | | 86 | tickets/SGS-076-aoe4-timeline-beside-charts.md |
| SGS-077 | Add a cumulative gathered resources series and chart | | | | high | | SGS-076 | sgs-077-aoe4-gathered-resources-chart | e9a428d | integrated | | 87 | tickets/SGS-077-aoe4-gathered-resources-chart.md |
| SGS-078 | Step timeline reads in time order and colour-codes rows by step type | | | | low | | SGS-076 | sgs-078-aoe4-timeline-started-first-type-colors | b6daa13 | integrated | | 84 | tickets/SGS-078-aoe4-timeline-started-first-type-colors.md |
| SGS-079 | Make the prebuilt build entries state choices and rules, not measured results | | | | low | | | sgs-079-aoe4-prebuilt-docs-no-measured-results | 7e6a085 | integrated | | 85 | tickets/SGS-079-aoe4-prebuilt-docs-no-measured-results.md |
| SGS-080 | Hold one villager per farm in the engine | | | | high | | SGS-077 | sgs-080-aoe4-one-villager-per-farm | c8cca5f | tested | 1 | | tickets/SGS-080-aoe4-one-villager-per-farm.md |
| SGS-081 | Re-time the farm steps of the prebuilt AoE4 builds for one villager per farm | | | | standard | SGS-080 | | sgs-081-aoe4-retune-prebuilt-farms | e9571c3 | needs_spec | | | tickets/SGS-081-aoe4-retune-prebuilt-farms.md |
