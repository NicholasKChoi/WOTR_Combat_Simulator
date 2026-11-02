# SGS-043 review 2 (rework 1)

Verdict: **APPROVE**

Branch sgs-043-aoe4-spend-population-series, tip 4f5fb104ae6df1cd5177361b13c3a2331b0dcc56. Delta reviewed:
`be39f66..4f5fb10` (only `lib/aoe4-build-order/simulate-series.test.ts`). Production code at be39f66 was fully
reviewed in round 1 (`reports/SGS-043-review-1.md`) and is unchanged.

## Blocking findings

None.

## Rework 1 fixes

- New test `populationCapReachedAt > stays set after later spawns` (simulate-series.test.ts:158-169) is sound.
  - It sets the scout popcap to 4 and `maxPopCap` to 11, then produces 3 villagers from t=2 with houses off.
  - It asserts `populationCapReachedAt` equals the first spawn instant (2 + villager time).
  - It asserts that the final `spawnedPopulation` is the start value + 3 and is greater than 11. So at least two
    spawns land after the cap was reached, and the test genuinely exercises spawns after the cap.
- Mutation re-run by this gate: I removed `engine.populationCapReachedAt === null &&` from `simulate.ts:204`. Vitest
  then failed exactly `stays set after later spawns` (1 failed, 13 passed in that file). I restored the file with
  `git checkout`, and the tree is clean.
- The optional tidy is behavior-neutral.
  - `RESOURCE_KINDS` (`model.ts:19`) is `['food','wood','gold','stone']`, the same values as the removed local `KINDS`.
    Order does not matter for a sum anyway.
  - `costOf` was renamed to `totalCostOf` at every call site in the file, and no expected values changed.
  - The name no longer shadows `costOf` from `engine-common.ts:17`.

## Gates (Node 24, review worktree)

- `npx tsc --noEmit`: clean.
- `npm run lint:dup` (jscpd): 0 clones.
- `npm test`: 32 files, 748/748 passed.
- No `reviewBot.cli` and no `rulesFile` are configured, so no bot ran.

## Acceptance criteria

All criteria pass. Round 1 recorded evidence for everything except the "stays set after later spawns" clause of the
`populationCapReachedAt` criterion, and that clause is now covered by the test above. I ticked all criteria in the
ticket. INVARIANTS: the delta is test-only, so no invariant is touched, and round 1's invariant analysis still holds.

## Non-blocking notes

None.

## Coverage

I reviewed the full delta diff and checked the context it relies on: the `populationCapReachedAt` describe helpers,
`simulate.ts:204` and `model.ts:19`. I did not re-review files outside the delta; round 1 covers them.
