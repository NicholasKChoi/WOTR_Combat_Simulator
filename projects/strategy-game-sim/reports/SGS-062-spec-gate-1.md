# SGS-062 spec gate 1

Verdict: READY

Checked against origin/main (d5c2549) and design/M4.md C5 plus the "Engine: unit tier conversion" table.

- Grounded scope: researchItem callback, resolveUnitEntry (research.ts line 61), spawnUnit (275), Engine.spawns (117; ticket says 105, line drift only), unitSeries (853), produce/payOrder/houseDemand pay-time calls (312/508/560), model.ts UnitSeries comment, upgradeTargets/byBaseId on GameData all exist. Docs lines (212-217, 354-355, 662-664) and openapi descriptions (1712, 1904, 1937) match. The six-line grep for "keeps the lower tier|tier is fixed when" returns exactly 6 on origin/main.
- Criteria are observable. Rule for existing tests is stated (Write), with a rule rather than a list of today's tests.
- Open questions: none; owner decision Q3=A recorded in design C5. CONTEXT.md open questions: none.
- Invariants A1-A3 named and not contradicted. Contracts match design C5. Depends-on SGS-056 only (strict nulls; the new code is already null-safe).
- Risk high is correct (spawnUnit and unitSeries semantics, public UnitSeries.counts meaning). Size ~100 LOC. Diagram present. Lessons files empty. On merge none is consistent (no new harness/doc).
- Docs: README (data) mentions veteran-longbowmen only as ordering, no counts, so no edit is right.

Notes (non-blocking)
- AC 7 offers "a run with conversion disabled" as a comparison; no such switch exists. Pinned values are the workable path; prefer saying so.
- Engine.spawns is at line 117 on main, not 105.
- Chart (components/apps/aoe4-build-order/result-series.ts) maps series by unitId; lower-tier series now fall to 0. Ticket marks UI out of scope; SGS-074 audit may want to look at how the chart reads.
