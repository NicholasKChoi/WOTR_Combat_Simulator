# SGS-099 ticket 3 (re-spec)

File: tickets/SGS-099-saved-build-record.md. Folded in spec-gate-1 blockers and notes plus design pass 4 item 2.
- 20000-char row: mocked formatBuildOrderText returns 20001 chars once; asserts 400, `text: 20001 characters, more than 20000`, no 413.
- 413 test: multi-byte `source` (30,000 three-byte chars), never `name`; Scope says only source can reach 413.
- Step 7: `error` is first issue's message (guard: its one message); claim about today's formatter, no test depends on it.
- api.ts header comment update added to Scope item 2 and criteria.
- "exports each C1 name" plus the import grep.
Open questions: none. Overlap: none new. Diagrams: none required. No new command criteria beyond the existing import grep (unchanged).
