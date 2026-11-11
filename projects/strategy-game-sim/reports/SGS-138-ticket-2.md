# SGS-138 re-spec report

Ticket: tickets/SGS-138-pinned-runs-no-tooltip-one-legend-entry.md

- Folded design C6 answer: `pinnedLegendShown(pinned, hidden, pinnedAgeUpCount)` added to Scope (chart-legend.tsx, exported, pure) and `SeriesChart` renders `PinnedLegend` by it; a pinned line hidden through its series legend item does not count as drawn.
- Criteria: SeriesChart markup cases for hidden-only pinned series with and without a pinned age-up; new `pinnedLegendShown` table criterion (the five M9.5 cases) plus Playwright hide/show/repeat case; tagged (respec 1).
- Open question deleted (now `none`); `## Re-spec 1 - 2026-11-11` appended. The tags use 1 because the ticket had no earlier Re-spec section (the report number 2 only counts reports).
- Lint: ticket-lint.py printed no errors.
- No criterion runs a command beyond the existing grep criterion, which was unchanged.
