# SGS-064 spec gate 1

Verdict: READY

Checked against origin/main d5c2549.

- Grounded: houses.ts (HouseDemand, planAutoHouse), simulate.ts (constructing at 127/366/374, houseDemand 555, startConstruction, completeConstruction), simulate-construction.test.ts and the shipped knight-longbow build all exist. The grep counts match: pendingSupply is 17 lines (houses.ts 2, simulate.ts 2, houses.test.ts 13). The doc lines 300 and 302 and README lines 81-83 match.
- Contracts: C7 in design/M4.md matches the ticket's HouseDemand shape exactly. SGS-063 does not touch houseDemand or constructing.
- Invariants A1-A3 are named and not contradicted. Risk high is right (criticalPaths and strongModelTriggers).
- No open questions. Docs are in Scope with grep criteria. On merge: none is correct.
- The shipped build has exactly three explicit houses between the second archery-range and rally kings-palace, so the test filter is well defined.
- The houses.ts source-shape test (no numeric literals beyond 0, 1, 60; exports exactly planAutoHouse and HouseDemand) stays satisfied by the described change.

Notes (non-blocking):
- The comment at simulate.ts:126 ("baseIds under construction") goes stale; update it with the record change.
- Doc line 310 and the rest of the paragraph around 314-316 need no change, but check them when rewriting the paragraph.
- The 660-764 s "strictly rising" criterion is untested against the new code. If the filtered build still stalls after the change, the implementer should report it rather than adjust the window silently.
