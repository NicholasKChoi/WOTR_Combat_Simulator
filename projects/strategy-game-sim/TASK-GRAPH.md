# Strategy Game Simulator: Task graph

Structured rows only. Narrative lives in the ticket file.

Statuses: `draft` → `spec_ready` → `ready` → `in_progress` → `needs_review` → `reviewed` → `tested`
→ `in_review` → `awaiting_merge` → `integrated`. Side states: `needs_spec`, `rework`, `bounced`,
`blocked`, `superseded`, `discarded`.

| id | title | milestone | criteria | component | risk | dependsOn | relatesTo | branch | branchTip | status | reworkCount | pr | ticket |
|----|-------|-----------|----------|-----------|------|-----------|-----------|--------|-----------|--------|-------------|----|--------|
| SGS-001 | Draft WOTR combat design doc | M1 | M1.1 | wotr-combat-simulator | high | | | sgs-001-wotr-combat-design-doc | 7b26c65 | integrated | 0 | 14 | tickets/SGS-001-wotr-combat-design-doc.md |
| SGS-002 | Playwright acceptance harness | M1 | M1.3 | site | standard | | | sgs-002-playwright-acceptance-harness | 4ea5992 | integrated | 0 | 16 | tickets/SGS-002-playwright-acceptance-harness.md |
| SGS-003 | Validate and cap /api/fight inputs | M1 | M1.5 | wotr-combat-simulator | high | SGS-001, SGS-002 | | sgs-003-validate-fight-inputs | 61a777d | integrated | 0 | 17 | tickets/SGS-003-validate-fight-inputs.md |
| SGS-004 | Apply combat dice and leadership-reroll caps | M1 | M1.9 | wotr-combat-simulator | high | SGS-001, SGS-003, SGS-007 | | sgs-004-wotr-combat-caps | 0a84a2e | integrated | 0 | 19 | tickets/SGS-004-wotr-combat-caps.md |
| SGS-005 | Run N battles and report outcome frequencies | M1 | M1.6 | wotr-combat-simulator | high | SGS-001, SGS-002, SGS-004, SGS-007 | | sgs-005-n-battle-outcome-frequencies | da88cc1 | integrated | 1 | 20 | tickets/SGS-005-n-battle-outcome-frequencies.md |
| SGS-006 | Publish /api/fight OpenAPI spec, shared types, and contract check | M1 | M1.7 | wotr-combat-simulator | high | SGS-002, SGS-005 | | sgs-006-fight-api-contract | 2979b3d | integrated | 0 | 21 | tickets/SGS-006-fight-api-contract.md |
| SGS-007 | Add unit test runner | M1 | M1.10 | site | standard | | | sgs-007-unit-test-runner | e2ce61d | integrated | 1 | 15 | tickets/SGS-007-unit-test-runner.md |
| SGS-008 | Skip Vercel deploys for the state branch | M1 | | site | standard | | | sgs-008-skip-vercel-deploys-for-state-branch | 2a8b73e | integrated | 0 | | tickets/SGS-008-skip-vercel-deploys-for-state-branch.md |
| SGS-009 | Update combat doc for SGS-003 input validation | M1 | | wotr-combat-simulator | low | SGS-003 | | sgs-009-combat-doc-input-bounds-current | 97cae74 | integrated | 0 | 18 | tickets/SGS-009-combat-doc-input-bounds-current.md |
| SGS-011 | Remove stray /api/models/army route | M1 | | wotr-combat-simulator | high | | | sgs-011-api-models-army-resolver-error | 9336369 | integrated | 0 | 23 | tickets/SGS-011-api-models-army-resolver-error.md |
| SGS-010 | Fix malformed-JSON acceptance test path | M1 | | wotr-combat-simulator | low | | | sgs-010-malformed-json-test-wrong-path | 8bdd45d | integrated | 0 | 22 | tickets/SGS-010-malformed-json-test-wrong-path.md |
| SGS-012 | Upgrade npm dependencies to current stable | M2 | M2.10 | site | high | | | sgs-012-upgrade-dependencies | da77a09 | tested | 1 | 24 | tickets/SGS-012-upgrade-dependencies.md |
| SGS-013 | Write the AoE4 build order design doc | M2 | M2.1 | aoe4-build-order | high | SGS-012 | | | | spec_ready | | | tickets/SGS-013-aoe4-design-doc.md |
| SGS-014 | Add the English aoe4world snapshot, rules files, model types and data loader | M2 | M2.2 | aoe4-build-order | high | SGS-012 | | | | spec_ready | | | tickets/SGS-014-aoe4-data-model-loader.md |
| SGS-015 | Add the Recharts series chart component | M2 | M2.6 | aoe4-build-order | standard | SGS-012 | | | | spec_ready | | | tickets/SGS-015-aoe4-series-chart.md |
| SGS-023 | Update ARCHITECTURE.md stack versions after the dependency upgrade | M2 | M2.10 | site | low | SGS-012 | | | | spec_ready | | | tickets/SGS-023-architecture-stack-versions.md |
