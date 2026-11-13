# SGS-154 spec gate 1

Verdict: NEEDS_SPEC. Risk `low` is correct (test-only, no critical path, no strongModelTrigger).

Read at origin/main (41b3ed3).

## Gaps

1. Item 4 (house-warnings, held warning) - the behavior no longer exists - correct as written (check 13) -
   Commit a933173 ("Plan auto-houses from the start...", #117) removed the `auto-houses-held` and
   `auto-houses-never-start` warnings from the engine, result type, OpenAPI schema and docs. It also deleted
   `acceptance/aoe4-simulate-api-house-warnings.spec.ts` entirely, so the ticket's "add a test to the named
   spec" names a file that is not at main, and `git grep auto-houses-held origin/main` over lib/app/data/docs
   returns nothing. The test cannot pass; the criterion "fails if the build produces zero or two held
   warnings" is unsatisfiable. An implementer would invent a substitute or ship a failing test.
   Fix: drop item 4 and its acceptance bullet into the "Dropped" list (house planning is covered by the
   house-rule and house-gate specs), or replace it with a behavior that exists at main (for example, a
   rule over the knight/longbow response such as "no `auto-houses-*` code appears in `warnings`", which a
   schema-based contract test may already cover). Needs a one-line owner decision only if the owner wants
   a replacement; otherwise the ticket author can drop it.

2. Item 5 (spear-longbow men-at-arms timing) - the "Castle landmark step" does not exist - correct as
   written (check 13) -
   In `data/aoe4-build-order/builds/english-spear-longbow-maa-crossbow.json` there is no landmark or age-up
   step (grep for landmark/age returns only building names). The first `man-at-arms` step (barracks) is
   triggered by `{ "kind": "time", "seconds": 681 }`; the deleted test's `CASTLE_LANDMARK_SECONDS = 681` was
   that trigger value, not a step's `completedAt`. The build has many `man-at-arms` produce steps (one
   triggered at 681, others at 790 and later), so "found by its action and unit" is ambiguous. An
   implementer cannot compute "completedAt of the Castle landmark step" and would guess.
   Fix: state the rule as "the first `produce man-at-arms` step's `armedAt` equals its own time-trigger
   `seconds` read from the build JSON (`trigger.kind === 'time'`), `startedAt >= armedAt`, `waitBreakdown.resources`
   is within 1e-3 of `startedAt - armedAt`, and no step is `waiting`", and name the selection (first
   man-at-arms produce step with a time trigger). Say the tolerance. Also note `builds.test.ts:175` already
   asserts the armedAt-equals-trigger rule at unit level, so the acceptance value is the API wire path.
   The acceptance bullet for item 5 must change to match ("arms at any instant other than its time trigger").

## Checked and fine

- Items 1, 2, 3, 6, 7, 8 are grounded: `finalCount` was removed from helpers.ts, `INFINITE_NODES`, `simulateOk`,
  `WARM_UP_TIMEOUT_MS`, `buildOrderFrom`, `postSimulate` exist; veterancy-conversion spec is absent at main (ticket
  says restore); knight/longbow build has `veteran-longbowmen` research; `node-depleted` and `idle-arrival`
  warnings still exist (contract spec lists them with `farm-idle` and `step-stuck`).
- No pinned numbers remain in items 1-3, 6-8; preconditions are required. Invariant A3 listed, no contradiction.
- Open questions none; Unverified assumptions none is fine (own API); On merge none; diagrams not needed; no
  docs affected; no other ticket removes the code involved (not exhaustively cross-checked against
  TASK-GRAPH).

## Notes

- Ticket Context says deletion commit 27e8840 holds the removed tests; the house-warnings and edges test
  bodies are readable there, but the house-warnings file's other tests were deleted later by a933173, so the
  "about nine existing files" count in LOC estimate is off (house-warnings and veterancy-conversion are not
  existing files). Not blocking once item 4 is dropped.
- Item 1 should read the key list from the OpenAPI schema only if simple; otherwise the key list is the
  contract and fine. Note the deleted key list may have changed since (a933173 and later edits); derive
  from the schema or confirm the current top-level keys.
- Item 3 sample choice: pick the last sample strictly before `completedAt` and the first at or after it.
