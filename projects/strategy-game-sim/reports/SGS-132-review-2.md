# SGS-132 review 2 (delta)

Branch `sgs-132-save-panel-live-status`, tip `c88e938`. Delta mode against `5ab8f45`, the tip review 1 bounced. Diff `5ab8f45..c88e938`: one commit, `acceptance/aoe4-save-status.spec.ts` only, +2/-5.

**Verdict: APPROVE**

## Blocking findings

None.

## Required fixes (Rework 1) - check

- [x] The first test is renamed exactly to `'reads Saved after a copy and the new revision after each version'` (spec line 58).
- [x] The held-PUT block (the `holdRequests(page, namedBuildUrl('*'), 'PUT')` call, the click, the vacuous `{ link: false, status: '' }` poll and `release()`) is replaced by `expect(await saveVersion(page)).toBe(3)` (line 75). The `Saved version 3` poll is kept (line 76).
- [x] Nothing else changed. `git diff --stat 5ab8f45..c88e938` shows the one file. The diff has only these two hunks, and `holdRequests` is still imported and used by the second test (line 83).

## Every remaining assertion in the first test can fail

| Line | Assertion | Value before the step, then after | Fails on |
|------|-----------|-----------------------------------|----------|
| 60 | `rowIds` = `[save-build-copy, save-status]` | initial state | `save-status` missing from or reordered in `save-row` |
| 61 | status `''` | initial state | status shows text when there is no save |
| 64 | status `Saved` | `''` before the copy, then `Saved` | wrong or missing copy text in `saveStatusText` |
| 65 | `rowIds` = `LINK_ROW` | without the link, then with the link | link or Copy link placed outside the row |
| 68 | `{ link: false, status: '' }` | `{ true, 'Saved' }` before the edit, then this value | the settled-change reset in `save-build.tsx` is removed |
| 70-71 | revision 2, `Saved version 2` | `''` before, then `Saved version 2` | wrong revision or wrong text |
| 74 | `save-build` enabled | disabled after the version save, then enabled after the edit | the edit not registering |
| 75 | revision 3 | response value | server or stub revision sequence |
| 76 | `{ link: true, status: 'Saved version 3' }` | `{ false, '' }` after the edit at line 73, then this value | `save-build.tsx:193` passing the loaded revision (2) instead of `response.revision` (3) |

The in-flight check removed from this test is still covered by `keeps the link and empties the status while a second copy is in flight` (lines 79-90). It goes from `{ true, 'Saved' }` to `{ true, '' }`. The implementer's mutation run (deleting `saving ||` at `save-build.tsx:58`) failed that test at both viewports, as review 1 predicted.

## Acceptance criteria

This is a delta review, and no criterion is tagged `(rework 1)`. The verdicts in review 1 stand: criteria 1-16 pass, and the acceptance run for criterion 15 is unverified by review. Criterion 4's test defect is resolved: its name now matches its assertions.

## Invariants touched

None by the delta, which is a test file only. A1-A3 still hold as in review 1.

## Test files across the branch

The delta touches only `aoe4-save-status.spec.ts`. The other test files are byte-identical to the tip review 1 checked, and no test was deleted or weakened.

## Lint

I ran `npx tsc --noEmit && npm run lint:dup` in a review worktree at `c88e938`: tsc is clean and jscpd found 0 clones.

## Bot reconciliation

`reviewBot` is not configured, so there is nothing to reconcile.

## UI inspection

Not run. The delta changes no UI.

## Non-blocking notes

- `acceptance/aoe4-save-status.spec.ts:9`: `namedBuildUrl` is now an unused import. The removed `holdRequests(page, namedBuildUrl('*'), 'PUT')` was its only use. The repo's lint does not flag it: `tsconfig.json` does not set `noUnusedLocals` and there is no ESLint. `tsc --noUnusedLocals` reports it (TS6133). My review-1 direction said `holdRequests` stays imported but did not mention this import. Drop the line when the branch is next touched or at PR time. It has no runtime effect.
- Review 1's non-blocking notes still apply. They were out of scope for this rework.

## Coverage

- Reviewed: the `5ab8f45..c88e938` diff and the full first and second tests at `c88e938`, plus the spec's imports and helpers (lines 1-90).
- I did not run any acceptance tests (per the rules). For the mutation result I relied on the implementer's record (`SGS-132-implementer-3.md`).
- Cleanup: the review worktree is removed and the task worktree is untouched (clean).
