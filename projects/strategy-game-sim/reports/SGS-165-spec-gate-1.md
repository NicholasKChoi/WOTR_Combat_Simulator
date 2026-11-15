# SGS-165 spec gate 1

Verdict: READY

Checked at origin/main (after git fetch).

- Grounded scope: the paragraph at docs/aoe4-build-order.md line 1073 ("With a pinned run, each chart also draws...") exists and says "the palette color at the index (number of current series) + (its index among the pinned series)", with no mention of wrapping. `pinnedColor`, `seriesColor` and `PALETTE` exist in components/apps/aoe4-build-order/chart-rows.ts. `seriesColor` does `PALETTE[index % PALETTE.length]`, so the wrap claim is correct.
- Criteria are observable. The doc-only wording check is allowed. "Quotes no palette length" is a doc-wording search, which is fine.
- Other color text in the doc (kind colours, marker colours, line 1012 offsets) states no palette-index rule, so the grep step has nothing to conflict with. No test depends on doc text.
- Invariants none, risk low, On merge none, no dependencies, no open questions, no diagrams needed, no code so no unverified assumptions.

Notes (non-blocking):
- "its index among the pinned series" is the index in the whole pinned series list, shared keys included (`i` in the `legendItems` flatMap). The doc already says this, so leave it as is. The implementer should not reword it to "among pinned-only series".
- Current-series legend color also wraps via `seriesColor(i)`. The optional sentence in Scope is accurate.
