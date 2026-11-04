# SGS-094: Correct the AoE4 deer pack starting stock to 2450 food

- **Type**: Bug
- **Component**: aoe4-build-order
- **Milestone / criteria**: none (BACKLOG.md bullet "Deer starting stock is wrong"; owner correction 2026-11-04)
- **Priority**: medium
- **Risk**: standard
  <!-- Not high: no criticalPaths symbol or signature changes, and no bound enforcing S3, H1 or A2 changes; the engine reads the amount from data unchanged. Not low: the default stock changes what any run that gathers deer computes, and the /api/simulate documented response examples change (public surface). Under 100 lines of business logic (one data value). -->
- **Invariants**: none adjacent (data value read by the depletion logic; no engine code changes)
- **LOC estimate**: 0 business-logic lines (one value and its source label in `data/aoe4-build-order/rules/base.json`; about 10 lines of test, doc and example edits)
- **Depends on**: none
- **On merge**: none
- **Source**: BACKLOG.md "Deer starting stock is wrong" (reported by the owner in chat; correction 2026-11-04: a deer pack has 2450 food, not 1750)

## Context

`gatherNodes.deer.amount` in `data/aoe4-build-order/rules/base.json` is 1750 (labelled "7 deer x 250 food", owner 2026-11-01). The owner corrected it on 2026-11-04: a deer pack holds 2450 food. The shipped default must change, and every test, doc and example that pins the old value with it.

## Scope

Paths are relative to the repo root; branch `sgs-094-aoe4-deer-pack-2450`.

1. **Data.** In `data/aoe4-build-order/rules/base.json`, `gatherNodes.deer.amount.value` becomes 2450. Its `source` no longer says "7 deer x 250 food" (that arithmetic is the wrong basis); it becomes `owner-supplied starting total (2026-11-04): deer pack, 2450 food`. `unverified` stays `true`. Rate, capacity and every other node are untouched.
2. **Tests that pin the old amount.** Every test that pins the deer default or its source text moves to 2450 and the new source text. Examples (grep `1750` and `deer x` under `lib/` and `acceptance/` for the rest): the `shipped` table and its `owner` constant in the `node amounts` describe of `lib/aoe4-build-order/data.test.ts`; the default `nodeAmounts` expectations in `lib/aoe4-build-order/schema.test.ts`, `lib/aoe4-build-order/simulate-depletion.test.ts` and `lib/aoe4-build-order/simulate-triggers.test.ts`; `DEFAULTS` in `acceptance/aoe4-simulate-api-triggers.spec.ts`. Where a test only restates the shipped default in a table, keep the table shape and change the value. A test that passes an explicit `nodeAmounts` override keeps its value.
3. **OpenAPI examples.** In `docs/api/openapi.json`, every example `depletions` entry for `"node": "deer"` with `"amount": 1750` becomes 2450 (the response examples of `/api/simulate`). Only the `amount` of deer entries changes; a `depletedAt` in those examples stays as is unless a changed run-out time makes it untrue (see item 5).
4. **Docs.** Grep `docs/`, `data/aoe4-build-order/README.md`, `ARCHITECTURE.md`, `README.md` and comments in `lib/aoe4-build-order/` and `app/` for the deer figure and the "7 deer x 250" wording (on main, only `base.json` and `data.test.ts` carry the wording; `docs/aoe4-build-order.md` describes amounts generically and needs no edit unless a grep finds a figure). Fix every hit so no doc or comment states 1750 for deer or the 7 x 250 derivation. `aoe4world/english.json` `"hitpoints": 1750` is an unrelated unit stat; do not touch it.
5. **Prebuilt build pins.** On main none of the three shipped builds in `data/aoe4-build-order/builds/` (`english-1tc.json`, `english-knight-longbow.json`, `english-spear-longbow-maa-crossbow.json`) references deer, so no run-out time should move. The implementer must still verify by running every unit and acceptance test that pins results of those builds (those in `lib/aoe4-build-order/` and `acceptance/` that reference the build ids, for example `aoe4-simulate-api-knight-longbow-build.spec.ts`, `aoe4-simulate-api-spear-longbow-build.spec.ts`, `aoe4-simulate-api-prebuilt-plans.spec.ts`, `aoe4-simulate-api-prebuilt-farms.spec.ts`, `aoe4-simulate-api-depletion-engine.spec.ts`) and checking each build's `depletions` entry for `deer`. Rule for a failing pin: re-pin it only when the build or test sends villagers to deer (or a `deer` reaction/trigger) so that the larger stock moves the value, and state that reason in the commit message and report; if a pinned value moves for any other reason, stop and report it as a finding instead of re-pinning. Report the deer `amount` and `depletedAt` for each of the three builds before and after.

**Out of scope:** the other nodes' amounts, deer rate or capacity, any engine code, `inputs.nodeAmounts` override behavior, adding deer gathering to the prebuilt builds.

## Diagrams

Single-component change outside the core control loop; no diagram required.

## Acceptance criteria

- [x] `data/aoe4-build-order/rules/base.json` `gatherNodes.deer.amount` is `{ value: 2450, source: "owner-supplied starting total (2026-11-04): deer pack, 2450 food", unverified: true }`; no other field of the file changes.
- [x] A default `/api/simulate` run (no `nodeAmounts` override) returns a `depletions` entry for `deer` with `amount` 2450, and the unit test over shipped node amounts (`data.test.ts`, `node amounts`) fails if the value or source text is reverted to the 1750 form.
- [x] A run with an explicit `nodeAmounts.deer` override still uses the override (existing override tests pass unchanged).
- [x] `git grep -n -E "deer: 1750|7 deer x 250"` over the repo finds no match; every `"node": "deer"` example in `docs/api/openapi.json` shows `"amount": 2450`.
- [x] No doc or code comment states the deer starting stock as 1750 or derives it from 7 deer x 250 food.
- [x] For each of the three shipped builds, the default-run `deer` depletion entry has `amount` 2450; any prebuilt-build pin that changed is justified in the report under item 5's rule, and a pin that moved for a reason other than the deer stock is reported, not re-pinned.
- [x] The implementer's report lists every test it edited and the before/after deer `amount` and `depletedAt` for each shipped build.
- [x] `npm test`, `npx tsc --noEmit` and `npm run acceptance` pass.
- [x] No INVARIANTS.md regressions

## Open questions

None.
