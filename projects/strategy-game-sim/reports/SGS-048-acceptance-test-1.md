# SGS-048 acceptance-test 1: PASS (tip 43a0220)

Written by the manager from the agent's returned text.

- Added `acceptance/aoe4-build-order-pin-compare.spec.ts` (9 tests), commit 43a0220 on sgs-048-aoe4-pin-compare. Test-only.
- Covers criteria 7-12: pin/unpin enablement, dashed overlay in all three charts (same stroke as current), pinned legend toggle, compare table (7 rows, delta = current - pinned, dash for missing), pin survives text edit and 400, pin the shown result then unpin, axis labels at 1280px with a pin.
- Mutation checks (10 breaks, each failed a test, undone): pin always enabled, empty strokeDasharray, unprefixed hide key, formatDelta null, union of times, page clears pin on edit/failed run, +0 delta, no-op unpin, YAxis width 20.
- Limits: the prebuilt-select change step selects index 0 (already selected) so the select path rests on the shared state design; criterion 12's gap is checked by bounding-box widths, not SVG path segments.
