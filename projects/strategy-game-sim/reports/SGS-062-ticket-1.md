# SGS-062 ticket report 1

Ticket: tickets/SGS-062-aoe4-veterancy-convert-units.md. New ticket, outline F, M4.2, risk high, depends on SGS-056 (not yet in TASK-GRAPH or tickets/ when written).
Size ~100 business-logic lines. Diagram: read/act/record flowchart (core event loop). Open questions: none.
Checked against origin/main d5c2549 (scratch copy): the 6-line grep count, line numbers, and the 13 + 53 = 66 sum.
Not run: the 845 s / 850 s expectations (taken from design C5; the sum matches today's counts).
Overlap: SGS-056 (strictNullChecks) touches simulate.ts; later tickets G and H edit simulate.ts after this one.
