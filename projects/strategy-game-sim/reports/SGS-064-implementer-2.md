# SGS-064 implementer pass 2

Branch sgs-064-aoe4-house-lead-time, worktree $FACTORY_DIR/worktrees/sgs-064-aoe4-house-lead-time, new tip fe3de3e (on top of 68e0ac1, not amended).

Changed: acceptance/aoe4-simulate-api-spear-longbow-build.spec.ts only.
- Step 23 test (1200 s and 3600 s): armedAt 681, startedAt 687.5475028949656; no-waiting assertion kept. Comment names the lead-time rule.
- 1200 s depletion test renamed and re-pinned: gold depletedAt 1114.092642631611 (exact double; ticket's ~1114.09), gold#2 and gold#3 null, warnings exactly [node-depleted, info, gold].
- README: data/aoe4-build-order/README.md quotes 687.5/695.2 s and 1114 s, all values it states; population 200 at 1366.43 not added.

Results (Node 24, ACCEPTANCE_PORT=3837): tsc clean, lint:dup clean, npm test 1321 passed / 8 skipped, full acceptance suite 574 passed (includes the 1TC and Knight/Longbow digests, unchanged). Spec file 4/4 after re-pin.
Mutation checks: not run (re-pinned acceptance assertions; the old values failing against the new rule was the failing signal).
Out-of-scope findings: none.
Status: needs_review
