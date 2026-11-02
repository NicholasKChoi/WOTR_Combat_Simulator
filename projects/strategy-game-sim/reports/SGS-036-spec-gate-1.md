# SGS-036 spec gate 1

Verdict: READY

Checked against main f078c11, design/M3.md (Route, Left-to-tickets rows, Contracts table), CONTEXT.md, INVARIANTS.md, and the SGS-040/045/054 tickets.

## Checks
1. Grounded scope: pass. All named items exist. In simulate.ts, `'issues' in parsed` is in checkOrder and the combined issues line is as quoted. In parse-text.ts, `WHITESPACE` is line 22 and `sawStep` is lines 223, 243 and 263. The `steps.forEach` is at validate.ts:189. `SimulateError` is in api.ts. `errorMessages` and `simulation-error` are in the page. The `Record<keyof SimulateError, true>` map is at contract spec line 298. The OpenAPI `SimulateError` and the docs passages exist at the cited places.
2. Testable criteria: pass. Counts are concrete (100, 101, 60+60=120 gives 20 omitted). The 60 inputs issues are reachable over HTTP with 60 unknown `inputs.trips` keys, since `resolveTrips` emits one `unknown-id` issue per key. A sparse-array hole reaches `stepShape(undefined)`, which returns "is not an object", so the hole and `null` give the same issue as claimed.
3. Open questions: none. CONTEXT.md and the ticket list none.
4. Invariants: S3 is named and the ticket is what satisfies it. No A2/A3 contact.
5. Contracts: match design/M3.md Route (`MAX_REPORTED_ISSUES = 100`, `omittedIssues?`, "N more issues not shown.") and the Contracts table row for api.ts. SGS-054 and SGS-040 cite this ticket's names consistently.
6. Dependencies and size: none, about 45 LOC.
7. Diagrams: none needed, and the ticket says why.
8. Lessons: both LESSONS.md files are empty.
9. Decisions: the body agrees with the design's decision rows 616-619.
10. On merge: none, and nothing needs naming.
11. Risk: high is correct, because `lib/**` is a criticalPath.
12. Docs: the stale docs passages and OpenAPI description are in Scope 6 and 8. The SGS-054 audit covers the rest.

## Notes (non-blocking)
- The page criterion ("a 400 with `omittedIssues: 5` shows ...") does not say how a test produces it. Over HTTP it takes more than 100 issues. A Playwright route intercept on the 400 response is the simplest. Name the test layer for it, and for the route cap criteria (acceptance spec versus unit), so the implementer does not guess.
- Scope 5 does not say that `errorMessages` returns `string[]` today. The omitted line can be appended as a string in that array, or tracked in separate state. Either works. Appending a string is the smaller change and keeps the list inside `simulation-error`.
- "1 more issues not shown." is ungrammatical for N=1. The ticket states the design text is used for any N, so this is deliberate.
- SGS-040 and SGS-045 also edit parse-text.ts and the page. The ticket has no dependencies, so merge order only means a rebase.
