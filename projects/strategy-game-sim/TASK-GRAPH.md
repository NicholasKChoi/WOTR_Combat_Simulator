# Strategy Game Simulator: Task graph

Structured rows only. Narrative lives in the ticket file.

Statuses: `draft` → `spec_ready` → `ready` → `in_progress` → `needs_review` → `reviewed` → `tested`
→ `in_review` → `awaiting_merge` → `integrated`. Side states: `needs_spec`, `rework`, `bounced`,
`blocked`, `superseded`, `discarded`.

| id | title | milestone | criteria | component | risk | dependsOn | relatesTo | branch | branchTip | status | reworkCount | pr | ticket |
|----|-------|-----------|----------|-----------|------|-----------|-----------|--------|-----------|--------|-------------|----|--------|
| SGS-025 | Update the AoE4 build order doc for villager rally and start | M2 | M2.1 | | standard | | | sgs-025-aoe4-doc-rally-start | c763bec | integrated | 1 | 30 | tickets/SGS-025-aoe4-doc-rally-start.md |
| SGS-027 | Add the effect interpreter, gather trip model and builder scaling | M2 | M2.3 | | high | | | sgs-027-aoe4-effects-gather-construction | b2c15c1 | integrated | | 32 | tickets/SGS-027-aoe4-effects-gather-construction.md |
| SGS-026 | Add the rally step and build order start types | M2 | M2.4 | | high | | | sgs-026-aoe4-model-rally-start-types | e2206f1 | integrated | | 31 | tickets/SGS-026-aoe4-model-rally-start-types.md |
| SGS-028 | Parse and format build order paste text | M2 | M2.4 | | high | SGS-025,SGS-026 | | sgs-028-aoe4-parse-build-order-text | | in_progress | | | tickets/SGS-028-aoe4-parse-build-order-text.md |
| SGS-029 | Validate build orders and resolve simulation inputs | M2 | M2.4 | | high | SGS-025,SGS-026 | | sgs-029-aoe4-validate-build-order | | in_progress | | | tickets/SGS-029-aoe4-validate-build-order.md |
| SGS-030 | Simulate the build order loop with rally and start | M2 | M2.3 | | high | SGS-027,SGS-028,SGS-029 | | | | spec_ready | | | tickets/SGS-030-aoe4-engine-core.md |
| SGS-033 | Serve the build order simulation over POST and OpenAPI | M2 | M2.7 | | high | SGS-028,SGS-029,SGS-030 | | | | spec_ready | | | tickets/SGS-033-aoe4-simulate-route.md |
| SGS-032 | AoE4 research handler and veterancy tiers | M2 | M2.3 | | high | SGS-030 | | | | spec_ready | | | tickets/SGS-032-aoe4-research-veterancy.md |
| SGS-031 | AoE4 build and move handlers, landmark ages, auto-houses | M2 | M2.3 | | high | SGS-030 | | | | spec_ready | | | tickets/SGS-031-aoe4-build-move-ages.md |
| SGS-034 | AoE4 build order page, prebuilt build, landing link and acceptance tests | M2 | M2.5 | | high | SGS-028,SGS-031,SGS-032,SGS-033 | | | | spec_ready | | | tickets/SGS-034-aoe4-build-order-page.md |
