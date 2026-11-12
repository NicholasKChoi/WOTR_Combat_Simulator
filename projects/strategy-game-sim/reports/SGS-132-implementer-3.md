# SGS-132 implementer 3 (Rework 1)

- Ticket SGS-132, branch sgs-132-save-panel-live-status, tip c88e938, worktree /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-132-save-panel-live-status

## Files touched
- acceptance/aoe4-save-status.spec.ts: first test renamed to `reads Saved after a copy and the new revision after each version`; the held-PUT block (former lines 75-78) replaced by `expect(await saveVersion(page)).toBe(3)`; the `Saved version 3` poll kept.

## Tests
- `npx playwright test acceptance/aoe4-save-status.spec.ts`: 21 passed, 0 failed (touched file only).
- Lint (`tsc --noEmit` + `lint:dup`): clean, 0 clones. No unit change, so the full suite was not rerun.
- Pre-existing tests edited: none besides the rework-flagged test.

## Mutation check
- Deleted `saving ||` at save-build.tsx:58 (`saveStatusText`). `keeps the link and empties the status while a second copy is in flight` failed at both viewports (poll expected status '' received 'Saved'). Undone; the branch is clean.

## Doc claims
None added.

## Other
- Codegen not set; build not rerun (spec-only change).
- Unverified assumptions added: none. Out-of-scope findings: none.
- Status: needs_review
