# SGS-186 spec gate 1

**Verdict: READY**

Checked at origin/main (after `git fetch origin`):

- `acceptance/aoe4-chart-views.spec.ts` line 12 declares `MIXED_NODES_PASTE`, and no other line references it.
- `acceptance/aoe4-compact-view.spec.ts` line 38 declares `bands`, and no other line references it. `bandsPerChart` is a different name. `Page` is still used by many helpers in that file, so the ticket's hedge ("if `bands` was its only user") resolves to keeping `Page`.
- `acceptance/aoe4-my-builds.spec.ts` imports `isNamedPath` (line 24) and never uses it elsewhere in the file.
- `acceptance/helpers.ts` exports `isNamedPath` (line 356) and `stubNamed` uses it (lines 425-426), so keeping the export is correct.
- `tsconfig.json` includes `**/*.ts`, so the acceptance specs are typechecked. `commands.lint` is `npx tsc --noEmit && npm run lint:dup`, which matches the criterion.
- Criteria are observable: tsc with `--noUnusedLocals` is a typecheck, not a code search. No invariants, contracts, diagrams, input validation or unverified assumptions apply. Risk low and On merge `none` are fine.

## Gaps
None.

## Notes
- I did not run tsc. Whether it flags more unused locals in these three files is left to the implementer; the ticket already says to remove them and list them in the report.
- The `lint:dup` check could in theory move if removal shifts duplicated blocks. This is unlikely for deleting dead lines.
