# SGS-097 spec gate 1

Verdict: NEEDS_SPEC

## Gaps

1. Acceptance criteria 3 (new test table) - the `start.villagers` row cannot catch a revert of the `name` change.
   In `schema.ts` (origin/main 9274372, `startVillagersSchema`, ~line 464) `name = start.villagers.${node}` is used only by
   `typed(name, ...)` and `inRange(name, ...)`, which report on the *count*. The key is checked by `nodeAt('start.villagers', false)`,
   whose message is `unknown node "<quoted>"` with `field: 'start.villagers'` and no key-bearing label. The ticket tells the
   test to pick keys that "fail with a reason (for example `x` repeated, an `unknown-id`)". An unknown-id key alone never
   renders `name`, so reverting `shortText(node)` leaves all 41 and 5000 rows green. This contradicts the ticket's own
   "reverting either `shortText` call makes the rows fail". Also, any key over 40 chars is always an invalid node, so the
   count problem must be forced.
   Fix: for the `start.villagers` site, say the row supplies a long key with an invalid count (non-number, or out of
   range for `startVillagers`), and that the asserted message is the count message
   (`start.villagers.<cut key> must be a number` or `start.villagers.<cut key>: <range reason>`), not the unknown-node one.
   Also state how this site is run (through `checkBuildOrder` with `start.villagers`, not `simIssues`).
   Also confirm in Scope whether the `inputs.<path>` rows (`trips`, `influenceCoverage`, `nodeAmounts`) render the key in
   the label for the chosen reason (the existing `trips key` and `influenceCoverage key` rows assert only the tail; the new
   rows must assert the `inputs.<path>.` prefix, otherwise they pass without the change).

2. Acceptance criteria 3 - the criterion asserts the label for "an offending key of length 39 and 40 appears whole",
   but does not say how the label is matched (full message equality vs endsWith). The existing table uses `endsWith(tail)`,
   which ignores the prefix, the exact thing under change. Fix: require asserting the whole message
   (`inputs.<path>.<key>: <reason>`) or a `startsWith` on the label.

## Notes (non-blocking)

- On merge says to delete the SGS-068, SGS-061 and SGS-091 BACKLOG.md bullets. They are already gone from
  `$FACTORY_DIR/BACKLOG.md` (archived in the last plan commit; grep finds none). Drop that clause or say "if still present".
- The two design/M4.md quotes in On merge match current lines 495 and 497. Good.
- Scope item 1 verified: docs/aoe4-build-order.md has no "civ default" or "Add the pair". Item 2 sites verified
  (openapi.json line 3328 text, docs line 665, the 400 description at ~1768, the node-validation sentence at line 532).
  `shortText` exists in `model.ts` and is already imported in `schema.ts`. `checkSimInputs` label is at line 685.
- Criterion 2's check (contract spec still passes) does not test the description text; add
  `git grep -n "request: missing buildOrder" -- docs/api/openapi.json` so the new text is confirmable.
- Risk standard is reasonable; no criticalPaths symbol touched; no schema-library threshold issue; no open questions;
  no diagrams trigger; no lesson conflicts; invariants A1-A3 not adjacent.
