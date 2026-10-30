# SGS-011 re-spec (2026-10-29)

Ticket: `tickets/SGS-011-api-models-army-resolver-error.md`. Base read at 96d2602.

Folded in all spec-gate findings and the owner answer:

1. Owner decision (delete, path 404s) stated in Context and Source; "confirm after merge" deferral removed. Open questions: none.
2. Risk standard -> high (WOTR Paths list the file for W1/W2; openapi.json is a public-schema file). W1, W2, S3 named as adjacent with specifics; the generic "No INVARIANTS.md regressions" AC was replaced by one checking that no `lib/combat-simulator/` or `pages/api/fight.ts` file changes and the other caps tests are unchanged and pass.
3. AC2: dev-log check dropped; 404 is checked by the caps acceptance test and by `curl` against a manual `npm run dev` (port 3000).
4. AC1: the grep allows exactly one match, the literal `/api/models/army` request URL in the caps spec. The retitled test does not repeat the path.
5. On merge now lists the factory edits: CONTEXT.md line 22 component Paths, CONTEXT.md line 34 Key surfaces sentence, INVARIANTS.md line 23 WOTR Paths, REPO.md lines 88-89 Combat simulator Paths. CONTEXT.md Decisions line 77 already records the owner answer.

Manager action: the TASK-GRAPH row still shows risk `standard`; the ticket says `high`.
No branch work exists for this ticket.
