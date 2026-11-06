# SGS-097 ticket 2 (re-spec)

Ticket: `projects/strategy-game-sim/tickets/SGS-097-docs-and-issue-messages.md`

Verified against origin/main 9274372.

- Gap 1: `startVillagersSchema` uses `name = start.villagers.${node}` only in `typed`/`inRange` count problems;
  `nodeAt` carries no key label. Scope now says so and routes these rows through `checkBuildOrder` (`messages` helper).
  Criterion 3's `start.villagers` row pairs a long key with count `'6'` and asserts
  `start: start.villagers.<cut> must be a number` (existing tests confirm the `start: ` location prefix).
- Gap 1 (inputs rows): `keyedRecord` reports bad keys with path `[key]`, so `checkSimInputs` puts the key in the
  label. Scope gives each site's input and today's message; `nodeAmounts` with a non-gather key gives
  `unknown node "<cut>"` via `nodeRefIssue`.
- Gap 2: criterion 3 requires whole-message equality, not `endsWith`.
- Note: plain `git grep "request: missing buildOrder" -- docs/api/openapi.json` already matches the 400 examples
  (lines 1796, 1800), so criterion 2 uses `jq` on the 400 `description` instead; checked that it lacks both strings
  today.
- Note: On merge BACKLOG deletion dropped.
- Criterion 1 grep matches openapi.json line 3328 today, as Scope implies.

Diagrams: none (no trigger). Open questions: none. Overlap: none.
