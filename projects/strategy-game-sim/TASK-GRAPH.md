# Strategy Game Simulator: Task graph

Structured rows only. Narrative lives in the ticket file.

Statuses: `draft` → `spec_ready` → `ready` → `in_progress` → `needs_review` → `reviewed` → `tested`
→ `in_review` → `awaiting_merge` → `integrated`. Side states: `needs_spec`, `rework`, `bounced`,
`blocked`, `superseded`, `discarded`.

| id | title | milestone | criteria | component | risk | dependsOn | relatesTo | branch | branchTip | status | reworkCount | pr | ticket |
|----|-------|-----------|----------|-----------|------|-----------|-----------|--------|-----------|--------|-------------|----|--------|
| SGS-001 | Draft WOTR combat design doc | M1 | M1.1 | wotr-combat-simulator | high | | | sgs-001-wotr-combat-design-doc | 7b26c65 | in_review | 0 | 14 | tickets/SGS-001-wotr-combat-design-doc.md |
| SGS-002 | Playwright acceptance harness | M1 | M1.3 | site | standard | | | sgs-002-playwright-acceptance-harness | 8c0b80a | blocked | 0 | | tickets/SGS-002-playwright-acceptance-harness.md |
| SGS-003 | Validate and cap /api/fight inputs | M1 | M1.5 | wotr-combat-simulator | high | SGS-001, SGS-002 | | | | spec_ready | 0 | | tickets/SGS-003-validate-fight-inputs.md |
| SGS-004 | Apply combat dice and leadership-reroll caps | M1 | M1.9 | wotr-combat-simulator | high | SGS-001, SGS-003, SGS-007 | | | | spec_ready | 0 | | tickets/SGS-004-wotr-combat-caps.md |
| SGS-005 | Run N battles and report outcome frequencies | M1 | M1.6 | wotr-combat-simulator | high | SGS-001, SGS-002, SGS-004, SGS-007 | | | | spec_ready | 0 | | tickets/SGS-005-n-battle-outcome-frequencies.md |
| SGS-006 | Publish /api/fight OpenAPI spec, shared types, and contract check | M1 | M1.7 | wotr-combat-simulator | high | SGS-002, SGS-005 | | | | spec_ready | 0 | | tickets/SGS-006-fight-api-contract.md |
| SGS-007 | Add unit test runner | M1 | M1.10 | site | standard | | | sgs-007-unit-test-runner | e2ce61d | integrated | 1 | 15 | tickets/SGS-007-unit-test-runner.md |
