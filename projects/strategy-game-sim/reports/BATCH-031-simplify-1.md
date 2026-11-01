# BATCH-031 simplify pass 1

Branch sgs-031-aoe4-build-move-ages, diff vs ce342db. Tip before: cc00670. Tip after: c88fb01 (one new commit, local only, not pushed).

## /simplify invocation
The Skill tool was invoked with skill "simplify". Its phase 1 was followed: four separate reviewer subagents (reuse, simplification, efficiency, altitude) ran in parallel over the source diff (houses.ts, simulate.ts; tests excluded). Reviewers were not inline.

## Changed
- simulate.ts `houseGateOpen`: replaced `steps.map(...).lastIndexOf(true)` (allocates an array on every instant) with a reverse loop returning at the last build-house step. Same behavior. `findLastIndex` was not used because tsconfig target is es2017.

## Tried and reverted
- `LANDMARK_CLASS` as a regex literal: the existing source-shape test on main (numeric literals in simulate.ts) counts the `3` in `[1-3]`, so the `new RegExp('...')` form is deliberate. Reverted; test untouched.

## Declined
- Duplicate `GATHER_NODE_ORDER` (simulate.ts and parse-text.ts): fix means exporting from model.ts and editing parse-text.ts, which is outside this diff.
- houses.ts re-implementing `supplyOf` and `villagerWalk` (and redeclaring HOUSE/VILLAGER): reuse needs a runtime import of simulate.ts from houses.ts, which simulate.ts already imports, creating a cycle; or a move to a shared module, a larger restructure than a simplify pass. Left for a backlog item.
- Cache or early-exit for `houseDemand` per instant, running `pendingSupply` counter: behavior-risky for a high-risk ticket, no measured cost; left.
- Optional `then`/`walkSeconds` on Construction, `Engine` typed params to drop casts, dispatch/return villager helper extraction, `advanceAge` helper with data-level landmark predicate, rule-based builder-source fallback: design changes beyond quality cleanup.
- `currentUnitEntry` kept (required name). houses.ts `shortfall <= 0` kept. Spend-loop extraction not done. No existing test edited.

## Verification
`npx tsc --noEmit` clean. `npm test`: 25 files passed, 681 tests passed (0 failed).

Final tip: c88fb01
