# SGS-067 ticket report 1

File: tickets/SGS-067-aoe4-inline-issues-suggestions.md. Component aoe4-build-order, risk standard, about 60 business-logic lines, depends on SGS-066, M4.8.
Covers: live issue list (parse issues at once, check issues after first Run then tracking), suggestions (`build-order-issue-suggestion`), `issueLines(issues)` gutter `data-error`, scroll-to-first-issue-line after a rejection, Playwright coverage of the knight + longbow gold run-out info list (code changes only if the test finds a gap), docs. Server 400 mapping dropped.
Diagram: one read/act/record flowchart. Open questions: none; two judgment calls recorded (checked flag after any Run; scroll block center).
Checks run: gold run-out info messages verified on origin/main d5c2549 (1800 s: gold 15:32, gold#2 24:37, severity info); paste samples parse as the ticket says (line 62 syntax error; knigt passes parse). Spec reads messages from the response, not hard-coded times.
Overlap: SGS-059 (IssueList, issue state replaced by derived), SGS-066 (errorLines placeholder, scroll-margin idea). Unverified: `produce spearmn from barracks` yields a second check issue (design says all issues are listed); mutation criteria cannot be run before the code exists.
