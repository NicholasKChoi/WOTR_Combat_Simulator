# SGS-154 ticket author, re-spec 4

File: `$PROJECT_DIR/tickets/SGS-154-re-add-unpinned-aoe4-acceptance-coverage.md` (lint clean).

Cause: re-specs 1 to 3 copied rules from the deleted tests and the schema without running them. The engine at origin/main (41b3ed3) differs in three ways: the default continuous villager order keeps producing past a `produce villager` step, the producer rally persists so later villagers also walk to the rally node, and a numbered deposit's `depletedAt` differs by float rounding between runs.

Each rule below was run in a throwaway vitest probe in a detached worktree (removed). The probe called `simulateBuildOrder` at the default horizon and at 3600 s, and every rule held at both. The worktree prune printed "Device or resource busy" for other tickets' worktrees; that is deferred cleanup.

Changes:
- Item 1: the villager series never decreases and ends at or above the produce count, with no equality. Probe: 23 at 1200 s for 3 produced.
- Item 6a: `gathered.food` rise equals the stock, and the `floating.food` rise plus the `spent.villagers` rise equals the stock. The `depletedAt` non-multiple check is kept.
- Item 6b: exactly one berry `idle-arrival`, `at` above 0, and `idleVillagers` between the produce count and the villager series' last count.
- Item 6c: deposit 2's `node` and `amount` equal, and `depletedAt` within 1e-6. Deposit 1's row equals `{ node: 'gold', amount: null, depletedAt: null }`.
- Item 7: precondition is villager last count of at least 40. `spent.villagers` is a whole multiple of the cost and at least last count times cost. `spent.buildings` is positive and a multiple of the house cost; military and research end at 0. Probe: 43 villagers and 2150 spent at 1200 s and 3600 s; at 600 s only 30 villagers, which would trip the precondition (the default horizon is 1200 s, so no issue).
- Acceptance criteria for items 1, 6 and 7 are updated to match. A `## Re-spec 4` section is appended.

No open questions. No diagrams (test-only). Items 2 to 5 and the Dropped list are unchanged; the gate verified them. No overlap with open tickets.

Caveat: the probe ran the engine directly, not through the API route. The route calls the same engine with the same inputs.
