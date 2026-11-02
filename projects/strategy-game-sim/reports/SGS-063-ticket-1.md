# SGS-063 ticket author report 1

File: tickets/SGS-063-aoe4-auto-house-warnings.md. New ticket from outline G, M4.3 and M4.5, risk high, depends on SGS-062.
Component aoe4-build-order, about 70 business LOC: simulate.ts held-seconds record and accrual plus two warning builders; depletion.ts tieRank; model.ts two SimWarning variants. OpenAPI SimWarning.oneOf, the contract spec's simWarningVariants tuple and code-order assertion, and the docs (house section, Severity table, warnings bullet) change in the same diff.
Diagram: read/act/record flowchart.
Open questions: none for owner or designer. Two gaps the design leaves are fixed as rules in the ticket: the gate is evaluated after the instant's steps ran, and payOrder flags only its supply clause.
Notes: the shipped knight-longbow build's last three houses are plain steps, not reactions, so never-start should not fire there; the implementer reports observed warnings for all three shipped builds. Grep criteria verified against origin/main d5c2549 (step-stuck 7 lines, "they stay off; with no" 1 line). The mutation check was not run (code to be added does not exist yet).
Overlap: SGS-062 edits simulate.ts (spawn ledger, unitSeries) and OpenAPI/docs unit-tier text; no overlapping lines. Existing exact-warnings assertions (listed in the ticket) may need the test rule applied.
