# SGS-011 spec gate

Verdict: NEEDS_SPEC

Verified against 96d2602 (local `main` is stale at 533e579; the code was read from the 96d2602 commit):
- `pages/api/models/army.ts` exists and is a 2-line re-export. `git grep models/army` finds only `ARCHITECTURE.md:55`, `acceptance/fight-api-caps.spec.ts:132`, `acceptance/fight-api-spec-surface.spec.ts:26` and `docs/api/openapi.json:6`. No code imports it.
- Line numbers in Scope match (`openapi.json` line 6, spec-surface lines 26-27, caps lines 131-134).
- The ARCHITECTURE.md edit is well-defined (lines 54-57).

## Gaps

1. Decisions - the ticket reverses a recorded owner decision - owner. CONTEXT.md Decisions says "`/api/models/army`: stays where it is, documented as not part of the API." The ticket supersedes this and defers confirmation to the manager "when it applies the factory-file edits", which is after merge. Open questions says "None" while describing an unconfirmed reversal. An implementer is told to delete a route the owner decided to keep. Fix: the owner confirms the reversal before implementation starts, and the ticket records the confirmation (date) and moves the Decisions edit from "after merge" to "now". Alternatively, the owner declines and the ticket is dropped.

2. Risk / Invariants - understated risk and unnamed adjacent invariants - not owner. `pages/api/models/army.ts` is listed in INVARIANTS.md WOTR `Paths:` (W1, W2). `strongModelTriggers` includes "touches an invariant in INVARIANTS.md" and "changes a public schema, API, or cross-component contract"; the ticket also edits `docs/api/openapi.json` and removes a served route. The ticket says "no invariant logic touched" and sets `Risk: standard`. Per the criteria, any trigger means `high`. Even if the route is "not part of the API", the file is in an invariant's Paths. Fix: set `Risk: high` (or state why the trigger does not apply, since the manager decides), and add a line naming W1, W2 and S3 as adjacent, with "no change to combat logic or caps". Replace the vague "No INVARIANTS.md regressions" with that.

3. Acceptance criteria - AC2 is hard to check - not owner. "dev server log shows no `resolver is not a function` error during `npm run acceptance`" has no stated way to capture the log, since Playwright starts its own `next dev`. Fix: drop the log clause and rely on the caps test expecting 404. Or say how to capture it, e.g. run `npm run dev` manually, `curl -s -o /dev/null -w '%{http_code}' localhost:<port>/api/models/army` returns 404, and the log is clean.

4. Acceptance criteria - AC1 grep scope ambiguity - not owner. "finds no reference except the 404 assertion" conflicts with the renamed test, whose title may also contain "army model". The grep only matches the path string, so it is fine. Say explicitly that the caps spec keeps the literal `/api/models/army` request URL, and that the test title should not repeat the path. Minor.

## Checks that passed
- Grounded scope, size (~0 logic), dependencies (none), diagrams (none needed), contracts (no new names; `/api/fight` and its schemas untouched), LESSONS (no entries), On merge (none, and factory edits are listed under Scope).

## Notes
- The Factory files list should also include REPO.md `Combat simulator Paths:` (it lists `pages/api/models/army.ts`). Without it, review paths stay stale.
- The PROJECT/CONTEXT component table (line 22) is already listed. The `Paths:` lines in INVARIANTS.md W section header also list the file (the ticket mentions line 23 only).
- The openapi description wording "may change or disappear" means no consumer is promised the route, so removing it is consistent with the published spec.
