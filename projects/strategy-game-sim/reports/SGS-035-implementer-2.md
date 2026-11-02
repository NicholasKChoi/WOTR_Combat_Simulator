# SGS-035 implementer 2 (Rework 1)

- Ticket: SGS-035, rework 1 (review report reports/SGS-035-review-1.md)
- Branch: sgs-035-aoe4-engine-common-dup-check
- Tip SHA: e33fbf72560762546a3a81d1c54a97237a75ce08 (new commit on 6dec3b1, not amended)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-035-aoe4-engine-common-dup-check

## Required fixes
- [x] ARCHITECTURE.md Rules line: "has no copied code" became "is checked for copied code"; "fails on any duplicated block" now reads "fails on any duplicated block of at least 8 lines and 70 tokens", matching `.jscpd.json` (minLines 8, minTokens 70). Only that bullet changed.
- [x] (optional) engine-common.ts: added one comment line above `RESOURCE_TOLERANCE`: "The same margin absorbs float noise in the auto-house population shortfall." Nothing else touched.

## Files touched
- ARCHITECTURE.md: reworded the AoE4 duplication-check rule (3 lines).
- lib/aoe4-build-order/engine-common.ts: +1 comment line on RESOURCE_TOLERANCE.

## Checks (Node v24.22.2)
- `npx tsc --noEmit`: pass.
- `npm test`: 29 files, 704 tests passed, 0 failed (same count review saw).
- `npm run lint:dup`: exit 0, "Found 0 clones."
- No tests added or edited; no code behavior changed, so no mutation checks apply.

## Invariants
A1/A2/A3 unaffected (comment and doc only).

## Out-of-scope findings
None.

## Status
needs_review
