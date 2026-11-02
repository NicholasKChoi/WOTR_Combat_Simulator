# SGS-054 re-spec 1

Edited tickets/SGS-054-aoe4-m3-docs-openapi-audit.md in place. Risk stays standard.

- Row 9: AoE4 schemas now 27 (adds DepositRef to the 11 M3 adds), 36 total with the 9 fight schemas (25 on main). The exemption open question is removed; Scope 3 states the required references (NodeRef and FiniteNodeRef oneOf, spent propertyNames SpendCategory, nodeAmounts propertyNames FiniteNodeRef), so FiniteGatherNodeId, DepositRef and SpendCategory need no exemption. Criteria counts (36, 27) and the no-exemption wording updated.
- Row 3c: the node-reference doc section must state the nodeRefIssue shape (code, reason) and the message form `<reason> in <path>`, non-string = syntax.
- Row 1c: formatMinSec move touches no SGS-054 scope; no change.
- Dependencies question: removed. Depends-on line now says SGS-036 and SGS-053 are dependencies (already in the graph row).
- Open questions: none. No other sections changed; no notes section appended.
