# SGS-215 implementer 11 (Re-spec 3 pass)

- Ticket: SGS-215, production past the population cap (risk high)
- Branch: sgs-215-production-past-population-cap
- Tip: 0d067911054013e38c9a3e3e6458e5f8a4d68936 (one commit on top of ae92952, which still stands per Re-spec 3)
- Base: origin/main 7d74800
- Checkout: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-215-production-past-population-cap
- Checkout call: `checkout.sh task` printed `reused ... ae92952`. The branch had no `origin/<branch>` ref before the call, so no pre-call record or own-commit check was needed (common.md Skips). The tip was unchanged by the call.

## Scope of this pass (Re-spec 3)

Re-spec 3 says ae92952 stands. This pass only does three things:

1. It deletes the ENG 1TC population-wait row.
2. It adds the ordering assertion to the lowered-cap row.
3. It swaps the one doc sentence.

## Files touched

- `lib/aoe4-build-order/simulate-population-limit.test.ts`:
  - Deleted the row "occur only before the cap on ENG 1TC at 1800 s".
  - Replaced `expect(result.populationCapReachedAt).toBeLessThan(800)` in "occur only before the cap at a lowered cap of 30" with three assertions: the cap instant is not null, `steps[1].armedAt` is not null, and the cap instant is less than `steps[1].armedAt`.
  - Dropped the imports that are now unused: `listBuilds`, `simulateBuildOrder`, `inputsFor`.
- `docs/aoe4-build-order.md`: the lift paragraph now carries the exact replacement sentence from the ticket.

## Tests run

- `npx vitest run lib/aoe4-build-order/simulate-population-limit.test.ts`: 14 passed.
- `npm test` (full unit suite): 96 files passed and 1 skipped; 3136 tests passed and 15 skipped; 0 failed.
- Invariant this pass encodes: once the cap is reached with supply at the cap, no step waits on `population`. The fixture puts a `produce` step's arming after the cap instant, and the test asserts that ordering before it applies the per-step rule:
  - `waitBreakdown.population` is at most `max(0, cap - armedAt)`;
  - no step has `waitingOn: 'population'` at the horizon.
- Acceptance specs added or edited in this pass: none.

## Pre-existing tests edited (this pass)

- `simulate-population-limit.test.ts`, row "occur only before the cap on ENG 1TC at 1800 s": deleted. Re-spec 3 and acceptance criterion 6 require it ("a row for ENG 1TC at 1800 s already on the branch is deleted").
- `simulate-population-limit.test.ts`, row "occur only before the cap at a lowered cap of 30": the ordering is now checked against the step's own `armedAt` instead of the literal 800. Criterion 6 asks for this ("first asserts that ordering (`populationCapReachedAt` is not `null` and is before that step's arming)").

The tests edited in the earlier pass are listed in SGS-215-implementer-7.md.

## Doc claims

`docs/aoe4-build-order.md`, lift paragraph. The sentence is verbatim from the ticket:

> "From then on a `produce` step and an order payment skip only the supply check; every other check still applies, so no step waits on `population` and population grows past the cap while supply stays at it and no house is planned."

What makes it true:

- `simulate.ts:hasPopulationRoom` returns true once the cap is reached and `supply >= maxPopCap`. The two callers (the `produce` handler at l.420 and `payOrder` at l.624) only replace the supply comparison; their other checks are untouched.
- Supply stays at the cap because of `addBuildingInstance`'s clamp, which is unchanged.
- No house is planned because `planAutoHouse` gets `room <= 0` at the cap, which is also unchanged.

## Pinned outputs

None new in this pass.

## Mutation checks

All checks ran in the scratch `mutate-SGS-215`, created with `checkout.sh scratch ... mutate-SGS-215 <branch> <branch>`. The task changes were copied in and committed there with explicit paths. Provisioning: `link-node-modules.sh .` through run.sh. There is no codegen and no acceptance spec under check.

Each break was reset with `git checkout -- lib/aoe4-build-order/simulate.ts` and confirmed clean with `git diff --exit-code`.

| # | Break (`simulate.ts`) | Item checked | Failure |
|---|---|---|---|
| 1 | l.420, `produce` gate: `!hasPopulationRoom(state, popcap)` changed to the old inline `state.population + popcap > state.supply`. This is the rejected alternative and also the base behavior. | The row's claim: no population wait after the cap | `AssertionError: step 1: expected 100 to be less than or equal to 1e-9` at the helper l.138, called from l.149 |
| 2 | l.358, `noteCapReached`: dropped the `=== null` guard, so it records the last spawn instant instead of the first | New assertion: the cap instant is before `steps[1].armedAt` | `expected 900 to be less than 800` at l.148 |
| 3 | l.562, `offerStep`: a step with a trigger never arms | New assertion: `steps[1].armedAt` is not null | `expected null not to be null` at l.147 |
| 4 | l.359, `noteCapReached` never assigns `populationCapReachedAt` | New assertion: the cap instant is not null | `expected null not to be null` at l.146 |

tree-record of the task checkout, before and after:

```
 M docs/aoe4-build-order.md
 M lib/aoe4-build-order/simulate-population-limit.test.ts
hash aa569da96cb9af1f1a009b250375b69e92e22058
```

The two records are identical. The scratch was removed (`removed .../worktrees/mutate-SGS-215`).

## Codegen, build, lint

- Codegen: not set.
- Build: `npx next build` passed.
- Lint: `npx tsc --noEmit` reported 0 errors. `npm run lint:dup` found 0 clones.
- `git status` was clean after the commit. Only the two named files changed in this pass.
- Re-ran the grep for the old wording ("go on to their") in docs, lib and data: no hits.

## Invariants

- A1: no new literal.
- A2 and A3: no engine change in this pass.
- S3: the bounded-run test from ae92952 still passes in the full suite.

## Unverified assumptions added

None.

## Out-of-scope findings

None new.

## Status

needs_review
