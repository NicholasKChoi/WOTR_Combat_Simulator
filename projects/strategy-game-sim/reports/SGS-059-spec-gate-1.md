# SGS-059 spec gate 1

Verdict: READY

Checked against origin/main d5c2549, design/M4.md (C2, C4a, C8, Behavior rules, ticket order row 3), SGS-075, CONTEXT.md, INVARIANTS.md.

1. Grounded: page, build-input, step-table, helpers, specs and docs line 762 all exist as described. Page `options` grep: 5 hits (16,24,30,50,105). step-table `^\s+options: ` 1 hit (line 25). `toBe(400)` counts 7 and 1. postData `.text` grep 2 hits (spec:92, step-table:215). `Run posts the$` hits docs line 766 only (ticket says 762; line drift, ticket says to find by text).
2. Criteria testable; greps hold in the end state; existing-test rule is stated (unlisted tests keep expected values).
3. No open questions.
4. S3 named, no contradiction (duration unchecked client-side, route enforces bounds; text cap in textToBuildOrder).
5. Names match C2/C4a/C8 and SGS-075 (buildOrderFrom, re-exports). BuildOrderCatalog extends StepOptions per design.
6. Size ~75 LOC. 7. Diagram present. 8. No lessons. 9. Matches design. 10. On merge none: fine. 11. Risk standard: no trigger (route unchanged). 12. Docs scope present.

Notes (non-blocking)
- The 20001-character criterion calls for a new Playwright test but Scope item 5 does not say which spec file holds it; put it in aoe4-build-order.spec.ts beside the knigt test.
- Docs line ~830 ("A 400 shows every returned issue's message ... so only the error list shows") and ~811 ("a 400 shows none") stay true for server 400s but now read as if paste errors come from the server; consider one added sentence that paste rejections show under the textarea instead. Scope's grep criterion would not catch this.
- Scope item 5 names the notes test by line (304-307) only; its title is "warnings list warnings before warning-severity notes in result order; info expansion survives a failed run and resets on reload".
- runRejected waits for build-order-issues visible; if a spec runs two rejections in a row, the first list satisfies the wait for the second. No listed spec does this.
- Doc line numbers (762 vs 766) are off by 4; harmless.
