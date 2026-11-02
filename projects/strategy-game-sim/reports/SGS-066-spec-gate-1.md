# SGS-066 spec gate 1

Verdict: READY

Checked against origin/main code, design/M4.md (C8, Behavior rules "Page run, editor and tabs"), CONTEXT.md, INVARIANTS.md, SGS-059 and SGS-067 tickets.

- Grounded: build-input.tsx (rows={16}, one build-order-text hit, local `selected`), pages/apps/aoe4-build-order.tsx, docs "Page" section (line 764, "textarea stays editable" at 777), acceptance specs and helpers exist. New files are marked new.
- Criteria are observable; grep criteria hold in the end state; mutation criterion (lineCount) is covered by the unit test and spec 6 (`a\nb\n` gives 3). Existing-test rule (A to D) is a rule, not a list.
- Open questions: none; design answers (derived shown tab, issues under both views, errorLines moved to SGS-067) match the body.
- Invariants S1, S2, S3 named, no contradiction. Contracts match C8 and SGS-059 (IssueList and the `issues` prop leave BuildInput; SGS-059 adds them, this ticket removes them; consistent). Depends on SGS-059 stated.
- Size about 190 lines, diagrams present, Risk standard fits (no strongModelTriggers or criticalPaths), On merge none is right, docs in Scope with greps.
- LESSONS files are empty.

Notes (non-blocking)
1. Spec 7: `wrap="off"` can add a horizontal scrollbar; with 30 short lines it does not, but if an implementer uses long lines the `scrollHeight <= clientHeight` assertion may be flaky. Keep the test lines short.
2. "scroll-margin-top of the run bar's height or equivalent" leaves the value to the implementer; spec 2 and 5 assert the observable outcome, so this is fine.
3. Sticky positioning needs no ancestor with overflow other than visible; Layout (components/layout.js) is a plain container div, so it should hold. Verify in spec 5.
4. Rule A assumes tests that click `pin-run` or `unpin-run` after a rejected run do not exist; Rule D ("implementer lists every test it edits") covers any that do.
