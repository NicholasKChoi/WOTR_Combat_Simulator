# SGS-063 spec gate 1

Verdict: READY

Checked against origin/main (d5c2549; SGS-062 not yet merged, which the ticket states).

- Grounded: houseGateOpen, payOrder, produce (population branch), accrueWait site, tieRank, SimWarning, formatMinSec, isReaction exist. The supply-limit clause in payOrder and the produce population return match the ticket's description.
- Greps: step-stuck count is 7 (docs 4, openapi 3) and "they stay off; with no" is 1 (docs line 315). Both match the ticket. Contract spec lines 131 and 483 match. Listed exact-list test lines (spear-longbow 42, depletion-engine 96, triggers 78) exist.
- C6 names, messages, ranks match design/M4.md. Invariants A1-A3 named and not contradicted. Open questions: none in the ticket or CONTEXT.md. Risk high is justified by the critical-path symbols. Docs, OpenAPI, README handling and test-edit rule are in Scope. On merge none is right.

Notes (non-blocking):
- docs/aoe4-build-order.md line 390 lists the sort order but does not contain "step-stuck", so the step-stuck grep will not find it. The ticket's "node warnings come first" grep covers it; keep that line in the implementer's line-by-line review.
- Pinned pre-change values for the three shipped builds must be captured on the post-SGS-062 base before editing, since SGS-062 may change unitsProduced.
- The ticket says `Severity` vs the literal is the implementer's choice; prefer `Severity` to match the neighbors.
