# Simplify pass, batch SGS-157

Branch sgs-157-buildings-chart-overlap, base e50e074. Tip a38608c -> new tip in commit below.

Changes (components/apps/aoe4-build-order/chart-rows.ts):
- Comment on lineOffsets now says MAX_LINE_OFFSET instead of repeating 0.45.
- offsetSlotKeys un-exported (only used inside chart-rows.ts).

Checks: npm test (2566 passed), tsc --noEmit, lint:dup all clean. No browser tests run.
Nothing else worth trimming; no style-source or LESSONS rule touched.
