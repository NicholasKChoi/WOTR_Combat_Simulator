# Strategy Game Simulator: Task graph

Structured rows only. Narrative lives in the ticket file.

Statuses: `draft` → `spec_ready` → `ready` → `in_progress` → `needs_review` → `reviewed` → `tested`
→ `in_review` → `awaiting_merge` → `integrated`. Side states: `needs_spec`, `rework`, `bounced`,
`blocked`, `superseded`, `discarded`.

| id | title | milestone | criteria | component | risk | dependsOn | relatesTo | branch | branchTip | status | reworkCount | pr | ticket |
|----|-------|-----------|----------|-----------|------|-----------|-----------|--------|-----------|--------|-------------|----|--------|
| SGS-080 | Hold one villager per farm in the engine | | | | high | | SGS-077 | sgs-080-aoe4-one-villager-per-farm | c8cca5f | integrated | 1 | 88 | tickets/SGS-080-aoe4-one-villager-per-farm.md |
| SGS-081 | Re-time the farm steps of the prebuilt AoE4 builds for one villager per farm | | | | standard | SGS-080 | | sgs-081-aoe4-retune-prebuilt-farms | 9fd49d6 | integrated | 3 | 89 | tickets/SGS-081-aoe4-retune-prebuilt-farms.md |
| SGS-082 | Remove the AoE4 build order UI acceptance spec | | | | low | SGS-081 | | sgs-082-aoe4-remove-build-order-ui-spec | | integrated | | 90 | tickets/SGS-082-aoe4-remove-build-order-ui-spec.md |
| SGS-083 | Highlight a hovered step's time span as a band on the charts | | | | low | | | sgs-083-aoe4-highlight-step-span-on-charts | b43d72aff28bb4a950ae12319403dacfc9c403a3 | reviewed | | | tickets/SGS-083-aoe4-highlight-step-span-on-charts.md |
| SGS-084 | Add a gatherers series and a per-villager view of the Gather rates chart | | | | high | | | sgs-084-aoe4-gather-rate-per-villager | b90ad269213d2290ad3d2b338162953d5d210eff | needs_review | | | tickets/SGS-084-aoe4-gather-rate-per-villager.md |
| SGS-085 | Polish text editor issue reporting | | | | standard | | | | | needs_spec | | | tickets/SGS-085-aoe4-text-editor-issue-ux.md |
| SGS-086 | Fit the AoE4 workbench to phone screens and make its tabs keyboard-navigable | | | | low | | | sgs-086-aoe4-small-screen-tabs-keyboard | | integrated | | 91 | tickets/SGS-086-aoe4-small-screen-tabs-keyboard.md |
| SGS-087 | Uncrowd chart marker labels and round tooltip values | | | | low | SGS-082 | | sgs-087-aoe4-chart-readability | 4c065b2655975c4182c6fdcb4fc5cef5446204b9 | needs_review | | | tickets/SGS-087-aoe4-chart-readability.md |
| SGS-088 | Keep step-table row state and let a failing stored pin be dropped | | | | standard | | | | | needs_spec | | | tickets/SGS-088-aoe4-workbench-ui-state-kept.md |
| SGS-091 | Behavior-preserving AoE4 engine cleanups | | | | standard | | | sgs-091-aoe4-engine-cleanups | 03be58b6b2586ee30d676913845500dd13435716 | reviewed | 1 | | tickets/SGS-091-aoe4-engine-cleanups.md |
| SGS-092 | Fix AoE4 test hygiene | | | | low | SGS-081 | | sgs-092-aoe4-test-hygiene | | integrated | | 92 | tickets/SGS-092-aoe4-test-hygiene.md |
| SGS-093 | Tidy AoE4 docs, prebuilt build data and OpenAPI examples | | | | standard | SGS-081 | | sgs-093-aoe4-docs-prebuilt-cleanups | 26eebf9e2942894622c1232ba60d744fa5d428cb | integrated | 1 | 94 | tickets/SGS-093-aoe4-docs-prebuilt-cleanups.md |
| SGS-089 | Guard simulate against zero-time production and a missing rally | | | | high | | | sgs-089-aoe4-engine-guard-crashes-hangs | 308d8f958a042a4a631ab8c2c4ca3ec95a266110 | tested | | | tickets/SGS-089-aoe4-engine-guard-crashes-hangs.md |
