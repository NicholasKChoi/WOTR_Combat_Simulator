# SGS-154 spec gate 2

Verdict: NEEDS_SPEC. Risk `low` stays correct (test-only, no critical path, no strongModelTrigger).

Read at origin/main after `git fetch origin`. Deleted tests read at `27e8840^`.

## Pass 1 gaps: closed

- Former item 4 (`auto-houses-held`) is in Dropped; the warning is gone from the engine.
- Former item 5 is restated on the first time-triggered `man-at-arms` step. It is grounded: the build JSON has `{kind:'time', seconds:681}` on the first barracks `man-at-arms`, and the schema's `StepTiming` has `armedAt`, `startedAt` and `waitBreakdown.resources`.
- Item 1 derives its key list from `schemas.SimulationResult.properties`. `schemas` is exported by `acceptance/openapi-schemas.ts`, and `SimulationResult` has 19 properties at main.
- The LOC estimate no longer counts nonexistent files. The wording is garbled ("new or restored cases in new or restored cases").

## Gaps

1. Item 5 (triggers, infinite-node run) - "a positive integer `idleVillagers`" on every depleted node's warning is wrong (check 13). Schema `node-depleted.idleVillagers` has `minimum: 0`, and severity is `warning` only when villagers were left idle, else `info`. The deleted test itself asserted `severity: 'info', idleVillagers: 0` for gold at 3600 s, and `builds.test.ts:130` asserts `idleVillagers` 0 for built-order depletions. At a horizon where gold runs out, the criterion fails, and the implementer would pick a horizon or node set until it passes. Item 5 also names no horizon. The default is 1200 s, and the deleted sheep depletion (about 783 s) is an engine-tunable fact.
   Fix: "an integer `idleVillagers` >= 0, with severity `warning` exactly when `idleVillagers` > 0, else `info`". Name the horizon as an input (for example 3600). Keep the precondition that at least one depletion exists. Name the build ("the prebuilt English build" is ambiguous among four JSON files; the deleted test used `english-1tc.json`).

2. Item 2 (markers, truncated horizon) - the horizon rule is underspecified, so an implementer would guess. `durationSeconds` is an integer in 60..3600, but "strictly before `completedAt`" is a real-valued instant. The "before" horizon must also fall at or after the step's `startedAt`, or the status is `waiting` or `not-reached` instead of `in-progress`, and the stated outcome fails. "A marker carries its label" is also vague: for research, `ChartMarker.label` is the researched tech's `baseId`.
   Fix: "Before-horizon is the largest integer strictly below `completedAt` (asserted to be >= the step's `startedAt`). After-horizon is `ceil(completedAt)`. The marker label is the step's `tech`."

3. Item 3 (veterancy-conversion) - one criterion cannot fail, and the series identification is left unstated.
   - "The summed per-`baseId` count ... equals the sum of the tier series at the last sample" restates the definition of the sum. The deleted test compared it to `finalCount(result, 'longbowman')`, an independent helper, and to a pinned 63. Without a second source the assertion passes for any engine.
   - "Lower tier" and "upper tier" are not tied to a response field. The response series carry `unitId`, `baseId` and `tier`.
   - "Long horizon" is not given as an input.
   Fix: drop the tautology, or compare to the re-added `finalCount`, and say which. Select the two series as the `baseId === 'longbowman'` entries ordered by `tier`, and assert there are exactly two. Name the horizon as an input (the deleted test used 1800).

4. Item 4 (spear-longbow) - "at the two horizons the deleted loop used" points into git history and gives no values. The same file today has no such loop. An implementer must dig through `27e8840^` to learn them, and the values are 1200 and 3600.
   Fix: state the horizons as inputs: 1200 and 3600.

5. Item 6 (depletion-engine) - "adds exactly its `nodeAmounts` stock to the bank" does not say which response field the bank is. The deleted test used `floating[<resource>]` last minus first, with `autoHouses: false` and only a pause step so nothing is spent. Cases (a) to (c) also state no start, steps or horizon. Case (a) must run to exhaustion within the horizon, and that depends on the rate the ticket forbids probing.
   Fix: say "the `floating` series of the node's resource rises by exactly the stock over the run, with `autoHouses: false` and a build that spends nothing". Add the precondition that `depletedAt` is not null, and say the horizon is chosen so that it holds. Say the setups are the deleted tests' own (start villagers, pause step) and that only the rate-derived expected instants are dropped.

## Checked and fine

- Items 1, 2, 3, 7 name files that exist (`aoe4-simulate-api-veterancy-conversion.spec.ts` is absent at main, as the ticket says; the others exist). `finalCount` is gone from `helpers.ts`, as the ticket says. `INFINITE_NODES`, `WARM_UP_TIMEOUT_MS`, `simulateOk`, `postSimulate` and `buildOrderFrom` exist.
- Item 7: `spent` is a cumulative series (`Record<SpendCategory, number[]>`). "Ends at" resolves to the last sample, matching the deleted test, which is source-backed.
- Item 4: arming at the time trigger is stated in the `StepTiming` schema. Selection by first `man-at-arms` with a `time` trigger is unambiguous.
- Item 6(b) and (c) have `idle-arrival` and numbered-gold-deposit behavior at main (`SimWarning`, `NodeDepletion`).
- Invariant A3 listed, no contradiction. Dropped list is consistent with the engine. No open questions. Unverified assumptions `none` is right (own API). On merge `none`. No docs touched. No other TASK-GRAPH ticket removes the code involved (not exhaustively checked).

## Notes

- Acceptance bullet typo: "the an `idle-arrival` row".
- Item 1: "the villager series ends at the order's villager count" should say start villagers plus the produce count, since the order has both.
- The research completion instants of item 3 ("from that step's `completedAt`") need a sample at or after it; say "first sample at or after `completedAt`" for the upper-tier check and "last sample strictly before" for the lower-tier one (also in pass 1).
