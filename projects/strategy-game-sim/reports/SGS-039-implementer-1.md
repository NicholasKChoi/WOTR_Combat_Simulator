# SGS-039 implementer report (pass 1)

- Ticket: SGS-039 (add depleted and bank triggers and reaction steps, and turn depletion on by default)
- Branch: `sgs-039-aoe4-triggers-reactions-default-amounts`, tip `c1d71a5`, base origin/main 2665e94
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-039-aoe4-triggers-reactions-default-amounts

## Files

- `lib/aoe4-build-order/model.ts`: Trigger union with `depleted` and `bank`, and `reaction?: true` on every BuildStep.
- `lib/aoe4-build-order/simulate.ts`:
  - `triggerHolds` gains the depleted and bank cases.
  - New exported `triggerWakeAt`, which gives the bank wake at its exact instant.
  - `isReaction` and `reactionNeeds`, a wake-only list kept separate from `engine.reserve`.
  - `offerSteps`: reactions are offered first, then the cursor step (the first unstarted non-reaction step).
  - `nextWake` reads the reaction affordability.
  - `accrueWait` is still the one call site, and covers the cursor plus armed reactions.
  - At the horizon, an unarmed reaction is `not-reached` with `waitingOn: 'trigger'`.
- `lib/aoe4-build-order/validate.ts`:
  - New bound `triggerAtLeast` (0..100000).
  - Trigger shape and kind tables; the unknown-kind message names all four kinds.
  - Reaction `syntax` check and reaction `invalid` rule.
- `lib/aoe4-build-order/depletion.ts`: `runRefs` includes the node a depleted trigger names.
- `data/aoe4-build-order/rules/base.json`: six `amount` HandValues with the ticket's sources, all `unverified: true`.
- `lib/aoe4-build-order/test-helpers.ts`: `INFINITE_NODES`.
- `lib/aoe4-build-order/simulate-triggers.test.ts` (new): 23 tests covering triggers, reaction order and competition, status, node-depleted interplay, determinism and default amounts.
- `lib/aoe4-build-order/validate.test.ts`: new 'triggers and reactions' describe, plus the default-amount tests the ticket names.
- `lib/aoe4-build-order/simulate.test.ts`:
  - The horizon `waitingOn` and `step-stuck` tests are edited in place to add the reaction cases.
  - Export count 14 -> 15.
  - INFINITE_NODES pins.
- `lib/aoe4-build-order/simulate-depletion.test.ts`: the default-amount test is renamed and asserts the six amounts.
- `lib/aoe4-build-order/builds.test.ts`: the new prebuilt bar. Parts 1-3 are checked at 1200 s and 3600 s, parts 4-5 at 1200 s.
- `lib/aoe4-build-order/data.test.ts`:
  - Hand-value counts raised (44->50, 71->77).
  - New 'node amounts' describe: amounts exist on exactly FINITE_GATHER_NODES, with value, source and unverified for each.
- `lib/aoe4-build-order/data.acceptance.test.ts`: count raised 71->77.
- `lib/aoe4-build-order/build-move.acceptance.test.ts`, `research.acceptance.test.ts`, `research.test.ts`: INFINITE_NODES pins.
- `acceptance/helpers.ts`: exports `INFINITE_NODES`, shared by four specs.
- `acceptance/aoe4-simulate-api-contract.spec.ts`:
  - New `triggerAtLeast` location.
  - Trigger description regex updated.
  - Two new tests: depleted, bank and reaction requests are valid and get 200; a time reaction gets 400 `invalid`.
- `acceptance/aoe4-simulate-api-depletion.spec.ts`, `acceptance/aoe4-simulate-api-timelines.spec.ts`: INFINITE_NODES pins, as the ticket lists.
- `acceptance/aoe4-simulate-api-depletion-engine.spec.ts`, `acceptance/aoe4-simulate-api-spend-population.spec.ts`: INFINITE_NODES pins. The ticket did not list these; see below.
- `docs/api/openapi.json`:
  - Trigger oneOf has 4 variants, and `reaction` is on all 6 BuildStep variants.
  - `ResourceKind` is referenced.
  - Descriptions updated for nodeAmounts, armedAt, BuildOrder and issue codes.
  - The 200 example's depletions carry the default amounts.
- `docs/aoe4-build-order.md`: every section the ticket names, plus the sweep.
- `data/aoe4-build-order/README.md`: the Prebuilt builds bar and the finite sheep node.

## Tests

- `npx vitest run`: 37 files, 934 passed, 0 failed.
- `simulate-triggers.test.ts`: 23 tests. `builds.test.ts`: 9 tests.
- `npm run acceptance`: 453 passed, 0 failed.
- Invariants encoded:
  - The six amounts exist only in base.json and carry a source.
  - A reaction never reserves (producer payment series unchanged before the reaction starts) and still pays only when affordable (bank is about 0 after paying).
  - The bank trigger never changes the bank.
  - The bank wake and run-out starts happen at exact event times, not samples.
  - `triggerAtLeast` is enforced.
  - Same input, same result.

## Pre-existing tests edited

All edits follow the ticket's "Tests that rely on infinite nodes" section. The named default-amount tests were rewritten as specified; every other affected test keeps its expected values and pins the six nodes to `null`.

**Default-amount rewrites**
- `simulate-depletion.test.ts`: "keeps every ref infinite without nodeAmounts" is renamed and asserts the six amounts.
- `validate.test.ts`: "returns every finite ref, null when no amount ships" is renamed and expects base.json amounts.
- `validate.test.ts`: "defaults every deposit to the gold amount and merges overrides per key" uses the default game and the ticket's expected object.
- The fourth default-amount test, as listed by the ticket.

**INFINITE_NODES pins (all listed in the ticket)**
- `build-move.acceptance.test.ts`: "auto-houses on a plain default order".
- `research.acceptance.test.ts`: "a technology applies from its completion" (`run` and `inputsFor` gained a partial-inputs parameter).
- `research.test.ts`: "paces auto-houses by the build time of the upgraded tier".
- `simulate.test.ts`: "runs an hour with twenty steps", "are empty while every node is infinite", "has no step-stuck when every step started".
- `acceptance/aoe4-simulate-api-depletion.spec.ts`: all 4 requests.
- `acceptance/aoe4-simulate-api-timelines.spec.ts`: all 4 "pinned timelines" tests.

**Edited per a specific Scope clause**
- `simulate.test.ts`: SGS-042's horizon `waitingOn` and step-stuck tests are edited in place (Scope, horizon pass). The module export count changed 14 -> 15 because of the new `triggerWakeAt`.
- `data.test.ts` and `data.acceptance.test.ts`: only the `>=` counts rose (Scope, base.json).
- `builds.test.ts`: "completes or is still running every step at 3600 s" is replaced by the bar (Scope).
- `acceptance/aoe4-simulate-api-contract.spec.ts`: new location and regex (Scope, OpenAPI).

**Pinned under the "every other test" rule but not listed in the ticket.** These moved at default amounts, failed in the acceptance run, and keep their expected values with INFINITE_NODES pinned:
- `acceptance/aoe4-simulate-api-depletion-engine.spec.ts`: "the prebuilt English build against the pre-depletion engine > differs only by the farm builders joining at completion..." and "> leaves orders without a farm build exactly as before". Their `noDepletion` helper asserts every amount is null.
- `acceptance/aoe4-simulate-api-spend-population.spec.ts`: "spent on the prebuilt English build > ends at the snapshot costs of the research and buildings it started..." and "> counts an auto-house under buildings when the order has no house step". The second ran sheep dry: 1150 villager spend instead of 2000.

Because four acceptance specs now share `INFINITE_NODES`, it lives in `acceptance/helpers.ts` so `lint:dup` stays at 0.

## Mutation checks

Every mutation below was killed, and each was undone afterwards with the tree verified clean.

| Mutation | Tests failed |
|---|---|
| M1 `triggerHolds` depleted -> false | 9 (includes the depleted trigger test) |
| M2 bank tolerance dropped or `>` | 3 |
| M3 bank wake null | 2 |
| M4 bank wake while it already holds | 1 |
| M5 time wake null | 1 |
| M6 reactions never offered | 8 |
| M7 cursor does not skip reactions | 4 |
| M8 reactions offered after the cursor | 1 (compete) |
| M9 reaction sets `engine.reserve` | 1 (producer test) |
| M10 `reactionNeeds` not woken | 2 |
| M11 accrual covers the cursor only | 3 |
| M12 horizon gives a reaction `earlier-step` | 3 |
| M13 `runRefs` ignores the depleted node | 2 |
| M14 a reaction re-fires | 5 |
| V1 reaction rule off | 1 |
| V2 reaction syntax off | 1 |
| V3 bank resource unchecked | 1 |
| V4 atLeast shape | 2 |
| V5 depleted node unchecked | 6 |
| V6 bound widened | 1 |
| V7 unknown-kind message | 1 |
| D1 base.json gold 4000 -> 400 | 4 |

Not individually mutation-checked:
- The determinism test.
- validate "rally reaction counts as rally source" and "research reaction counts as earlier research": these exercise existing list-order logic, so there is no new code to break.
- The bank earlier-step test.

## Codegen, build, lint

- No codegen.
- `npx tsc --noEmit`: clean.
- `npm run lint:dup`: 0 clones.
- `npx next build`: OK.
- No servers left running.
- `english-1tc.json` is not in the diff.

## Verification greps

| Grep | Result |
|---|---|
| `trigger?.kind === 'time'` in simulate.ts | 0 |
| `trigger.kind !== 'time' && trigger.kind !== 'villagers'` in validate.ts | 0 |
| Amount numbers in lib, excluding tests | 0 |
| waitBreakdown accrual regex | 1 site (simulate.ts:820) |
| jq amount count | 6 |
| Doc greps | 0 |
| `else infinite` / `Shipped node amounts` | 0 |
| README `never depleted` / `keep running by 3600 s` | 0 |
| openapi Trigger oneOf | 4 |
| openapi reaction variants | 6 |
| ResourceKind refs | 1 |
| "infinite when absent" | 0 |

## Invariants

- A1 upheld: the amounts exist only in base.json, each with a source.
- A2 upheld: a reaction never reserves, uses the wake-only `reactionNeeds`, and pays only when affordable. The bank trigger only reads the bank.
- A3 upheld: wakes are arithmetic on event times, with no clock.
- S3 upheld: `triggerAtLeast` is enforced in validate.ts.

## Notes for the manager

- **Compete test:** it starts with 50 wood (one house) instead of the ticket's "last 100 wood". The reaction house wins and the cursor build waits on resources, which is the same property.
- **ENG 1TC measured at default inputs:**
  - The last non-reaction step starts at 508.37 s.
  - Sheep runs out at 782.85 s (warning, 6 idle).
  - Gold deposit 1 runs out at 3305.17 s (warning, 2 idle).
  - Berry, deer, boar and stone stay null.
  - At 1200 s only sheep has run out.
  - All 24 startedAt values are unchanged.
- **Sweep changes beyond the sentences Scope names:**
  - openapi BuildOrder description (non-reaction and reaction wording).
  - openapi depleted `node` description.
  - Doc "Ordering and triggers": the "At one instant, steps start in list order" sentence now says reactions go first.
  - Doc Results `waitingOn` bullet (reaction and earlier-step wording).
  - Doc "all nine rules" -> "all ten rules".
  - Doc extension row: "Event or resource triggers" -> "More triggers".

## Out-of-scope findings

None.

## Status

needs_review
