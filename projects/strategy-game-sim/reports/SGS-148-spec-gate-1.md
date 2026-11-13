# SGS-148 spec gate 1

Verdict: READY. Risk `low` confirmed.

Checked at origin/main:
- `isLineHidden` (chart-rows.ts:82) strips `PINNED_PREFIX` from the key text, as the ticket says. `pinnedKey` and `toChartRows` (`fill(pinned.times, pinned.series, pinnedKey)`) exist.
- The only callers are line-chart.tsx (current line `isLineHidden(hidden, s.key)`, pinned line `isLineHidden(hidden, pinnedKey(s.key))`) and `pinnedLegendShown` in chart-legend.tsx:43. These match the ticket.
- chart-rows.test.ts `isLineHidden` describe block (lines 148-161) has the two named tests. Criteria 2 and 3 map onto them.
- chart-legend.test.ts exercises `pinnedLegendShown` (signature unchanged), so criterion 4 is covered by an existing test. The ticket's rule for existing tests holds. Only chart-rows.test.ts calls `isLineHidden` directly.
- Criterion 1 is a new test and can fail: a hidden set holding `pinned:x`, queried as a current line, must be true, which prefix stripping breaks.
- No invariants, contracts, dependencies, diagrams, or docs affected. Business logic is about 15 lines. No trust boundary. No external-service assumptions.
- Out-of-scope note: the row key collision is correctly excluded.

Gaps: none.

Notes (non-blocking):
- Criterion 3 under the new signature means "pinned line of series `a` with hidden set `{pinned:a}` is visible". It is trivially true once the lookup is by plain key. The existing test already covers it.
- Line numbers in the ticket's Context (162/177 vs 182/196 in the stale local tree) are not pinned in the criteria, so no problem.
