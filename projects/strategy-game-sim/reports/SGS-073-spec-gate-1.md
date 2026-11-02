# SGS-073 spec gate 1

Verdict: NEEDS_SPEC

## Gaps
1. Scope item 5, last bullet (3000-char line) - the text is rejected client side (M4 Run steps, C8), so no POST is sent, and `runSimulation` in `acceptance/helpers.ts` waits for a POST response and would time out. The ticket names only `openPage` and `runSimulation`. Fix: say the test uses `runRejected(page)` (SGS-0xx ticket 3, design M4 C8; add that ticket to Depends-on if it is not already covered by SGS-066 to 072) and asserts one `build-order-issue` is visible before the scrollWidth check.
2. Scope item 5 / criterion 3 - the test must exercise the long-message wrap, but the ticket does not say the issue message quotes the line text. A syntax issue message might not contain the 3000 characters, so the test could pass without covering the offender; Scope item 1 also speaks of a 20001-character paste, a different input. Fix: state the input that puts the long unbroken string into an issue message (for example the C8 syntax message that quotes the token, or the 20001-char `out-of-range` text, which only quotes the count) and assert the issue's text contains the long run, so the test can fail for the right reason. Make the 20001 and 3000 figures consistent.

## Checks that passed
- Grounded: `docs/aoe4-build-order.md` "Page" at line 762 on main; `classnames` is in package.json; `openPage` and `runSimulation` exist; `table-responsive` is on main's `step-timeline.tsx` (SGS-069 replaces it); `step-table.module.css` is created by SGS-068; no module.css exists in the component dir today. Page section uses `container`.
- Test ids, 30rem, 768 px, the sticky run bar and the test-owner rule match design/M4.md Behavior rules (lines 480-483) and SGS-068/069/074. SGS-074 no longer repeats the 390 test.
- Invariants: S1 holds. Risk low is right (no criticalPaths symbol). Size is under 400 lines. Diagrams not required. No open questions. No lessons entries apply. On merge none is fine.
- Docs: the docs paragraph and the desktop-only grep are in Scope (grep of main found no desktop-only statement).

## Notes
- The Results-tab test should say it clicks `tab-results` before measuring.
