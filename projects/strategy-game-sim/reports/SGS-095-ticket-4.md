# SGS-095 ticket re-spec 4 (written by the manager from the agent's returned text)

Re-specced in place. SGS-098 ticket did not exist yet, so the item 1 / criterion 2 rule is conditional.
- Depends on: SGS-098; branch sgs-095-test-hygiene stacks on SGS-098's branch, rebased onto origin/main once SGS-098 is integrated.
- "No test removed" now means no test removed by SGS-095; acceptance should be green on top of SGS-098.
- Item 1 and criteria 1-2 hold only while a test using MAN_AT_ARMS_STEP remains in the spear/longbow spec after SGS-098 (only the men-at-arms timing test, a loop over two durations, uses it; the two gold-deposit tests do not). If SGS-098 deletes it, they drop. Contrast run uses SGS-098's branch.
- Open questions: none. Added "## Re-spec 2026-11-06 (3)". Items 2-4 on bff8a52 stand.
- Manager: confirm which spear/longbow tests SGS-098 deletes.
