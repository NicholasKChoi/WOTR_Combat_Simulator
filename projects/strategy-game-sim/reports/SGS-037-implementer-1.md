# SGS-037 implementer pass 1

- Ticket: SGS-037-aoe4-node-refs-warnings-depletion-module
- Branch: sgs-037-aoe4-node-refs-warnings-depletion-module
- Tip SHA: 7db232494e03ffcc96d3fd41a5b0b29b0e86346c (one commit on origin/main 2049e95)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-037-aoe4-node-refs-warnings-depletion-module
- Status: **needs_spec**. A pre-existing unit test the ticket does not let me edit fails (details below). Everything else is done and green.

## Blocking gap (needs_spec)

`lib/aoe4-build-order/data.acceptance.test.ts` > "repository constraints" > "model.ts exports exactly the 19 documented types and the two shared lists" (lines 310-337) pins the exact list of model.ts exports:
- `export type|interface` names must equal the 19 listed;
- `export const|function` names must equal `['GATHER_NODES', 'RESOURCE_KINDS']`.

The ticket's Scope requires model.ts to export the new types `FiniteGatherNodeId`, `DepositRef`, `NodeRef`, `FiniteNodeRef`, `Severity`, `StepWait`, `NodeDepletion` and `SimWarning`. It also requires the consts and function `FINITE_GATHER_NODES`, `MAX_DEPOSITS`, `NODE_REFS`, `FINITE_NODE_REFS`, `SEVERITIES` and `nodeKindOf`. So this test must fail. But the ticket's acceptance criterion says "the full unit suite passes unchanged apart from the `result-series.test.ts` literal". Its "Tests that must change" list does not name this test. I changed no assertion in it.

The fix I propose is the one SGS-035 made under its test-migration scope. Add this test to "Tests that must change":
- Rename it to "model.ts exports exactly the 27 documented types and the shared lists".
- Add the 8 new type names to the sorted list.
- Set the runtime-export list to `['GATHER_NODES', 'RESOURCE_KINDS', 'FINITE_GATHER_NODES', 'MAX_DEPOSITS', 'NODE_REFS', 'FINITE_NODE_REFS', 'nodeKindOf', 'SEVERITIES']`, which is source order.

It is about a 12-line test edit.

## Files touched

- `lib/aoe4-build-order/model.ts`: adds the finite node ids, `MAX_DEPOSITS`, the deposit/node ref types and lists (deposit refs generated once from `MAX_DEPOSITS`), `nodeKindOf`, `Severity`/`SEVERITIES`, `StepWait`, `NodeDepletion`, `SimWarning`, and `SimulationResult.depletions`/`.warnings`.
- `lib/aoe4-build-order/depletion.ts` (new): `runRefs`, `createNodeStock`, `isDepleted`, `drawDown`, `nextRunOut`, `recordRunOut`, `recordIdleArrival`, `depletionResults`, `sortWarnings`.
- `lib/aoe4-build-order/simulate.ts`: the result gains `depletions: []` and `warnings: sortWarnings([])`.
- `lib/aoe4-build-order/depletion.test.ts` (new): unit tests for the depletion module.
- `lib/aoe4-build-order/model.test.ts` (new): pins the lists, `nodeKindOf`, `@ts-expect-error` for `gold#1`/`gold#9`, and `SEVERITIES`.
- `lib/aoe4-build-order/simulate.test.ts`: new describe, empty depletions/warnings for the prebuilt build and a one-step order.
- `components/apps/aoe4-build-order/result-series.test.ts`: the literal gains `depletions: []`, `warnings: []` (ticket-mandated).
- `acceptance/aoe4-simulate-api-contract.spec.ts`: ticket-mandated edits (see below).
- `docs/api/openapi.json`: the 8 new schemas, `SimulationResult` properties and required, and example fields.
- `docs/aoe4-build-order.md`: Outputs bullets for `depletions` and `warnings`, and a note that both are empty today.

## Tests

- `depletion.test.ts` + `model.test.ts`: 24 passed. They encode:
  - the clamp (never below 0; returns the 20 actually drawn, not 50);
  - the tolerance snap;
  - deposits drawn independently; null and depleted refs draw nothing;
  - earliest exact run-out;
  - first record wins, and the ignore rules;
  - idle-arrival keeps the first `at` and sums the counts;
  - depletions in `FINITE_NODE_REFS` order with the starting amounts;
  - severity `warning`/`info` by idle count, never `error`, and the exact design messages (plus the singular "1 villager is");
  - `depletionResults` warnings returned sorted;
  - the full tie order of `sortWarnings`, which is pure, returns a new array and is idempotent;
  - `runRefs`: the six nodes with no deposit, the 8-ref case, every step field and `start.rally`, and unknown strings ignored.
- `simulate.test.ts` (with the above): 81 passed earlier. The new describe passes.
- Full `npm test`: 733 passed, 1 failed. The failure is the data.acceptance export-list test above.
- Playwright `acceptance/aoe4-simulate-api-contract.spec.ts`: 57 passed. This includes the live-response-equals-example test, enum equality against the TS consts, and the NodeRef/FiniteNodeRef union test.

## Pre-existing tests edited

- `components/apps/aoe4-build-order/result-series.test.ts`, SimulationResult literal: gains `depletions: []` and `warnings: []`. Allowed by "Tests that must change" (tsc fails otherwise).
- `acceptance/aoe4-simulate-api-contract.spec.ts`, all allowed by "Tests that must change":
  - the `simulationResult` key literal gains `depletions`/`warnings`;
  - `NodeDepletion` is added to the response-schema list, the key literals and typeKeys;
  - the 7 new shared schema names are added (including `DepositRef`);
  - new tests check the SimWarning variants: closed, all fields required, descriptions, key literals;
  - a new describe checks enum and union equality against `FINITE_GATHER_NODES`, `SEVERITIES`, the `StepWait` values, `NODE_REFS` and `FINITE_NODE_REFS`;
  - the simulationResult example literal gains the two fields.
- `simulate.test.ts`: only new tests were added. No existing assertion changed.

## Mutation checks (each restored, then verified with cmp/diff)

The ticket's three mutations:
- Clamp removed (`Math.min` dropped): fails "never takes a ref below 0".
- Severity `idle > 0` changed to `>= 0`: fails the warning/info test.
- `FINITE_NODE_REFS.indexOf` swapped for a different order in the sort:
  - an alphabetical order fails 2 tests;
  - `FINITE_GATHER_NODES` order fails the sort test;
  - **`NODE_REFS.indexOf` survives, and the mutant is equivalent.** `NODE_REFS` differs from `FINITE_NODE_REFS` only by `farm` and `wood`, which can never be a warning's `node`. The relative order of every finite ref is the same in both lists, so no test can tell them apart.

Other mutations, all killed:
- snap removed;
- sort reversed, step-stuck sorted first, step order reversed, `at` reversed;
- sort mutating its input;
- `drawable` filters (2);
- `nextRunOut` rate `>= 0`, and `min` changed to `max`;
- recordRunOut: first record wins, and the stocked-ref guard;
- recordIdleArrival: count guard, stocked guard, first-`at` rule;
- depletion results order;
- `depletionResults` without the sort (killed by the new "returns its warnings sorted by at" test);
- runRefs: each field dropped (rally, then, to, from, step rally, start.rally, start.villagers keys), and the output order;
- stock start amount;
- `isDepleted`;
- the singular message;
- deposit count;
- `nodeKindOf`;
- the finite filter;
- `SEVERITIES`;
- deposits placed before `gold` in `withDeposits`.

One equivalent mutant: placing the deposits after `gold` versus before `stone` gives identical lists, because `gold` immediately precedes `stone` in both lists.

## Codegen, build, lint

- Codegen: none configured.
- `npx next build`: passes.
- `npx tsc --noEmit`: clean.
- `npm run lint:dup`: 0 clones.
- `git grep -nE "1e-|EPSILON" lib/aoe4-build-order/depletion.ts`: no hits. `RESOURCE_TOLERANCE` is imported from engine-common.
- `git diff --stat origin/main`: only the 10 intended files. There was no lockfile, next-env or AGENTS.md drift.

## Invariants

- No node amounts in code: none were added. The stock takes `nodeAmounts` structurally; D supplies them.
- Clamp: `remaining` never goes below 0 and snaps to exactly 0 within `RESOURCE_TOLERANCE`. There is one tolerance and no local literal.
- The module is pure: no clock or random source, and `sortWarnings` does not mutate its input.
- `MAX_DEPOSITS` is the single source for the deposit refs in both lists. The `DepositRef` type is checked by `@ts-expect-error` and by the openapi union test.
- Engine behaviour is unchanged. Every existing simulate/timing/series test passes, and the new fields are empty.

## Out-of-scope findings

- The ticket cites lines 25/323/617 of `docs/aoe4-build-order.md` for the depletion grep. On this base the hits are lines 25/325/631. The text is unchanged.
- The contract spec has no "every schema is referenced" check, so `NodeRef` being unreferenced needs no exemption.
- The data.acceptance export-list test (above) will need updating in every ticket that adds a model.ts export (D, E, G, H likely). Future tickets could list it under "Tests that must change".
