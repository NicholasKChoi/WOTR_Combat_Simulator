# SGS-148 ticket report

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-148-islinehidden-pinned-prefix-strip.md
Title: SGS-148: Stop isLineHidden stripping pinned: from current series keys
Type Bug, Priority low, Risk low, Component aoe4-build-order, Depends on none, On merge none. Lint clean.

Defect check: `isLineHidden` still exists at origin/main (components/apps/aoe4-build-order/chart-rows.ts) and still strips a leading `pinned:` via PINNED_PREFIX. Callers: line-chart.tsx (current and pinned Lines) and chart-legend.tsx `pinnedLegendShown`.

Summary: make the hidden lookup depend on the caller saying current vs pinned instead of key text; update 3 call sites and the isLineHidden tests. About 15 LOC. No diagram. No open questions.

Overlap: none with open tickets. Related finding left out of scope: `toChartRows` writes a current series keyed `pinned:x` and the pinned line of series `x` to the same row field, so a full fix for such keys would need a row-key format change (not needed today; no such key exists).
