# SGS-085 implementer report 2 (Rework 1)

- Ticket: SGS-085. Branch: sgs-085-aoe4-text-editor-issue-ux. Tip: 75f074f. Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-085-aoe4-text-editor-issue-ux
- Status: needs_review

## Required fixes
- [x] Renamed the `checkBuildOrder` option `fieldRulesOnly` to `skipWholeOrderRules` (it skips the start and cross-step rules; per-step cross-field rules still run). Renamed `fieldSchemasByCatalog` to `stepRulesSchemasByCatalog`. Retitled the schema.test.ts case to "skips the start and cross-step rules when asked to skip the whole-order rules". No behavior change. `text-to-build.ts` passes the argument positionally (`true`), so it needed no edit.
- [x] Rebased onto origin/main 2a36296 (clean, no conflicts). Previous commit is now bd85765; the rename is commit 75f074f.

## Files touched (rename commit)
- lib/aoe4-build-order/schema.ts: identifier renames only (parameter, cache map).
- lib/aoe4-build-order/schema.test.ts: test title only.

## Tests
- `npx tsc --noEmit`: clean.
- `npm run lint:dup`: exit 0.
- `npm test`: 48 files passed, 1483 tests passed, 10 skipped, 0 failed.
- `npm run lint` does not exist and eslint is not configured in this repo (eslint printed its migration notice), so no separate lint stage ran.
- Acceptance suite not re-run (rename only, no behavior change).

## Pre-existing tests edited
- schema.test.ts: title of "skips the start and cross-step rules when asked to skip the whole-order rules" (was "...for the field rules only"). Title only, assertions untouched; allowed by the Rework 1 checklist.

## Doc claims
None added or changed in this pass.

## Pinned outputs / mutation checks
None added. The renamed test is unchanged in logic and was verified in the original pass.

## Invariant check
No behavior change; no INVARIANTS regressions.

## Out-of-scope findings
None.
