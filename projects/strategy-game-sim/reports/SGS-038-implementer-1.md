# SGS-038 implementer report 1

**Status: needs_spec.** The work is done and committed. Some pre-existing tests and acceptance specs fail because the ticket changes the behavior they assert, and the ticket does not list them under "Tests that must change". Following the rule, I changed no assertions in them. The exact fixes are below.

- Ticket: SGS-038 aoe4-depletion-engine (risk high)
- Branch: `sgs-038-aoe4-depletion-engine` (base origin/main 9137cf2)
- Tip: 93a1e2b2271f9ddd5d86ca679a5e5b835076ad50
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-038-aoe4-depletion-engine

## Files touched
- lib/aoe4-build-order/simulate.ts: per-ref stock and idle state, exact run-out wake, income credited up to the remaining stock, idle at run-out and on arrival at a dry ref, `move all`, `createdBy` arrives at completion with no walk, auto-house source reads gatherers only (fallback over NODE_REFS minus unnamed deposits, first-wins tie), `depletions` (one row per run ref) and `node-depleted`/`idle-arrival` warnings. Exports `assignGatherers`; `availableAt` stays internal.
- lib/aoe4-build-order/validate.ts: `NodeRefProblem` and `nodeRefIssue(value, finiteOnly)` used at every node position, `move.count` accepts `'all'` (move only), `SIM_INPUT_BOUNDS.nodeAmount = bound(0, 100000)` integer, and `nodeAmounts` resolution (13 keys; each `gold#k` defaults to the gold amount; path `inputs.nodeAmounts.<key>`).
- lib/aoe4-build-order/model.ts: node positions typed `NodeRef`, `move.count: number | 'all'`, `SimInputs.nodeAmounts`. No exports added, removed or renamed.
- lib/aoe4-build-order/api.ts: `SimInputOverrides.nodeAmounts` partial override.
- lib/aoe4-build-order/data.ts: `GatherNodeRules.amount?` and `createdBy?`.
- data/aoe4-build-order/rules/base.json: `"createdBy": "farm"` on gatherNodes.farm. No `amount` added.
- docs/aoe4-build-order.md: bounds table, task-switch and build/move text, new Depletion section, results text. No "never runs out" remains.
- docs/api/openapi.json: node fields use NodeRef, `move.count` oneOf integer or `all`, `nodeAmounts` input, depletions/warnings descriptions. The 200 example now has six null depletion rows, which is what the engine returns now. The file is re-serialized in its canonical `json.dumps(indent=2)` form, same as main.
- acceptance/aoe4-simulate-api-contract.spec.ts: only `nodeAmounts: true` in the `simInputOverrides` key literal. The ticket allows this edit.
- lib/aoe4-build-order/validate.test.ts: added node-ref, move-all and nodeAmounts tests.
- lib/aoe4-build-order/simulate-depletion.test.ts (new): 26 engine depletion tests.

## Tests
- simulate-depletion.test.ts: 26/26 pass. What they check:
  - A run-out happens at the exact instant (berry 601 with 3 villagers, between samples) and credits exactly the stock, never more.
  - Determinism (A3).
  - At t=0 a run-out gives a warning or info with an idle count.
  - Idle villagers count as alive for villagers triggers.
  - With default inputs every ref is infinite: six null rows and no warnings.
  - Per-deposit defaults with `editGameData` (gold 3000, `gold: null` reaches deposit 1 only) and a `gold#2` override of 2500. Deposits draw down independently. A deposit is listed only when the order names it.
  - The `node-depleted` idle count is read at the end of the instant.
  - Idle arrivals from move, spawn rally, build `then` and an auto-house builder's return.
  - Move and build take idle villagers first. Gatherers and idle are never both above zero at one ref.
  - `move all` takes everyone. On zero villagers it completes at once.
  - Auto-house never takes idle villagers. It picks the fullest node; a sheep/farm tie goes to sheep.
  - Build legs: farm then farm arrives at completion; mill and other `then` values pay both legs.
- validate.test.ts additions all pass:
  - Node-ref table: `gold#1`, `gold#0`, `gold#9`, `gold#2#3`, `wood#2`, farm/wood under finiteOnly, non-string.
  - The same issue at every node position.
  - The M2 message for an unknown node.
  - `move all` syntax (`All` and `"3"` rejected, produce `all` rejected).
  - nodeAmounts: 13 null defaults, per-deposit default and merges, bounds table rows, non-object input, 0/100000 accepted, 100001 out-of-range.
  - houseBuilderSource and trips reject `gold#2`.
- `npm test`: 802 passed, 4 failed. All 4 failures are pre-existing tests (listed below).

## Pre-existing tests edited
None. The only test-file edit is the ticket-allowed `nodeAmounts: true` key in acceptance/aoe4-simulate-api-contract.spec.ts.

## Pre-existing tests now failing (needs_spec)
1. lib/aoe4-build-order/simulate.test.ts "source shape > exports exactly the seam names". It asserts 12 simulate.ts exports. The ticket requires exporting `assignGatherers`. Fix: add `'assignGatherers'` and make the count 13.
2. simulate.test.ts "depletions and warnings > are empty while every node is infinite". It asserts `depletions: []`. The ticket requires one null row per run ref. Fix: expect the six FINITE_GATHER_NODES rows with `amount: null` and `depletedAt: null`, and `warnings: []`.
3. lib/aoe4-build-order/validate.test.ts "resolveSimInputs > returns the defaults, trips and walk read from data". Its toEqual has no `nodeAmounts`. Fix: add `nodeAmounts: expect.any(Object)` or the 13-key null record.
4. lib/aoe4-build-order/validate.acceptance.test.ts "exports exactly the runtime names validateBuildOrder, resolveSimInputs, SIM_INPUT_BOUNDS". This is acceptance-owned. The ticket requires exporting `nodeRefIssue`, so the expected list needs `nodeRefIssue` added.
5. acceptance/aoe4-simulate-api-contract.spec.ts "bounds match SIM_INPUT_BOUNDS". This is acceptance-owned.
   - tsc TS2741 at line 210: the `locations` record has no `nodeAmount` key. Fix: `nodeAmount: () => [overrides.nodeAmounts.additionalProperties.oneOf[0]]`.
   - The `count` test fails because `move.count` is now oneOf. Fix: use `variant('move').properties.count.oneOf[0]`.
   - Both bounds tests fail in Playwright: `nodeAmount` (TypeError, locations[name] is not a function) and `count` (toMatchObject).
6. acceptance/aoe4-simulate-api-depletion.spec.ts "depletions and warnings until the engine reports them" (4 tests). This is acceptance-owned. They assert empty `depletions` arrays; the engine now returns six null rows.
7. acceptance/aoe4-simulate-api-timelines.spec.ts "researches that wait on resources ... floating bank ends at the pinned values". This is acceptance-owned. The final food is now 618.3789316586852; the pin is 596.2798390913501. This is the `createdBy` farm walk fix the ticket expects. Every other pin in that test is unchanged within closeTo 6.

## Mutation checks (each break was undone and git status checked as clean)
Every break below made at least one test fail; the number in parentheses is how many failed.

simulate.ts:
- Never mark idle at a run-out (7).
- No run-out wake (3).
- Credit ignores the stock (1).
- Record the run-out at the start of the instant (2).
- An arrival always gathers (6).
- Available count ignores idle villagers (4).
- `move all` with zero villagers does not complete (1).
- `move all` takes one fewer (3).
- House source counts idle villagers (2).
- House candidates use runRefs (1).
- House tie goes to the last candidate (2).
- `createdBy` never applies (1).
- `createdBy` always applies (3).
- Alive count excludes idle villagers (1).
- Stock built over every finite ref (2).
- Stock built over no refs: the test file crashes.

validate.ts:
- Deposit default is null (3).
- `gold#1` allowed (11).
- `all` ignored in checkField (1+).
- `all` allowed at every count position (1+).
- farm counts as finite (2+).
- A null override is ignored (2+).
- The node check is bypassed in steps (7+).
- The step node path is replaced by a constant (8).
- nodeAmounts is not read as a record (2).
- The nodeAmount bound is loosened to 1000000 (2).
- houseBuilderSource accepts deposits (2).
- A non-string node gets the wrong code (2).
- A multi-suffix ref is allowed (10).
- The lower range check is dropped (10).
- The suffix-node check is wrong (13).

## Codegen, build, lint
- Codegen: none configured.
- lint: `npx tsc --noEmit` fails only on acceptance/aoe4-simulate-api-contract.spec.ts(210,9) TS2741 (item 5). `npm run lint:dup` finds 0 clones.
- build: `npx next build` fails at type check on the same spec line. With that one line temporarily patched, the build succeeds; the patch was reverted afterwards.
- acceptance: the full `npm run acceptance` run had 9 failed and 359 passed. After the openapi example fix, the 2 example tests pass, which leaves 7 failures, all listed in items 5-7. All processes I started are stopped.

## ENG 1TC numbers changed (default inputs)
- Every step start and complete time is unchanged.
- Farm builds (completions 257.41, 271.82, 284.75, 382.28, 390.24, 447.94): the builders now join the farm at completion instead of completion plus a 5 s walk.
- Step 23 startedAt changed from 508.3666666666666 to 508.3666666666667 (one ulp).
- Floating food at 1200 s changed from 378 to 400.
- The extended research timeline (900 s): food changed from 596.2798 to 618.3789. Wood, gold and stone are unchanged.
- The builds test passes.

## Invariants
- A1: `createdBy` is in rules/base.json. No amounts appear in code; defaults come from `gatherNodes.<node>.amount?.value`.
- A2: drawdown clamps at 0 and credit is limited to the remaining stock. Payment checks are untouched.
- A3: run-outs are pure. A determinism test covers this.
- S3: `nodeAmount` is bounded at 0..100000 (integer) in validate.ts, with a test.

## Out-of-scope findings
- No code emits `step-stuck` yet (SGS-042). The docs say so.
- Processes left by another agent (`next dev -p 3991` from the sgs-043 worktree, using this scratchpad path) are still running. They are not mine, and I left them alone.
