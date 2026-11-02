# SGS-049 implementer 3 (rework 2)

Branch sgs-049-aoe4-chart-markers-ui, tip ccbba95ed4977ae04cb646f23e453cad23e5ca4f (new commit on 14a4d62), worktree $FACTORY_DIR/worktrees/sgs-049-aoe4-chart-markers-ui.

Files
- components/apps/aoe4-build-order/line-chart.tsx: placeMarkers pins a label that fits on neither side to the plot's left edge (dx offset, interval [0,width]) so row stacking stays correct; comment re-wrapped and made true; marker lines skipped while chartWidth is null; unused `i` removed; CHART_MARGIN_PX comment added.
- acceptance/aoe4-build-order.spec.ts: narrow-screen test now runs at 768 and 390 px; expectMarkerLabelsApart also asserts each label box lies inside the .recharts-cartesian-grid box.

Verification
- Label overlap and inside-plot check on all three charts at 1280, 1024, 768, 576, 390 px (fresh load each): 5 passed. A temporary live-resize test (1280 -> 390 and back, no new run) passed; removed before commit.
- Mutation: forcing `pinned = false` fails the 390 px test ("label 3 in chart-units-produced leaves the plot"); the 768 px test passes; restored.
- tsc + lint:dup clean; npm test 864/864; next build ok; npm run acceptance 434/434.

Notes: the spec diff is larger than the logic because the test body was re-indented into a width loop. Nothing is left running. No out-of-scope findings.

Status: needs_review
