# SGS-157 acceptance-test 2 (delta a38608c..2ab6c10, tip 2ab6c10)

Result: PASS. No new failures, no commit (no test changes needed).

- Delta reviewed: 57d342a (unexport offsetSlotKeys, comment), 134c9a9 (`lift` guard keeps non-number values; new unit test), 2ab6c10 (lineEndYs helper in acceptance/aoe4-chart-views.spec.ts, pinned comparison wrapped in `expect(...).toPass()`).
- Harness ran: chart-rows.test.ts 46/46 passed. Playwright (chart-views, pin-compare, chart-layout, chart-readability, marker-labels, gathered-resources): 94/94 passed on the tip.
- Mutation check (rework 3 spec edits): `lineOffsets` in components/apps/aoe4-build-order/chart-rows.ts changed to give every key offset 0. aoe4-chart-views then failed on the behavior assertions: `expect(townCenterEnd).not.toBe(barracksEnd)` (Expected not 5), `expect(before).toBeGreaterThan(0)` (Received 0), and the whole-number axis max assertion. The pinned-comparison `.not.toBe` also failed. Break undone with `git checkout`; `git diff --exit-code` clean.
- The `lift` guard (134c9a9) is not observable through the page (the page never feeds a missing current value there), so it is covered only by the implementer's unit test. That is not an acceptance gap.
- Criteria not expressible: none new.
