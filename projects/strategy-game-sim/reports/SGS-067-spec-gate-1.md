# SGS-067 spec gate 1

Verdict: READY

Checks (against origin/main plus the Depends-on tickets SGS-059/066, since `issue-list.tsx`, `build-text-editor.tsx` and `text-lines.ts` are created by them and do not exist on main yet):
1. Grounded: `message-lists.tsx` (`simulation-notes-toggle`, `simulation-notes-list`, `Show N info messages`), `messages.ts` `resultMessages`, `acceptance/helpers.ts` `runSimulation`/`SIMULATE_PATH`, and the ENG Knight/Longbow build exist on main. The new-in-dependency files match SGS-059/066 text.
2. Criteria testable, greps hold in the end state. Existing-test rule is stated as a rule, not a list.
3. No open questions.
4. S1, S3 named, no contradiction.
5. Names match design C8, SGS-057 (`suggestion`), SGS-059, SGS-066 (SGS-066 explicitly defers `errorLines`/`data-error`/`issueLines` here).
6. About 70 LOC, dependency stated.
7. Diagram present.
8. No lessons entries.
9. Agrees with design Behavior rules (inline issues when shown / many, info list rows).
10. On merge none: correct.
11. Risk standard: no strongModelTriggers item applies (page state, no simulation or schema change).
12. Docs: item 5 covers docs plus greps; on main the stale phrases are not present yet (SGS-059/066 write them).

Notes (non-blocking):
- Criterion "A server 400 (mocked) ... never in build-order-issues, no data-error" has no spec in item 4. Add the assertion to the existing mocked-400 test (SGS-066 spec 3) and name it in Scope.
- Spec 2 "valid Run sets the flag": after a 200 the Results tab is active, so the following fill needs `tab-build` first (SGS-066 Rule B). State it in the spec.
- Specs 5 (62-line and 20001-char) trigger the issue live, so `runRejected` returns at once (issues already visible) and may return before the scroll effect runs. Assert viewport position with a polling check (`expect.poll` or `toBeInViewport`), not a one-shot bounding box.
- The scroll trigger mechanism (a state value consumed by an effect after `panel-build` is shown) is left to the implementer; fine, but a rejection while the Build tab is already visible must still scroll (effect keyed on a per-Run counter, not on tab change).
