# Batch simplify: SGS-133, SGS-135

- SGS-133 new tip: 2f504bc (was 464ea8f). Trim: removed the tautological `expect(NARROW_VIEWPORT.width).toBeLessThan(768)` in acceptance/aoe4-split-scroll.spec.ts. Nothing else to trim (diff is small; comments already meet the bar).
- SGS-135: rebased with `git rebase --onto sgs-133 5e5bd8e` cleanly (own 2 commits replayed: d664ec0, 821e81e), then a simplify commit. Final tip below.
  Trim: use-chart-drag.ts dropped the `cancel` alias of `finish` and the one-method `DragSession` interface (session ref is now `(() => void) | null`).
- Tests: `npm test` passes on SGS-133 (2455 passed, 15 skipped) and on SGS-135 top (2474 passed, 15 skipped). `npx tsc --noEmit` clean; `npm run lint:dup` 0 clones. No browser tests run. Nothing pushed.
