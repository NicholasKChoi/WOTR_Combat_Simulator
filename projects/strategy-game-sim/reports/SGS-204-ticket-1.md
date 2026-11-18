# SGS-204 ticket report

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-204-upgrade-dot-tier-indicator.md (ticket-lint passes).

Summary: "Show which tier upgrade each Units chart upgrade dot is". Component aoe4-build-order, Chore, Milestone none, Risk standard, about 50 lines of business logic, Depends on none. A dot's label is the research baseId (veteran-longbowmen, elite-spearmen), so the tier is already in the data. Scope: a pure tier-name function in result-series.ts, and visible tier text on each current dot and pinned ring in SeriesChart (line-chart.tsx). The dot's testids, data attributes, fill, stroke, radius, layer order and title stay as they are. Docs to fix: the "Upgrade dots" paragraph of docs/aoe4-build-order-ui.md, and the upgrade-dot sentence in page-help.tsx. Criteria cover:
- visible text on each dot;
- different tiers show different text;
- the function tested over every veteran-/elite- id in the data;
- pinned rings;
- two upgrades at one instant;
- text follows hide, zoom and the Buildings view;
- right-edge placement;
- existing dot assertions unchanged.

Diagrams: none (single-component).

Open questions: none.

Overlap: SGS-203 touches results.module.css and the Marker control paragraph of the UI doc. This ticket touches line-chart.tsx and the Upgrade dots paragraph. No file or section overlap, so no Depends on.

Notes:
- The backlog item says Chore, but the change is visible to the owner. I kept Chore as assigned and wrote the scope so no data or existing dot property changes. Say so if you want it retyped Feature or Bug.
- The tier-text style (size, offset, pinned distinction) is left to the implementer. The owner named no style, and the criteria require only that the text be readable, inside the chart, and distinct for pinned rings.
- The data has only veteran- and elite- unit upgrade ids. "Hardened" from the owner's example does not occur, so the function derives the tier from the id's leading word instead of a fixed list.
- I ran no scratch checkout. No criterion names a command that could be run against the base, other than the doc "hover title" grep, which matches the base doc.
