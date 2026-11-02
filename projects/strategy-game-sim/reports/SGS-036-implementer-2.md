# SGS-036 implementer report 2 (rework 1)

- Ticket: SGS-036 (rework 1)
- Branch: sgs-036-aoe4-request-hardening
- Tip: ab263688994376072cf2e88dfa6a90cf10aff900 (new commit on top of 8a49431, no amend)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-036-aoe4-request-hardening

## Required fixes
- [x] docs/api/openapi.json `simulateBuildOrder` description: "Validation runs in two stages and every issue is reported." changed to "Validation runs in two stages; at most 100 issues are listed and the rest are counted in omittedIssues." Nothing else in the description changed.
- docs/aoe4-build-order.md checked: no stale "every issue is reported" claim. Line 464 ("Each issue is reported on its step or `start`") is about where issues are located, not whether all are listed, so it was left alone. Lines 492-496 already describe the cap.

## Files touched
- docs/api/openapi.json: changed one sentence; the JSON still parses.

## Checks
- tsc --noEmit: pass
- npm test: 27 files, 700 tests pass
- No tests added or edited, so no mutation checks were needed.
- Node 24 via nvm.

## Status
needs_review
