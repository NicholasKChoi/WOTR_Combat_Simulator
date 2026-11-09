# SGS-103 ticket author, re-spec 3

File: `tickets/SGS-103-builds-api-routes.md` (rewritten in place; change-log entry "Re-spec 2026-11-09 (second)").

Folded in:
- Gap 1: Scope item 7 and the contract criteria follow amended C3. `SavedBuild` requires every property and is open. `SavedBuildWithId` is allOf [$ref SavedBuild, id object] with `unevaluatedProperties: false`. The closed schemas are exactly `SaveBuildResponse`, `BuildsError` and `SavedBuildWithId`. The contract spec asserts the live GET body validates, and that an extra property or a missing `id` fails.
- Gap 2: the One-source grep uses `request body: must be a JSON object`. On main it matches only `simulate.ts` (which moves to `api-route.ts`), not `pages/api/fight.ts:67`. Checked by running it.
- Non-blocking notes: removed the stray memo clause; Invariants S3 now quotes INVARIANTS.md; `webServer.env` filters undefined values and drops `BUILDS_STORE_ID` and `VERCEL_ENV`, and must pass tsc; `postBuildRaw` sends `Content-Type: application/json`; the surface spec title is updated with its path list; On merge adds the new routes and files to CONTEXT.md Key surfaces.
- The ticket copies no C3 save-check example rows, so none needed matching.

Diagrams: none required. Open questions: none. Overlap: none new. Size unchanged (~180 lines).
