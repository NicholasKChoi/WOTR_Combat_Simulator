# SGS-059 ticket author report 1

Ticket: tickets/SGS-059-aoe4-page-posts-build-order.md (M4 / M4.1, risk standard, depends on SGS-057, base main).

Summary: page converts the paste with textToBuildOrder and the English catalog, POSTs buildOrder (no text key), shows client rejections via new IssueList (issue-list.tsx) under the textarea, clears the result and keeps the pin on rejection, sends no POST. PageProps {builds, catalog}; StepTable prop options -> catalog; runRejected(page) in acceptance/helpers.ts; 6 page-spec rewrites (aoe4-build-order.spec 107-131 x2, 304-307, 320-327, 574-576; pin-compare 173-178), request-body asserts at aoe4-build-order.spec:92 and aoe4-step-table.spec:203; two new specs (unknown-id client issue, 20001-char text); docs Page section fix. About 75 business-logic lines. Diagram: Run read/act/record flowchart.

Criteria checks run against origin/main d5c2549: grep counts (page "options" 5 hits, step-table prop line 1, postData .text 2, toBe(400) 7+1, docs "Run posts the" 1) match Scope. The mutation criterion was not run (code does not exist yet).

Open questions: none. Ticket-local choice: BuildInput gets an `issues` prop so the list sits under the textarea (the textarea lives in BuildInput until M4.7).
Overlap: none with SGS-057 (buildOrderFrom is its). SGS-056 may shift spec line numbers; the ticket says to find tests by title. aoe4-build-order-m3-flow.spec.ts:92 also uses INVALID_PASTE but never runs, so it is kept unchanged (not in the designer list).
