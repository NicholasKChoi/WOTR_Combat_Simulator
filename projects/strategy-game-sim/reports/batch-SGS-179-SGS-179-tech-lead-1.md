Decision: no blockers, no untested hotspots. Opened draft PR.

PR: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/188 (base main, new, head 212efb7a6f00de8c274c27a858d4d824f7a16059)

Merge risk: low - acceptance specs and one test helper constant only; no public surface or critical path touched.
Review focus: No hotspots: test-only change; the deleted specs and dropped showTab calls are covered by the remaining specs at the default viewport.

Reviewed (reduced low-risk check): 212efb7 vs main, 5 files under acceptance/, +54/-270. Invariants, irreversibility, security: none touched. No production code.

Non-blocking notes: none.
