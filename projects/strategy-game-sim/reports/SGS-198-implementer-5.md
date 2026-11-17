# SGS-198 implementer-5 (Rework 1)

- Ticket SGS-198, branch sgs-198-units-chart-unit-lines, tip 45e14d2040f4a25055770f7b071fcba48238c627 (was 55c83d7), checkout /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-198-units-chart-unit-lines.
- Own-commit check skipped: the checkout holds no `origin/sgs-198-units-chart-unit-lines` ref; tip unchanged by checkout.sh.

## Files touched
- components/apps/aoe4-build-order/result-series.test.ts: `unitLineSeries` fixture reordered to spearman-3 [0,1,2], longbowman-2 [0,3,3], longbowman-3 [0,0,5]; expected spearman [0,1,2] then longbowman [0,3,8]. No production code changed.

## Required-fixes checklist
- [x] Reorder fixture as specified.

## Mutation checks (result-series.ts, restored after each; working tree clean of production changes)
- Sort the result by key (`.sort(localeCompare)` at the `return [...lines.values()]` line): the order test failed on deep-equality (longbowman first, spearman expected).
- Sort `unitsProduced` ascending by tier before the loop: same test failed (longbowman-2 first).
- (Descending tier sort still passes, since spearman-3 and longbowman-3 tie and keep input order; ascending tier is the sort the finding names.)

## Results
- `npx tsc --noEmit` passes; `npm run lint:dup` ran without findings; `npm test`: 90 files passed, 1 skipped; 2844 tests passed, 15 skipped.
- Build and acceptance not rerun; the change is a test fixture only.
- Pre-existing tests edited: none beyond the rework's own test. Doc claims: none added. Unverified assumptions added: none. Out-of-scope findings: none.

Status: needs_review
