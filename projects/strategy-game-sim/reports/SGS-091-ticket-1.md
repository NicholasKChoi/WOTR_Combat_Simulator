# SGS-091 ticket author report

Ticket: projects/strategy-game-sim/tickets/SGS-091-aoe4-engine-cleanups.md. Risk standard, dependsOn none, ~60 business-logic lines (no split needed).
Verified every bullet against origin/main cc9bb04 in a throwaway worktree (removed).

Covered (BACKLOG.md line numbers): 30 (test only), 32, 33 (gather.ts literal, RESOURCE_ORDER), 39, 46, 47.
Dropped with evidence: 28 (messages use baseId since 9f36c50), 29 (GATHER_NODE_ORDER and validate.ts gone), 31 (only helper is test-helpers.ts), 33's Resources part (single declaration), 34 (drawDown change alters amounts; STEP_NODE_FIELDS pinned by runRefs tests, table renamed OPTIONAL_STEP_FIELDS), 37 (compare.ts imports AGE_NAMES), 45 (snapshot data issue, outputs already correct).
Notes: the only intended output change is unknown-id truncation to 40 chars + "..." (exact text in the ticket). acceptance/aoe4-narrow-layout.spec.ts asserts the full 3000-char id and must change. The issue path still carries long object keys (out of scope; possible new backlog item).
Criteria with grep commands were checked against main: gather.ts literal and RESOURCE_ORDER match today; the 'in' narrowing matches today in the API handler. No overlap with SGS-081/082.
