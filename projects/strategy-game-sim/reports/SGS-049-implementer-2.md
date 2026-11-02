# SGS-049 implementer 2 (rework 1)
Branch sgs-049-aoe4-chart-markers-ui, tip 14a4d62edb2acea88636ac60dc0d52e0947d4e52 (new commit on 43b8a0b), worktree $FACTORY_DIR/worktrees/sgs-049-aoe4-chart-markers-ui.
Files: line-chart.tsx (width from ResponsiveContainer onResize into state; plotWidth = width - Y_AXIS_WIDTH(110) - 2*5 margin; PLOT_WIDTH_PX removed; stable ReferenceLine key kind:label:at; legend mb-3); compare.ts (imports AGE_NAMES from model, copy deleted); acceptance/aoe4-build-order.spec.ts (CHART_MARKER_KINDS imported, shared expectMarkerLabelsApart, new 768 px test, horizon test asserts markers.length > 0).
Tests: tsc clean; lint:dup 0 clones; npm test 864 passed; next build ok; npm run acceptance 433 passed (432 + new 768 test).
Mutation: plotWidth forced to 900 -> 768 px test failed ("labels 2 and 4 in chart-units-produced overlap"); restored (verified).
Screenshots at 1280/1024/768 taken (scratchpad chart-1280/1024/768.png); 768 labels readable, no label-label overlap. Temp shot spec deleted.
Note: before the first resize the width is null so plotWidth is 1 for one render (transient). Pre-existing tests edited: none.
Invariants: S1 holds (AGE_NAMES from lib model, same app). Nothing started left running by me.
Status: needs_review
