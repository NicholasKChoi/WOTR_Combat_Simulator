# SGS-010 ticket report

- Ticket: tickets/SGS-010-malformed-json-test-wrong-path.md
- Risk: low (test-only, one file, about 4 lines). Depends on: none. Base main 96d2602.
- Findings: confirmed at 96d2602. The test sends a non-JSON string, which Playwright JSON-encodes, so the object-shape 400 fires instead of Next's `Invalid JSON` plain-text 400. That 400 comes from Next's body parser, not pages/api/fight.ts (correcting the bug note). The null/[]/true/3/"x" tests are unaffected because they parse as JSON.
- Decision: fix in place (Buffer, keep status 400 + expectNoBattle); the exact text assertion stays only in the contract spec, so no duplicated coverage. Deleting is the alternative; noted in the ticket.
- Open questions: none.
