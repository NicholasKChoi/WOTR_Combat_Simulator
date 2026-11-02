# SGS-060 ticket report 1

Ticket: tickets/SGS-060-aoe4-api-specs-send-build-order.md (M4 / M4.1, aoe4-build-order, risk standard, test-only, about 150 changed test lines, depends on SGS-057, base main d5c2549).

Summary: 11 specs have 75 `text` request-body lines. Valid pastes (about 55 bodies) go through `buildOrderFrom`; waits `simulate(request, text, inputs)` keeps its signature. Check-level rejection pastes become JSON literals; 3 grammar/line tests are deleted or trimmed (covered by parse-text and text-to-build tests); issue-cap specs use N bad JSON steps (250 case becomes 200, the step maximum). 16 old-`text`-rule or transport lines are left for the remove-`text` ticket (api 6, edges 3, contract 5, waits 2), checked against the current tree.
Diagrams: none (single component, test-only).
Open questions: none.
Overlap: SGS-057 edits the contract spec (SIM_INPUT_BOUNDS import, suggestion rows), so this ticket follows it. SGS-062 edits `-timelines` and `-spend-population` `finalCount` helpers (rebase only). SGS-059 owns page specs and `runRejected`; no shared file. `helpers.ts` untouched here.
Criteria run: the 75-line grep and the 16 leftover lines were confirmed on origin/main; no mutation criterion.
