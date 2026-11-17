# Simplify report: SGS-202 (batch-SGS-202-SGS-202-simplify-1)

Checkout: worktrees/sgs-202-house-demand-held-order, branch sgs-202-house-demand-held-order.
Loaded: common.md, REPO.md, LESSONS.md (acceptance-only lesson, not touched), styleSources.

Diff reviewed (origin/main..HEAD): `simulate.ts` (+2/-0 net in `houseDemand`), two doc paragraphs, and one
new test block in `simulate-busy-buildings.test.ts`.

Findings: nothing worth trimming.
- The one code comment in `houseDemand` records a hidden constraint (the production-time check must still run
  for held orders), and the last test fails if it is dropped, so it meets the comment bar.
- The change is a two-line in-place edit; no helper, no duplication, no efficiency concern.
- Tests are parameter-light, assert the opposite state first (counting-held baseline vs held), and reuse
  existing helpers (`housesDone`, `startingWith`, `timed`).

Tests: `vitest run lib/aoe4-build-order/simulate-busy-buildings.test.ts`: 42 passed. No browser or e2e run.

Commits made: none. Pushed: nothing. Branch tip unchanged: c25d26e.
