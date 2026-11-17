# Tech-lead gate: batch SGS-202-SGS-202

## Decision

APPROVE: draft PR opened. No blockers, no untested hotspots.

## PRs (bottom to top)

- SGS-202: https://github.com/NicholasKChoi/WOTR_Combat_Simulator/pull/211, base `main`, **new**, head pushed `c25d26efa3738f44bbc01fe80539a6945bfddebf` (branch `sgs-202-house-demand-held-order`). The body was set with `gh api` PATCH, and the PR is a draft.

### Merge risk
**low** - a revert fully undoes it (results are computed per request, nothing is stored), it touches no public surface or `criticalPaths` symbol (`houseDemand` is not listed), and tests pin both the exclusion and its end.

### Review focus
No hotspots: one condition in the house-demand sum, mirroring the held check production payment already uses; tests pin the later house start with a hold, the unchanged start without one, the start at the instant the hold ends, and the production-time check on a held order.

## What I reviewed

- Commit range: `bd0caf970d255207d84956d29ad57f700836a6af...c25d26e` (eaa9429, c25d26e).
- Files: `lib/aoe4-build-order/simulate.ts` (+3/-1), `lib/aoe4-build-order/simulate-busy-buildings.test.ts` (+57/-1), `docs/aoe4-build-order.md` (+4/-1), `lib/aoe4-build-order/README.md` (+3/-2). Total +67/-5. Reviewable business logic is +3/-1.
- Invariants A2 and A3: not violated. The change only zeroes a rate term in the projection. Payment checks are untouched, and the new tests assert `noneNegative` and an identical re-run.
- Irreversibility and security: none. `SimulationResult` is returned per request (`lib/aoe4-build-order/api.ts`) and is not persisted. There are no secrets, permission changes or new paths.
- Blast radius: `houseDemand` is not a `criticalPaths` symbol. Its output feeds `runHousePass`, so only builds that combine `autoHouses` with a held instance get different timings, which matches the commit messages and the ticket.
- Contract: no API or schema change. The docs and README match the code.
- Stack check: single member on `main`. The diff contains only this task.

## Non-blocking notes

- The rating is `low` even though the ticket's risk tier is `high`. The rating follows the diff factors (no `criticalPaths` symbol, no public surface, revertible, pinned by tests), not the tier.
- The PR has no issue line because the ticket's Source is a BACKLOG item, not a GitHub issue.
