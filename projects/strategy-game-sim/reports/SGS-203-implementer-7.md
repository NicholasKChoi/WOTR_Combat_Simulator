# SGS-203 implementer 7 (Rework 1)

Branch sgs-203-marker-control-stays-in-view, tip 85508a7fb229b315ab9cc6e9a45b2a7f4a73b424, checkout /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-203-marker-control-stays-in-view. Status: needs_review.

Files: acceptance/aoe4-marker-control-sticky.spec.ts only (test-only; no production change).

Required fixes:
- [x] Focus-clearance one-line case now runs on CHART_IDS[1]; before focusing it asserts the handle top is above the column top (`expect(before.targetTop).toBeLessThan(before.columnTop)`). Wrapped call (second-to-last chart) unchanged.
- [x] `readStuck(page, targetSelector?)` returns `targetTop` from the same evaluate; the three two-evaluate polls (first-chart header, focus handle, chart body row) use it.

Tests: spec run, 5 passed. `npx tsc --noEmit` and `npm run lint:dup` clean.

Mutation check: workbench.module.css:45 set to `scroll-padding-top: 0px`. The drag-handle test failed at spec line 143 (the CHART_IDS[1] call), Expected >= -1, Received -74.17. Undone with git checkout; no production diff committed.
Not separately mutated: the "starts above column top" precondition (it guards data, and passed on both focus calls).

Doc claims: none added.
Pre-existing tests edited: only the spec itself, as the rework directed.
Out-of-scope findings: none.
