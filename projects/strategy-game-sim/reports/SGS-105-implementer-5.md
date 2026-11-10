# SGS-105 implementer 5 (Rework 4, suite)

Branch sgs-105-save-and-open-by-link, tip f55754ce25fdd8dc52fa72c58196d4dd1557d477 (parent c016f92). Worktree: .claude/code-factory/worktrees/sgs-105-save-and-open-by-link.

- acceptance/aoe4-save-open.spec.ts: the test "a saved build whose text no longer converts opens as text with the issues and no run" now calls `await page.setViewportSize(PHONE)` before `page.goto`. All assertions unchanged.
- Ticket Rework 4 checklist ticked (both boxes).

Results: `npx playwright test acceptance/aoe4-save-open.spec.ts acceptance/aoe4-split-layout.spec.ts` (ACCEPTANCE_PORT=3792): 53 passed. `npx tsc --noEmit` clean; `npm run lint:dup`: 0 clones.
Mutation check: not run (acceptance spec only; the change is a viewport setup line).
Doc claims, pre-existing test edits, pinned outputs: none.
Out-of-scope findings: none. Status: needs_review.
