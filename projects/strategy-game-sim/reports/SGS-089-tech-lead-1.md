# SGS-089 tech-lead 1

## Decision
OPENED. Draft PR #93, https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/93, base `main`, head `sgs-089-aoe4-engine-guard-crashes-hangs` @ 308d8f958a042a4a631ab8c2c4ca3ec95a266110. Not stacked, no footer. Body set with `gh api -X PATCH`.

## Merge risk (verbatim)
**low** - only adds two throw sites on input the API already rejects; valid-path values are untouched, a revert fully undoes it, no public surface or listed critical symbol changes (`productionSeconds` and `spawnUnit` are helpers), and tests pin both guards.

## Review focus (verbatim)
No hotspots: both guards only throw on input that validation and the shipped data never produce, each is pinned by a table test with the exact message (including the auto-house demand path and the zero-time research case), and shipped-build output is byte-identical with the guards in place.

## What I reviewed
- Range: origin/main fcfbaf1 (merge base) .. 308d8f9, two commits, both authored by choinickolas@gmail.com.
- Files: lib/aoe4-build-order/simulate.ts (+10/-3), docs/aoe4-build-order.md (+9/-1), lib/aoe4-build-order/simulate.test.ts (+76/-3), lib/aoe4-build-order/simulate-api.acceptance.test.ts (+44, new). Reviewable +19/-4 excluding tests.
- Checked: INVARIANTS A1-A3 (no payment change, valid-path value identical since `base` is the old `seconds`, no randomness), CONTEXT open questions (none), the only engine caller (`pages/api/aoe4-build-order/simulate.ts`, validates before calling; unchanged), shipped data `productionSpeed` effects (one, multiply 1.1, so never 0), criticalPaths symbols (hunks are in `spawnUnit` and `productionSeconds`, neither listed).
- Hotspot pinning: the guard is pinned by `invalid engine input` table tests in simulate.test.ts (exact messages, both autoHouses modes, houseDemand pair); unit-only condition pinned by research.test.ts zero-time upgrade test; rally guard pinned by the two-row rally table. Review and implementer reports record the mutation checks.

## Blockers
None.

## Non-blocking notes
- The byte-identical comparison in the implementer and review reports was against b9481e3, before the rebase onto fcfbaf1. The guards only throw and leave the returned value unchanged, and the new simulate-api acceptance test compares API output to the engine on every shipped build, so the rebase does not weaken the claim.
- A future civ whose `productionModifier` returns 0 for a unit would now cause a 500 from the API (an unhandled thrown Error) instead of a hang. The ticket's open question already notes that a 400 or a warning would be a separate owner decision.
