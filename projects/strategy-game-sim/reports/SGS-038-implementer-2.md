# SGS-038 implementer report 2 (rebase plus re-spec 3 test edits)

- Ticket: SGS-038 (re-spec 2026-11-01 (3))
- Branch: `sgs-038-aoe4-depletion-engine`
- Tip: `4749c131b56acd7dc74aac7a90b3d7aef15ba916`
- Base: `origin/main` 77fa279 (contains SGS-041 and SGS-043)
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-038-aoe4-depletion-engine`
- Commits (author Nick Choi <choinickolas@gmail.com>, both with the Co-Authored-By and Claude-Session trailers):
  - `12f0c53` Run finite gather nodes dry and report run-outs (the old 93a1e2b, rebased)
  - `4749c13` Update existing tests for finite node stock and the farm build walk (new)

## Step 1: rebase

`git rebase origin/main` applied the single branch commit with no conflicts. I checked the rebased `simulate.ts` against main by hand:

- SGS-043: `spawnUnit` still runs `state.spawnedPopulation += entry.costs.popcap`. Its arrival callback now goes through `assignGatherers(s, rally.node, 1)`, so the walk still decrements `walking` and the villager lands in `gatherers` or `idle`. `createEngine` still seeds `spawnedPopulation = aliveVillagers(engine) + startUnitPopulation(...)`, and `aliveVillagers` counts `gatherers + idle + walking` over `NODE_REFS`. `spent` is unchanged: `payCost(..., 'buildings')` is still in `startConstruction`, and the `spent`/`spawnedPopulation` series are in the result.
- SGS-041: `researchedIds`, `researchHandler` and `researchNotes` are untouched.
- Result shape: main's shape plus `depletions` and `warnings`, both filled from `depletionResults(stock)`. There is no `markers`. `sortWarnings` is no longer imported, because `depletionResults` does the sorting.

## Step 2: test edits (new commit 4749c13)

The verified diff applied cleanly to the rebased files. These are the existing tests I edited, each allowed by the ticket's "Tests that must change" (re-spec 3):

- `acceptance/aoe4-simulate-api-contract.spec.ts`, "bounds match SIM_INPUT_BOUNDS": the `count` location now reads `variant('move').properties.count.oneOf[0]`, and I added `nodeAmount: () => [overrides.nodeAmounts.additionalProperties.oneOf[0]]`. The `nodeAmounts: true` key in `simInputOverrides` was already in the branch commit.
- `acceptance/aoe4-simulate-api-depletion.spec.ts`, the four request tests: they now expect `depletions` to be the six null rows from `FINITE_GATHER_NODES` and `warnings` to be `[]`. I renamed the describe title and the per-test suffix as the ticket says. The determinism test is unchanged.
- `acceptance/aoe4-simulate-api-timelines.spec.ts`, research-extension final food: 596.2798390913501 becomes 618.3789316586852 (`toBeCloseTo(..., 6)`).
- `lib/aoe4-build-order/simulate.test.ts`, "exports exactly the seam names": adds `assignGatherers` and raises the count from 12 to 13. Main's SGS-041 and SGS-043 did not change the export count.
- `lib/aoe4-build-order/simulate.test.ts`, "depletions and warnings > are empty while every node is infinite": `depletions` must now equal the six null rows (value import of `FINITE_GATHER_NODES`).
- `lib/aoe4-build-order/validate.test.ts`, "resolveSimInputs > returns the defaults, trips and walk read from data": adds `nodeAmounts: expect.any(Object)`.
- `lib/aoe4-build-order/validate.acceptance.test.ts`, "exports exactly the runtime names": adds `nodeRefIssue`.

No other existing test changed.

## Step 3: gates (Node v24.22.2)

- `npx tsc --noEmit`: clean.
- `npm run lint:dup`: 0 clones.
- `npm test` (full suite): 33 files, 828 tests, all passed.
- `npx next build`: succeeded.
- `npm run acceptance` (full Playwright suite): 380 passed.
- Codegen: not configured.
- `git grep -nE "gatherers\[[^]]+\] *(\+=|-=)" lib/aoe4-build-order/simulate.ts`: 2 lines (151, the arrival add in `assignGatherers`; 158, the take-from removal in `sendWalking`).
- `git grep -n "never runs out" docs/aoe4-build-order.md`: 0 lines.

## Mutation checks after the rebase (spawn and idle accounting)

I applied each break to `simulate.ts`, ran `simulate-depletion.test.ts` and `simulate-series.test.ts`, then reverted it with `git checkout`. The tree was clean afterwards and no break was committed.

| Break | Result |
|---|---|
| M1: spawn arrival bypasses `assignGatherers` (`s.gatherers[rally.node] += 1`) | 1 failed: "leave spawned villagers idle at a depleted rally, alive and counted" |
| M2: `aliveVillagers` drops `idle` | 1 failed: "counts idle villagers as alive for a villagers trigger" |
| M3: `spawnUnit` drops the `spawnedPopulation` increment | 5 failed (simulate-series spawnedPopulation tests) |
| M4: `createEngine` seed drops `aliveVillagers` | 6 failed (simulate-series spawnedPopulation tests) |
| M5: `collectRunOuts` does not move gatherers to `idle` | 8 failed (node-depleted count, t=0 run-out, alive count, take-from-idle, and others) |
| M6: `sendWalking` does not remove idle villagers | 1 failed: "node-depleted idle count is read at the end of the run-out instant" |

## Invariants

- A1: `createdBy` is in `rules/base.json` (farm only). No amount is set and none is hard-coded.
- A2: `drawDown` clamps each stock at 0, and payments still check before spending.
- A3: the determinism tests pass in both the unit and the Playwright suites.
- S3: `nodeAmount` is bounded at 0..100000 (integer) in `validate.ts`.
- SGS-043's population accounting is kept: idle villagers count as alive and as spawned population, and M2, M3 and M4 confirm the tests catch a regression.

## Diff hygiene

`git diff --stat origin/main` lists exactly the ticket's files plus the six test files above. Lockfile, package and stray files are untouched. No dev server or Playwright process was left running, and nothing is listening on a 3xxx port.

## Out-of-scope findings

None.

## Status

`needs_review`
