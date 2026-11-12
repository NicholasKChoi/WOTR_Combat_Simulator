# SGS-139 implementer 2 (rework pass 1)

Status: needs_review
Branch sgs-139-marker-legend-hover-focus-labels, tip 5c9f115841a44b337186a6211fc091ffee8bb103 (parent a04ccdc).
Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-139-marker-legend-hover-focus-labels

## Files touched
- acceptance/aoe4-marker-labels.spec.ts: `setup` picks the non-age-up kind with the most markers (blacksmith, 8); the hover test asserts `labelsOf(result, kind).length >= 2` before the overlap poll.
- components/apps/aoe4-build-order/results.module.css: `#0d6efd` replaced with `var(--bs-primary, #0d6efd)` (border-color and outline), per review note 2.

## Tests
- Acceptance spec aoe4-marker-labels.spec.ts: 8 passed after the fix (run once, this is the acceptance-test change).
- tsc --noEmit clean; lint:dup 0 clones. No production TS changed, so build and npm test were not rerun.

## Mutation check
- Break: components/apps/aoe4-build-order/line-chart.tsx placeMarkers, row search replaced with `let row = 0` (the findIndex and fallback line removed).
- Result: hover test failed at spec line 77 `.toBe(false)`, Received: true (overlap detected). Reverted with `git checkout`; diff is clean.

## Doc claims
None added.

## Pre-existing tests edited
None. Unverified assumptions added: none. Out-of-scope findings: none.

No processes left running.
