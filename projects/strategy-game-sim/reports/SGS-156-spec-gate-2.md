# SGS-156 spec gate 2

Verdict: NEEDS_SPEC (one gap, owner)

Read at origin/main (e50e074). `git fetch origin` printed `failed to run reflog` / `task 'gc' failed` (sandbox); refs read were fine.

## Spec-gate-1 gaps: all seven closed

1. Window formula: Scope 1 states `W = lead + G` for both the pending filter and the projection, and says `G = 0` reproduces today's planner including the `arriving` window. Closed.
2. Two or more houses: Scope 2 holds one house's cost whatever the count. Closed.
3. When the hold is computed: Scope 3 names three passes (before first `offerSteps`, after `applyDueEvents`, after `startProduction`) and says `nextWake` reads the last. Closed.
4. How the hold applies: Scope 4 gives a per-resource rule on spent resources, a field on `EngineState` read through one shared helper, and real amounts for `reserve` and `payCost`. Closed.
5. Due-flip wake: Scope 5 says none is added and release takes effect at the next existing wake. Closed.
6. No-income criterion: rewritten as an observable payment outcome. Closed.
7. Criterion 1 observability: now a villager-series gap bound with preconditions asserted, failing at base. Closed.

## Other checks that pass

- Grounded: `planAutoHouse`, `HouseDemand` (houses.ts); `startAutoHouses`, `houseDemand`, `houseBuilderSource`, `orderNeed`, `payOrder`, `offerSteps`, `offerReactions`, `runInstant`, `nextWake`, `incomePerSecond`, `gatherRatesOf`, `produce`, `build` (simulate.ts); `researchHandler` (research.ts, `canAfford` at line 54); `canAfford` (engine-common.ts). Current `runInstant` order and `startProduction` resetting `engine.needs` match the ticket's description. Named tests exist: "wake when the house becomes affordable", "ignore a waiting step reserve", "project the demand at the modified production speed" (simulate-construction.test.ts), "paces auto-houses by the build time of the upgraded tier" (research.test.ts), "gives an order without build-house steps auto-houses at 120, 220 and 320 s" (simulate-house-gate.test.ts).
- Hold-release timing: I checked whether a step refused by the hold could miss its wake when the hold drops in pass 3. A house start in pass 3 also lowers the bank by the house cost, so the step stays unaffordable and `nextWake` is right. No gap.
- Time passage only shrinks `G`, so a house only leaves "due" between events, never enters it. Scope 5's no-flip-wake rule is consistent.
- Tests: Scope 8 states a rule, with examples marked as examples. Many unit and Playwright tests rely on the default `autoHouses: true`; the rule covers them. Acceptance specs that run with auto-houses on (grep): house-gate, house-rule, waits (line 94), triggers (line 249), api-contract (line 463), spend-population; Scope 8 names them for the implementer to classify.
- Risk `high` right (`runInstant`, `orderNeed`, `nextWake` are criticalPaths symbols). Invariants A2, A3 named and not contradicted. On merge `none` and Unverified assumptions `none` fine (pure engine). Open questions none. No overlapping open ticket in TASK-GRAPH. Size about 220 LOC. Diagram present and matches Scope 3. No Decisions in PROJECT.md to conflict. No new input at a trust boundary.

## Gaps

1. **Scope 2 and 6, hold for lack of builders never ends when builders can never exist** (owner).
   - Missing: the owner decision "keep holding when builders are unavailable, no release" is justified in Scope 6 only by "builders return as gatherers free up". `houseBuilders` ranges 1 to 200 (`bound(1, 200)` in schema.ts; default 1). `houseBuilderSource` counts only gatherers (idle and walking villagers do not count). With fewer gatherers on all house sources than `houseBuilders` permanently (for example `houseBuilders` 5 with a 4-villager start, villagers paused or idle at a depleted node, or a villager target reached), a due house never starts. Today that only caps supply; with this ticket every step and non-villager order also waits forever on a hold that cannot clear. A3 stays true but the build order stalls, and the stuck warning blames a step for a house deadlock.
   - Why an implementer guesses: Scope says "no release for lack of builders" and "builders return", so a permanent shortage is unspecified. They could release, cap, or leave the stall.
   - Proposed fix: state what happens when no gatherer count can ever satisfy the house. For example, the hold is released (and nothing is held) when the villagers that exist (gathering, walking, or building, not idle) total fewer than `houseBuilders`, since no wait can end it; the hold stays while enough exist but are busy. Add one criterion for it ("with fewer villagers than `houseBuilders` and a due house, a wood step and a non-villager order pay at their own cost"). Owner confirms because it narrows their no-release decision.

## Notes (non-blocking)

- Scope 7 names three docs sentences. Also stale after the change: lines 327-334 of `docs/aoe4-build-order.md` ("A house waits only when no node has enough gatherers or a resource of its cost is short; supply may block production meanwhile" now also blocks steps and orders; "finish within the lead ... (one finishing exactly at the lead counts)" becomes lead plus gather time). The final criterion ("no sentence left saying ...") covers the named ones only; add "every statement of the lead window" so these are fixed too.
- The openapi `autoHouses` description (gate 1: stays true) is unchanged; no doc outside `docs/aoe4-build-order.md` mentions the old timing.
- The Context line "one more wood villager does not help" and the Cause bullet list are fine as narrative.
- The Scope 8 and 9 reports (edited tests, dependent specs, PR-description changelog) belong in the implementer report, not the ticket; fine as written.
