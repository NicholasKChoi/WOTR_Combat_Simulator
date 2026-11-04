# SGS-088 tech-lead 1

## Decision
APPROVE: draft PR opened.

- PR: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/100 (draft), base `main`, head `sgs-088-aoe4-workbench-ui-state-kept` at 73b0fa1. This is a single task with no stack, so no stack footer. I pushed the branch for the first time and added no new commits. I set the body with `gh api -X PATCH` (body source: reports/SGS-088-pr-body.md).

## Reviewed
- Range: 3c7b66a (origin/main, merge base)...73b0fa1, 4 commits, all authored as choinickolas@gmail.com.
- Files: pages/apps/aoe4-build-order.tsx, components/apps/aoe4-build-order/{step-table.tsx, step-table-model.ts, build-input.tsx, workbench.module.css}, docs/aoe4-build-order.md, acceptance/aoe4-build-order-pin-compare.spec.ts, acceptance/aoe4-step-table.spec.ts, components/apps/aoe4-build-order/step-table-model.test.ts.
- LoC: 292 added, 43 removed in total. Hand-written business logic is +65/-26 (docs +11/-8, tests the rest).
- Invariants: A1-A3 and S1 checked. No engine, data, or route code changed, and the only imports are within the app. No criticalPaths symbol is touched. `StepTable` has one consumer, the page, so making `openRows` and `onOpenRowsChange` required props breaks nothing. `viewDisabled` is optional.
- Open questions: none were answered unilaterally. The ticket records the owner's decisions on the restore drop and on disabling the toggle.

## Merge risk
**high** - a revert does not undo it: any non-ok restore response, including a transient 502/503/504, now permanently deletes the user's stored pin from `localStorage`.

## Review focus
- [`pages/apps/aoe4-build-order.tsx:128-139`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/100/files#diff-aea44dd8df67afd590f57f83436ad63a0375df14a7656d7660754745f759188bR128-R139) - a transient server error during the restore (cold-start 504, deploy-window 503) deletes a pin that a later load would have restored, and a branch placed before the `cancelled || pinTouched` guard would delete a pin the user just made - check that the clear sits after the guard and that a rejected `fetch` still reaches only `.catch` - pinned by [`acceptance/aoe4-build-order-pin-compare.spec.ts`: a restore answered with 400/500 drops the stored pin, a restore whose request fails keeps the stored pin, a Pin made while the restore is in flight keeps the user pin when the restore fails](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/100/files#diff-769b5876b77c1eed270581d34e887170ab8c4417c1dc3db9ade4e75bc858b280R492-R553)
- [`pages/apps/aoe4-build-order.tsx:174-178`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/100/files#diff-aea44dd8df67afd590f57f83436ad63a0375df14a7656d7660754745f759188bR174-R178) - if the table's own writes went through this merge, or the merge kept a stale tail, a row added later would inherit a deleted row's open state, and a text edit that sets `rally`/`count` could leave the value hidden - check that only the textarea and prebuilt-select setters are wrapped and that unparseable text leaves the flags untouched - pinned by [`acceptance/aoe4-step-table.spec.ts`: a text edit that sets an optional field on a closed row opens it, an opened row stays open through text that does not parse, a row added by a text edit after the text shrank does not inherit a dropped row's open state](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/100/files#diff-fe2f9d7c6df4d47938de7231e6c45f875c155a78dfee9516492733f0d25bb5abR631-R695) and [`step-table-model.test.ts`: merges an external edit as old flag or content, one entry per step](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/100/files#diff-02ee278ab06a7a8db5142904a58d32a8785dffba03ce9b9ddc90e33195dd9ad3R437-R441)
- [`components/apps/aoe4-build-order/step-table.tsx:293-367`](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/100/files#diff-3f755e736f2684ff64b018a83fdb50ad0a07bc94c2bad334214e01d2d3eab1feR293-R367) - a move or delete that updates the steps but not the flags (or the reverse) leaves "More options" on the wrong step - check that every `commit` passes the flag edit matching its step edit - pinned by [`acceptance/aoe4-step-table.spec.ts`: moving a row carries its open state and deleting a row keeps the others](https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/100/files#diff-fe2f9d7c6df4d47938de7231e6c45f875c155a78dfee9516492733f0d25bb5abR611-R629)

## Untested hotspots
None. I read the assertions of each test behind a focus entry. Each one fails if its logic breaks:
- Removing the clear makes the 500 drop test fail.
- Moving the clear before the guard makes the in-flight Pin test fail.
- Clearing on a rejected fetch makes the abort test fail.
- Keeping the tail fails both the shrink-then-regrow test and the unit row.
- Not moving the flags makes the move test fail.

## Non-blocking notes
- The rating is high because of a user-data deletion the owner chose: any non-ok status drops the pin, including a 503 or 504 from Vercel during a deploy or outage. This was decided and is documented, so it is not a blocker. A future ticket could restrict the drop to 4xx plus repeated 5xx, if users report lost pins.
- `editText` re-parses the text on every keystroke, on top of the page's existing parse memos. It is cheap at this size and does not need a change.
- The old step-table test "Returning from the text view remounts the row" now expects the row to stay open (step-table spec line ~176). This is the intended behavior change, not a weakened test.
