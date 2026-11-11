# SGS-114 implementer 2 (Rework 1)

Branch sgs-114-chart-layout, tip ccc5ef15c3b6a8bc5bc25a0723fa902484cb47c1, worktree /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-114-chart-layout.

Fix: indented lines 163-276 of components/apps/aoe4-build-order/line-chart.tsx by 4 spaces; `</>` left at 20 columns. `git diff -w` is empty (whitespace only).
Checks: tsc clean, lint:dup run, npm test run (see handback). No tests added, no doc claims, no pre-existing tests edited.
Note: prettier --check warns on this file, but it also warned on the pre-change version; repo does not enforce it.
Status: needs_review
