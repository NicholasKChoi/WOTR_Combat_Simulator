# SGS-071 spec gate 1

Verdict: READY

Checked against origin/main: line-chart.tsx, results.tsx (three SeriesCharts pass `pinned`, none pass markers), docs line 800 ("the pinned run draws none", the only hit in docs/components), acceptance/aoe4-build-order.spec.ts:454 test exists, recharts 3.10.1 ReferenceLine renders props.children. Contracts match design C12 and SGS-070 (which defers `pinnedAgeUps` to this ticket). Invariants S1, A1, A3 fine; risk low is right (display only, no critical path). Open questions none. No lessons entries. Diagram exemption stated. Docs fix in scope.

Notes (non-blocking):
- Design M4.md line 30 (charts row) still says "The pinned run draws no markers" and "dashed 8 2"; it is a design doc, update it if the owner wants it current.
- A title child on a 1px line is hard to hover; the ticket already asks the implementer to confirm it lands in the DOM.
