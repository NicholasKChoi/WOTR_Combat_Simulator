# SGS-038 ticket re-spec 2

Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-038-aoe4-depletion-engine.md (id, file and graph row kept). Input: reports/SGS-038-spec-gate-1.md (NEEDS_SPEC). Grounded on main f078c11 and design/M3.md.

## Gaps resolved

1. Auto-house fallback candidates: Scope now says the candidates are `NODE_REFS` minus every `DepositRef` the order does not name (farm and wood stay; explicitly not `runRefs(order)`). Ties go to the first in `NODE_REFS` order, the same first-wins `reduce` with `>` main runs over all eight nodes (`simulate.ts:499`). New criterion: farm is the fullest node, so the first auto-house takes builders from farm. Restricting to `runRefs` makes it fail. A sheep/farm tie picks sheep.
2. Run-out detection: dropped "set `depletedAt = now`". The engine collects run refs where `isDepleted` is true and `recordRunOut` has not been called, at the start of `runInstant` in `FINITE_NODE_REFS` order, and moves their gatherers to idle. At the end of the instant it calls `recordRunOut(stock, ref, now, idle[ref])` for that set. This covers a ref drawn down in `drawDown`, a ref clamped within tolerance, and a ref that starts at 0 (t=0). The diagram nodes are updated. New criterion: a ref that starts at 0 and a mid-run run-out are each recorded once.
3. Arrival at the run-out instant: design/M3.md has two rules that apply together. Behavior rules "node-depleted count" uses `idle[ref]` at the end of the instant, and "idle arrival" plus the `recordIdleArrival` contract cover every arrival at a depleted ref. Because run-outs apply before `applyDueEvents`, a same-instant arrival is counted in both warnings. The ticket states this is intended. New criterion: `berry: 0`, then `move 2 sheep to berry` with `walkSeconds: 0` at t=0. Its event is due in the same instant (`schedule` at `time + 0`, and `applyDueEvents` runs `time <= now`). The expected result is `node-depleted` with `idleVillagers` 2 and severity warning, and `idle-arrival` at 0 with 2.

## Notes folded in

- The `gold: null` independence criterion now uses `editGameData` to give `gatherNodes.gold.amount` a value (3000). It asserts `gold` gets `amount: null` and `gold#2` gets 3000, so it can fail.
- Issue path: the bare field name for step fields (`unknown node "iron" in from`, from `validate.ts:271`) and `start.rally` / `start.villagers` for the start (`validate.ts:202`, `226`). The M2 assertions in `validate.test.ts` still pass.
- Size: ~390 (up from ~380 for the pending-record list). Kept as one ticket with the named split candidate (validation and inputs first).

## Checks run on main f078c11

- `git grep -nE "gatherers\[[^]]+\] *(\+=|-=)" lib/aoe4-build-order/simulate.ts` finds 5 lines (231, 318, 341, 363, 367), matching the criterion.
- `git grep -n "never runs out" docs/aoe4-build-order.md` finds 1 line (25), matching the criterion.
- The farm-fullest and same-instant tests are new, so no mutation check was run. The code paths they target (`simulate.ts:499` reduce, `schedule` and `applyDueEvents` ordering) exist on main.

## Open questions

None. The same-instant double count follows the design's two rules read together. If the owner wants it excluded, that is a design change.
