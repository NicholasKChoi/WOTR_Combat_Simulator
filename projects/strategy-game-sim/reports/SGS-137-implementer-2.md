# SGS-137 implementer 2 (rework 1)
Branch sgs-137-chart-view-toggles, tip 6de222d, worktree $FACTORY_DIR/worktrees/sgs-137-chart-view-toggles.
- acceptance/aoe4-chart-views.spec.ts: yLabel now `text.recharts-label[transform^="rotate(-90"]`.
- chart-view-toggle.tsx: className via `cn` (classnames); onClick uses an if.
- Ran aoe4-chart-views + aoe4-chart-layout: 32 passed. `tsc --noEmit` clean. No `lint` npm script exists in the repo; eslint v9 has no config here, so not run.
Status: needs_review
