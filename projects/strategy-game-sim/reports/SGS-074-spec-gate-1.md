# SGS-074 spec gate 1: READY

Checked against origin/main d5c2549, design/M4.md, CONTEXT.md, INVARIANTS.md, and tickets SGS-045, 057, 066, 067, 072, 075.

Verdict: READY. No blocking gaps.

Verified:
- Scope: helpers (openPage, runSimulation, AOE4_PAGE) exist; runRejected is new in SGS-059 (design C8). The 5 stale phrases and the "exactly one of `text` (paste format" hit each exist once on main (lines 217, 615, 764, 800, 816, 629). OpenAPI today: version 1.0.0, SimWarning.oneOf 3.
- Test ids used by the flow all appear in design C8 or in SGS-045/067 (simulation-notes-list, simulation-notes-toggle).
- Flow matches SGS-067 live-issue behavior (after the step-2 Run, `checked` is true, so the knigt issue shows with no Run) and SGS-072 (label `Pinned: <name>, <m:ss>`, restore on load, tab-results enabled).
- Risk standard is acceptable (audit/test-only; OpenAPI changes are design-specified).
- Invariants, size, diagrams, On merge: fine. No open questions. No lessons entries.

Notes (non-blocking):
1. Stale-phrase attribution: the ticket says SGS-057 removes `validateBuildOrder` (line 615). SGS-057 keeps validate.ts; SGS-075 removes it. SGS-075 is not in Depends-on, but SGS-059 and SGS-060 depend on SGS-075, so it is merged first transitively. Consider listing SGS-075 explicitly.
2. Flow step 3 says "`tab-results` still shows the charts" without a test id; name one (the chart test ids used in aoe4-build-order.spec.ts) so the implementer does not guess.
3. Step 3 / criterion "no POST (the spec counts requests)": say to attach a `page.on('request')` counter before the edit, as runRejected does.
4. Step 4 re-selects the already-selected Knight/Longbow option in build-order-select. React fires onChange for select on the change event regardless of value, so this should restore the text; if it does not, choose another build first and then Knight/Longbow.
5. Step 2 info-list assertion duplicates SGS-067 test 7; the ticket already acknowledges the intended overlap.
