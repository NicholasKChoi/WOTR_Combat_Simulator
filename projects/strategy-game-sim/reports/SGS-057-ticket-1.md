# SGS-057 ticket report 1

File: tickets/SGS-057-aoe4-zod-schema-text-to-build.md (new). Code facts come from origin/main d5c2549 (the local main checkout is stale at f078c11).

Summary: Component aoe4-build-order, M4.1, risk high, depends on SGS-056. About 620 added and 533 deleted business-logic lines. Adds zod, `schema.ts` (C2), `text-to-build.ts` (C4a), `StepOptions.names`, `buildOrderFrom` in acceptance/helpers.ts, OpenAPI `BuildOrderIssue.suggestion` with the contract spec rows. Deletes validate.ts and its two test files, re-points 12 importers, swaps the route to checkBuildOrder/checkSimInputs (text and buildOrder both still accepted). Docs updates in the same diff.

Diagrams: none (single component).

Open question: 1 (owner/designer) size over ~400 lines, with a proposed B1/B2 split in the ticket. Not split.

Findings for the manager:
- data.acceptance.test.ts asserts model.ts exports exactly 29 types by regex; moving BuildOrder, BuildStep, Trigger, BuildStart to re-exports breaks it. In Scope 5.
- The design's field vs cross-field rule changes combined-issue output; existing tests asserting combined issues get a rule in Scope 9.
- Plan outline B did not name `data.acceptance.test.ts`, `nodeRefIssue` (moved to schema.ts), or a spec for `buildOrderFrom`; the ticket adds all three (new spec acceptance/aoe4-build-order-from.spec.ts).
- Criteria commands run on origin/main: 13 import lines in 12 files; 37 lines in 10 files for the removed-symbol pattern; zero zod imports today.
- Overlap: SGS-056 (not yet written as a ticket file) edits validate.ts minimally; this ticket deletes it. No other overlap.
