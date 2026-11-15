# SGS-157 implementer 5 (rework 3)

Branch sgs-157-buildings-chart-overlap, tip 2ab6c10925a781909380971573dc573e485423a4 (on 134c9a9). Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-157-buildings-chart-overlap

Changed: acceptance/aoe4-chart-views.spec.ts only (test-only, no assertion changes).
- Added file-level `lineEndYs(page, id, keys)`: one `chart.evaluate` reads every key's path end y.
- All three Buildings tests use it; the other copies of the end-y parse are gone.
- Pinned test: the three equality assertions are wrapped in `toPass()` over a single read. The hide-line gap test reads both paths in one evaluate per `gap()` call.

Verification: the spec passed 3 runs in a row (11/11 each). `npx tsc --noEmit` clean. `lint:dup` found 0 clones. REPO.md `lint` is tsc plus lint:dup, so that covers it.
Mutation checks: none (no new behavior; assertions unchanged).
Doc claims: none added.
Out-of-scope findings: none.

Status: needs_review
