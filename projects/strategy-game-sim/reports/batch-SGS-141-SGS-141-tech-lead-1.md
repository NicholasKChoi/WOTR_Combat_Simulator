# Tech-lead gate: SGS-141

Decision: no blockers, no untested hotspots. Draft PR opened.

PR: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/152 (draft, base main, head sgs-141-split-tab-order-spec-and-final-docs-pass, tip 373c4d6)

## Merge risk
**low** - tests, a test helper move and one doc paragraph; no public surface or critical-path symbol touched, and a revert fully undoes it.

## Review focus
No hotspots: acceptance-only change plus a doc sentence; the new spec is the pin for the Tab order it documents.

## Reviewed
origin/main (90b909e)..373c4d6, one commit, 4 files, +129/-10: acceptance/aoe4-split-tab-order.spec.ts (new), acceptance/helpers.ts (editedCopy moved in), acceptance/aoe4-my-builds.spec.ts (local editedCopy removed), docs/aoe4-build-order.md (one sentence). No production code. No ticket ids or factory pointers in the diff or commit message.

## Notes
- git push succeeded (ls-remote shows 373c4d6) but writing upstream tracking config failed with ".git/config: File exists" lock; harmless, local branch has no upstream set.
- `gh pr edit` avoided; body set via gh api PATCH. The PR was created with a placeholder body then patched with the full body.
- Non-blocking: spec's Stop `position` uses an O(n) indexOf over all DOM nodes per Tab press (up to 150 presses); fine for acceptance.
