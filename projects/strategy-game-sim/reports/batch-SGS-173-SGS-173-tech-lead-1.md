# Tech-lead report: SGS-173

Decision: no blockers, no untested hotspots (docs only). Draft PR opened.

- https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/182, base main, new, head f94418cd6b86994edabbc628b18a9a8aa7326d79

Merge risk: **low** - docs only; a revert fully undoes it, no public surface or critical path touched.

Review focus: No hotspots: documentation moved without a rule change, no code or critical path involved.

Reviewed: origin/main...sgs-173-architecture-store-rows, ARCHITECTURE.md and docs/aoe4-build-order-format.md, +70/-9. No invariants touched, no schema/security/concurrency surface. Stale-reference grep over README, docs and lib found no citation of the storage row.

Non-blocking notes: none. PR body saved at reports/pr-182-body.md.
