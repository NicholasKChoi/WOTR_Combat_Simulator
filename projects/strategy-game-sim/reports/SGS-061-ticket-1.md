# SGS-061 ticket author report 1

Ticket: tickets/SGS-061-aoe4-api-rejects-text.md (new, milestone M4, criterion M4.1, risk high, base main).
Title: The simulate API rejects `text` (breaking), OpenAPI 2.0.0. Component aoe4-build-order. About 25 business-logic lines
(route about 20, api.ts 2); OpenAPI, docs and spec edits excluded. Depends on SGS-059, SGS-060 (transitively SGS-057).

Scope: route (removed-text issue, missing buildOrder, checkBuildOrder, inputs always checked), api.ts, OpenAPI 2.0.0
(SimulateRequest required/not, examples, 400 examples, descriptions), docs Route/Issues/bounds/diagram, and replacement of the
16 leftover text-rule spec lines (api, edges, contract; waits needs no edit).
Diagram: read/act/record flowchart of the request path. Open questions: none.
Checks run on origin/main: text grep prints 75 lines; SimulateRequest jq shows [null,null,true,[buildOrder,inputs,text]];
route grep for parse-text/textChars finds 3; api.ts text finds 1; docs grep for old phrasing finds 6; stale-string jq finds 11.
The 16-line end state and the mutation check cannot run until SGS-057/060 merge; the ticket states them as criteria.
Overlap: SGS-057 also edits the docs Issues section and diagram (rebase); SGS-062/063 touch other OpenAPI schemas.
