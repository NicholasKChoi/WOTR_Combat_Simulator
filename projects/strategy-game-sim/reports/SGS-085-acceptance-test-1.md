# SGS-085 acceptance-test 1

Verdict: PASS. Commit 8e88f78 on sgs-085-aoe4-text-editor-issue-ux (on top of 75f074f). Only `acceptance/aoe4-build-order-inline-issues.spec.ts` changed.

## Tests written (all pass)
1. Gutter number of an error line is bold and a different colour from a normal line (criterion 1). One `expect.poll` over one `page.evaluate`: error line weight 700, colour differs from line 1, line 1 weight 400.
2. A syntax error lists the other lines' unknown-id issues without a Run, until the line parses (criterion 10). Pasting `start -> sheep / produce knigt from stable / build hous` shows 2 issues in order (line 2 unknown-id, line 3 syntax) and marks gutter lines 2 and 3. Fixing line 3 hides both issues and marks, and the first Run brings back the line 2 issue.
3. A rejected Run summarises the issue count, tracks edits and goes away when the Run converts (criterion 11). Absent before the first Run. Exactly `Fix 1 issue to run the simulation.` for one issue, and `Fix 2 issues ...` for two (via `runRejected`, so nothing is POSTed). The count follows edits from 2 down to 1. The summary is absent once the text is valid and a Run converts, and still absent when a later edit brings back a live issue.

## Run
Harness ran. The inline-issues spec passed 17/17. With client-check it passed 30/30. `tsc` and `lint:dup` are clean. The step-band flake did not show up.

## Mutation checks (each reverted with `git checkout --`; the tree was clean afterwards except the spec)
- Renamed the CSS selector to `data-errorX` in `workbench.module.css`: test 1 failed.
- Made `textToBuildOrder` return only the syntax issues on a parse failure in `text-to-build.ts`: test 2 failed (`toHaveCount`).
- Forced the plural branch in `issue-list.tsx`: test 3 failed (`toHaveText`).

## Failures
None. Criteria not expressible: none.
