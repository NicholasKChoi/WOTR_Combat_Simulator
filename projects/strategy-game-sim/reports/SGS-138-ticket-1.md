# SGS-138 ticket report

File: tickets/SGS-138-pinned-runs-no-tooltip-one-legend-entry.md (lint clean)

Title: Keep pinned runs out of the chart tooltip and show one dashed legend entry. Component aoe4-build-order, Risk low, about 60 LOC, depends on SGS-135, On merge none. Criteria cover PinnedLegend markup and placement, its render condition (pinned series or pinned age-up marker, not collapsed), removal of PinnedLineKey / chart-pinned-key / pinned-age-up / pinnedAgeUps (git grep end-state criterion), marker legend listing only current kinds, Playwright hover with no `(pinned)` tooltip names, one legend per chart with a pinned run and gone after unpin, unchanged tooltip current values, docs, gates.

Diagrams: none (single component).

Open question: designer, whether a chart whose only pinned line is hidden via the legend still shows PinnedLegend (design C6 silent). Not covered by a criterion.

Overlap and notes:
- Serial with SGS-135 on line-chart.tsx (and with later marker-legend ticket L).
- `acceptance/aoe4-gather-rates-per-villager.spec.ts` reads `Food (pinned)` via tooltip hover; that breaks. Scope tells the implementer to rewrite it (drawn path or Vitest) and report which.
- Criteria commands were checked by grep against origin/main only (names exist today; end state removes them); no mutation criteria.
