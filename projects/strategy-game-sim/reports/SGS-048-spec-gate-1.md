# SGS-048 spec gate 1

Verdict: READY

Checks (1-12): all pass.
- Grounded: chart-rows.ts, line-chart.tsx, results.tsx, page, docs "Page" section (line ~553, sentence on data-series at ~569) exist; compare.ts and compare-panel.tsx marked new. Page state type is SimulateResponse = SimulationResult, so setPinned(result) types fine. SAMPLE_SECONDS fixed, so key times 600/900/1200 are sample times.
- Contracts match design/M3.md (KEY_TIMES, KeyNumbers, CompareRow, PinnedSeries, pinnedKey, test ids, row keys) and deps SGS-043/035/052/049 (formatMinSec from format-time, no re-export).
- Decisions/behavior rules rows pin/compare/overlay agree. No open questions.
- Risk standard is consistent (components/** not critical, no trigger; ~190 LOC).
- Docs: only docs/aoe4-build-order.md Page section goes stale; it is in Scope item 7 with a grep criterion.

Notes (non-blocking):
1. keyNumbers says "else null" for a missing sample; fine, but ages with age 1 (start) entry, if present, is ignored by design.
2. "Next palette color" for a pinned series with no current counterpart is ambiguous; ticket delegates color to implementer, acceptable.
3. Playwright criteria pin 300 s then 600 s while another criterion says pin 1200 then run 300; both fine, just keep fixtures cheap.
