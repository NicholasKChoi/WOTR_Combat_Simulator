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
| SGS-028 | Parse and format build order paste text | M2 | M2.4 | | high | SGS-025,SGS-026 | | sgs-028-aoe4-parse-build-order-text | 442832e | integrated | | 34 | tickets/SGS-028-aoe4-parse-build-order-text.md |
| SGS-029 | Validate build orders and resolve simulation inputs | M2 | M2.4 | | high | SGS-025,SGS-026 | | sgs-029-aoe4-validate-build-order | 871bbb2 | integrated | | 35 | tickets/SGS-029-aoe4-validate-build-order.md |
| SGS-030 | Simulate the build order loop with rally and start | M2 | M2.3 | | high | SGS-027,SGS-028,SGS-029 | | sgs-030-aoe4-engine-core | 796bf6e | integrated | | 37 | tickets/SGS-030-aoe4-engine-core.md |
| SGS-033 | Serve the build order simulation over POST and OpenAPI | M2 | M2.7 | | high | SGS-028,SGS-029,SGS-030 | | sgs-033-aoe4-simulate-route | 25b1512 | integrated | | 39 | tickets/SGS-033-aoe4-simulate-route.md |
| SGS-032 | AoE4 research handler and veterancy tiers | M2 | M2.3 | | high | SGS-030 | | sgs-032-aoe4-research-veterancy | 7e41e68 | integrated | | 38 | tickets/SGS-032-aoe4-research-veterancy.md |
| SGS-031 | AoE4 build and move handlers, landmark ages, auto-houses | M2 | M2.3 | | high | SGS-030 | | sgs-031-aoe4-build-move-ages | c88fb01 | integrated | 2 | 40 | tickets/SGS-031-aoe4-build-move-ages.md |
| SGS-034 | AoE4 build order page, prebuilt build, landing link and acceptance tests | M2 | M2.5 | | high | SGS-028,SGS-031,SGS-032,SGS-033 | | sgs-034-aoe4-build-order-page | 725e1ca | integrated | | 41 | tickets/SGS-034-aoe4-build-order-page.md |
| SGS-052 | Stop the chart Y-axis label overlapping 4-digit ticks | M3 | M3.8 | | low | | | sgs-052-aoe4-chart-yaxis-overlap | 0dd2411 | integrated | | 45 | tickets/SGS-052-aoe4-chart-yaxis-overlap.md |
| SGS-045 | Show warnings and collapsible info messages on the page | M3 | M3.12,M3.2 | | standard | SGS-041 | | sgs-045-aoe4-severity-message-lists | e68dc07 | reviewed | 1 | | tickets/SGS-045-aoe4-severity-message-lists.md |
| SGS-043 | Add spend and spawned population series | M3 | M3.6 | | standard | SGS-035,SGS-037 | | sgs-043-aoe4-spend-population-series | 3209540 | integrated | 1 | 48 | tickets/SGS-043-aoe4-spend-population-series.md |
| SGS-036 | Cap API issues and harden paste and validate input | M3 | M3.8 | | high | | | sgs-036-aoe4-request-hardening | b83701a | integrated | 1 | 43 | tickets/SGS-036-aoe4-request-hardening.md |
| SGS-053 | Fix M2 doc wording in the AoE4 docs and design | M3 | M3.8 | | low | | | sgs-053-aoe4-m2-doc-wording | 9998b4f | integrated | | 42 | tickets/SGS-053-aoe4-m2-doc-wording.md |
| SGS-041 | Research multi-tier techs, id-named notes and note severity | M3 | M3.8,M3.12 | | high | SGS-037 | | sgs-041-aoe4-research-multitier-note-severity | c56a5f6 | integrated | | 47 | tickets/SGS-041-aoe4-research-multitier-note-severity.md |
| SGS-044 | Add chart marker data to the engine result | M3 | M3.10 | | standard | SGS-041 | | sgs-044-aoe4-chart-marker-data | 5231156 | tested | | | tickets/SGS-044-aoe4-chart-marker-data.md |
| SGS-038 | Deplete resource nodes in the engine with deposits and move all | M3 | M3.1,M3.2,M3.11,M3.8 | | high | SGS-037,SGS-035 | | sgs-038-aoe4-depletion-engine | 4749c13 | needs_review | | | tickets/SGS-038-aoe4-depletion-engine.md |
| SGS-042 | Report why steps wait and warn on stuck steps | M3 | M3.5,M3.12 | | standard | SGS-037,SGS-038,SGS-041 | | | | spec_ready | | | tickets/SGS-042-aoe4-step-wait-step-stuck.md |
| SGS-037 | Add node refs, warnings contract and the depletion module | M3 | M3.1,M3.11,M3.12 | | high | SGS-035 | | sgs-037-aoe4-node-refs-warnings-depletion-module | d4c7cf1 | integrated | | 46 | tickets/SGS-037-aoe4-node-refs-warnings-depletion-module.md |
| SGS-035 | Share engine code, test helpers and add a duplication check | M3 | M3.13 | | high | | | sgs-035-aoe4-engine-common-dup-check | b52e9f5 | integrated | 1 | 44 | tickets/SGS-035-aoe4-engine-common-dup-check.md |
| SGS-048 | Pin a run and compare key numbers and chart overlays | M3 | M3.6 | | standard | SGS-043,SGS-052 | | sgs-048-aoe4-pin-compare | 43a0220 | tested | | | tickets/SGS-048-aoe4-pin-compare.md |
| SGS-049 | Draw age-up and research markers on the charts | M3 | M3.10 | | standard | SGS-044,SGS-052,SGS-048 | | | | spec_ready | | | tickets/SGS-049-aoe4-chart-markers-ui.md |
| SGS-039 | Add depleted and bank triggers, reactions and default node amounts | M3 | M3.1,M3.3,M3.11,M3.7 | | high | SGS-038,SGS-042 | | | | spec_ready | | | tickets/SGS-039-aoe4-triggers-reactions-default-amounts.md |
| SGS-040 | Parse and format deposits, move all and reaction steps in paste text | M3 | M3.3,M3.11,M3.4 | | standard | SGS-039 | | | | spec_ready | | | tickets/SGS-040-aoe4-paste-grammar-deposits-reactions.md |
| SGS-047 | Show a per-step timeline of start, finish and waits | M3 | M3.5 | | low | SGS-035,SGS-040,SGS-042,SGS-045 | | | | spec_ready | | | tickets/SGS-047-aoe4-step-timeline.md |
| SGS-055 | Add the M3 end-to-end Playwright flow | M3 | M3.9 | | standard | SGS-039,SGS-040,SGS-045,SGS-046,SGS-047,SGS-048 | | | | spec_ready | | | tickets/SGS-055-aoe4-m3-playwright-flow.md |
| SGS-051 | Add the knight + longbow King's Palace prebuilt build | M3 | M3.7,M3.11 | | standard | SGS-039,SGS-040,SGS-041 | | | | spec_ready | | | tickets/SGS-051-aoe4-build-knight-longbow.md |
| SGS-046 | Edit build steps in a table synced with the paste text | M3 | M3.4 | | standard | SGS-040 | | | | spec_ready | | | tickets/SGS-046-aoe4-step-table-editor.md |
| SGS-050 | Add the spear + longbow into men-at-arms + crossbow prebuilt build | M3 | M3.7,M3.11 | | standard | SGS-035,SGS-039,SGS-040 | | | | spec_ready | | | tickets/SGS-050-aoe4-build-spear-longbow-maa-crossbow.md |
| SGS-054 | Audit M3 docs and OpenAPI and pin the schema names | M3 | M3.9 | | standard | SGS-036,SGS-038,SGS-039,SGS-040,SGS-041,SGS-042,SGS-043,SGS-044,SGS-045,SGS-046,SGS-047,SGS-048,SGS-049,SGS-050,SGS-051,SGS-053 | | | | spec_ready | | | tickets/SGS-054-aoe4-m3-docs-openapi-audit.md |
