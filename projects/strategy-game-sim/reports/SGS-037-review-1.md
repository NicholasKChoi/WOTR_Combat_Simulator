# SGS-037 review 1

- Branch: sgs-037-aoe4-node-refs-warnings-depletion-module, tip 279bcf9c8d849229d8f4be03e0fe018a539a7da6 (7db2324, 279bcf9 on origin/main 2049e95). The branch is local only; origin has no ref for it, so the review worktree was detached at the SHA.
- Mode: full review (first pass), diff `2049e95...279bcf9`, 12 files.
- **Verdict: APPROVE**

## Blocking findings

None.

## Spec gaps

None.

## Gates run (Node v24.22.2, fresh `npm ci` in the review worktree)

- `npx tsc --noEmit` (TypeScript 7.0.2): exit 0. I confirmed it type-checks: changing `const last: DepositRef = 'gold#8'` to `'gold#9'` in model.test.ts makes it fail with TS2820.
- `npm run lint:dup`: found 0 clones, exit 0.
- `npm test`: 31 files, 734 passed.
- `npx next build`: exit 0.
- `npm run acceptance`: 362 passed. This loads `/apps/aoe4-build-order` and drives the simulate route through Playwright's own `next dev`. Afterwards nothing was listening on 3100-3999.
- `git grep -nE "1e-|EPSILON" lib/aoe4-build-order/depletion.ts`: no hits. The file imports `RESOURCE_TOLERANCE` from `engine-common.ts`.

## Mutations I re-ran myself (on depletion.test.ts, each one restored)

| mutant | result |
|---|---|
| clamp removed (`Math.min(wanted, entry.remaining)` -> `wanted`) | killed: "never takes a ref below 0 and returns only what was there" |
| severity `idle > 0` -> `idle >= 0` | killed: "words run-outs by id and sets warning severity only when villagers are left idle" |
| `FINITE_NODE_REFS.indexOf` -> `FINITE_GATHER_NODES.indexOf` in `tieRank` | killed: "orders by at, then node warnings by ref and code, then step-stuck by step" |
| snap removed (`left <= RESOURCE_TOLERANCE ? 0 : left` -> `left`) | killed: "snaps a remainder within RESOURCE_TOLERANCE to exactly 0" |
| idle-arrival `at` overwritten by each later call | killed: "keeps the first arrival time and adds up every count" |

The equivalent-mutant note holds. `NODE_REFS` differs from `FINITE_NODE_REFS` only by `farm` and `wood`. The finite refs keep the same relative order in both lists, and a warning `node` is typed `FiniteNodeRef`, so `NODE_REFS.indexOf` cannot change any comparison. Re-spec 2 records this in the ticket and moved the required mutation to `FINITE_GATHER_NODES`.

## Acceptance criteria

All 19 pass and are ticked in the ticket.

1. List constants: model.test.ts pins `FINITE_GATHER_NODES`, `NODE_REFS` (15) and `FINITE_NODE_REFS` (13) with the deposits right after `gold`, and `SEVERITIES`. The `@ts-expect-error` lines for `gold#1` and `gold#9` are checked by tsc. Pass.
2. `nodeKindOf`: model.ts `ref.split('#', 1)[0]`, and the test covers every `NODE_REFS` entry. Pass.
3. `runRefs`: the six-node case and the eight-ref case use one `as unknown as BuildOrder` cast, and the output follows `FINITE_NODE_REFS` order. An extra test covers each step field plus `start.rally`, and shows `gold#9` is filtered out. Pass.
4. `berry = 0` is depleted at once. It has no warning until `recordRunOut`, and after it `depletedAt: 0` with one `node-depleted` at 0. Pass.
5. `recordRunOut`: first record wins; a ref not in the stock or still stocked is ignored. `recordIdleArrival`: calls (310, 2) and (400, 1) give `at` 310 with 3 villagers; a count of 0, a stocked ref and a missing ref are ignored. Pass.
6. `drawDown` clamp: returns 20, not 50, and leaves `remaining` 0 and depleted. The tolerance snap is tested on both sides. Pass.
7. `drawDown` skips `null` and depleted refs, and draws `gold` and `gold#2` independently. Pass.
8. `nextRunOut` returns the earliest exact time and ignores 0 gatherers, 0 rate, `null` and depleted refs. It returns `null` when no ref qualifies. Pass.
9. `depletionResults` lists refs in `FINITE_NODE_REFS` order (input order `stone, gold#2, sheep, gold`), with `null` amounts and `depletedAt: null`. Pass.
10. Severity is `warning`/`info` by idle count and never `error`. All three design messages match exactly. Pass.
11. `sortWarnings`: a full tie-order fixture with all three codes; it returns a new array, leaves its input alone and is idempotent. Pass.
12. `simulateBuildOrder` returns empty `depletions`/`warnings` for the prebuilt build and for a one-step order. Both full suites pass, and only the listed pre-existing tests changed. Pass.
13. OpenAPI: the 8 schemas exist; `DepositRef` lists `gold#2` to `gold#8`; the `oneOf` `$ref` unions match `NODE_REFS`/`FINITE_NODE_REFS` in the union test; the enums are compared with the TS consts; `required` includes both new fields; the live response equals the example. Pass.
14. data.acceptance export-list test: renamed, 27 sorted types, and the runtime list in source order. Pass.
15. edges spec key list gains `depletions` and `warnings`, and nothing else in it changed. Pass.
16. docs Outputs: both bullets describe the shape, the severity scale and the sort tie rules, and say both lists are empty today. Pass.
17. Mutations: re-run above. Pass.
18. No tolerance literal in depletion.ts; `RESOURCE_TOLERANCE` is imported; tsc and lint:dup are clean. Pass.
19. No invariant regressions (see below). Pass.

## Pre-existing test edits

All four are within the ticket's "Tests that must change" list.

- `data.acceptance.test.ts` export-list test: re-spec 2 names this edit. The diff matches the ticket's lists exactly, and the `effects-unmodeled`/`walkSeconds` assertions are unchanged.
- `aoe4-simulate-api-edges.spec.ts`: re-spec 2 names this edit. Only the key list changed.
- `result-series.test.ts`: only the literal gains the two fields.
- `aoe4-simulate-api-contract.spec.ts`: only additions are made.

## Invariants touched

- A1 holds. No node amounts or rates are in code. depletion.ts's only literals are 0 and 1. simulate.ts adds no literal, and the existing `literalsOf` source-shape test still passes.
- A2 holds. `remaining` is clamped by `Math.min` and snapped to 0 within `RESOURCE_TOLERANCE`. `drawDown` returns the clamped amount, and depleted or `null` refs draw nothing.
- A3 holds. Every function is pure with no clock or randomness. Iteration uses Map insertion order (guaranteed) and `FINITE_NODE_REFS` order. `Array.prototype.sort` is stable and the comparator is total. `sortWarnings` copies its input before sorting.
- S1 holds. There are no cross-app imports. The new import chain simulate -> depletion -> engine-common is a runtime cycle only through engine-common's `import type` from simulate, which is erased.
- S3 holds. `MAX_DEPOSITS` bounds the deposit refs, so `runRefs` returns at most 13 refs and `depletions` has at most 13 entries.

## Contract checks

- Names match design/M3.md exactly: `NodeRef`, `FiniteNodeRef`, `DepositRef`, `SimWarning` (three variants and their fields), `NodeDepletion`, `StepWait`, `Severity`/`SEVERITIES`, and the signatures of `recordRunOut`, `recordIdleArrival`, `sortWarnings` and the rest of the depletion API.
- `nodeRefIssue` (`${reason} in ${path}`) is out of scope for this ticket. It belongs to D/E, and this diff has no validate.ts change, so there was nothing to check.
- OpenAPI step-stuck `at` is described as "the step was armed", which matches design Behavior rules (`at` = `armedAt`). `NodeRef` is not referenced yet, which the ticket allows; the contract spec has no every-schema-referenced check.
- docs/aoe4-build-order.md lines 25 ("Resources are infinite"), 325 (Out: resource depletion) and the Extension points row (now line 641) are unchanged and still true. The new bullets do not contradict the code. The openapi descriptions also match the code: "Empty today", severity rules, and the sort order.
- REPO.md copied-helper rule: nothing is copied. depletion.ts imports `RESOURCE_TOLERANCE`, `formatMinSec`, `FINITE_GATHER_NODES` and `FINITE_NODE_REFS`. The `villagers()` pluralizer has no existing equivalent in `lib/` or `components/`.
- Scope: nothing from Out of scope was implemented (no `nodeAmounts`, `validate.ts`, `BuildStep` widening, `Trigger` kinds or page changes). No `golang/` changes, and no open question was answered with a constant.
- Artifact hygiene: no ticket ids, invariant ids or factory pointers in code or commits. Commits are authored by `choinickolas@gmail.com`.

## Conventions

- depletion.ts and model.ts use 2-space indent with semicolons, like model.ts and engine-common.ts.
- The new tests use 4-space indent with no semicolons and `describe`/`it`, like simulate.test.ts. depletion.test.ts imports `buildOrder` from `test-helpers.ts` instead of redefining it.
- OpenAPI `oneOf` with sibling `description` on each `$ref` branch is valid in 3.1. The `code` const tags follow the existing `Trigger` schema (openapi.json ~1243), and so does the "Warning code: x." description wording ("Trigger kind: time.").

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are not configured, so there are no bot findings.

## Non-blocking notes

1. `lib/aoe4-build-order/depletion.ts` drawDown: when the snap fires, the stock loses `taken + left` (`left <= 1e-9`) but `drawn` reports only `taken`. The difference is at most 1e-9 resources per run-out, so it does not matter. D could credit the full pre-draw `remaining` on a snap if it wants exact conservation.
2. `depletion.ts:25` `STEP_NODE_FIELDS = ['rally', 'to', 'from', 'then']` is read on every step kind. It is a hand-written list, not a copy, and the `FINITE_NODE_REFS` filter makes extra fields harmless. validate.ts:66 already has the authoritative per-action `'node'` field table, so if D/E add a node field (for example a `depleted` trigger's `node`), keep the two in step.
3. Singular wording (`1 villager is idle there.`, `1 villager ... is idle.`) goes beyond the design's plural-only examples. It is reasonable, tested, and contradicts no doc.
4. `DepositRef` is a literal union, not derived from `MAX_DEPOSITS` (TS cannot do that from a runtime number). Drift is caught by model.test.ts (exact `NODE_REFS`) and the contract union test, as design Extension points expects.
5. The ticket's openapi criterion carries a stray "(respec 9)" tag. It only affects how the ticket reads.

## Coverage

- Reviewed in full:
  - lib/aoe4-build-order/depletion.ts, model.ts diff, simulate.ts diff
  - depletion.test.ts, model.test.ts, simulate.test.ts diff, data.acceptance.test.ts diff
  - components/apps/aoe4-build-order/result-series.test.ts diff
  - acceptance/aoe4-simulate-api-contract.spec.ts diff, aoe4-simulate-api-edges.spec.ts diff
  - docs/api/openapi.json diff, docs/aoe4-build-order.md diff
- Compared against siblings: engine-common.ts, model.ts, validate.ts:66, and openapi `Trigger`.
- REPO.md Review checklist: I did "Every diff" (next build; the page was loaded through the Playwright acceptance suite, not by hand) and "AoE4 build order" (copied-helper rule, doc-contradiction rule). The chart-width check does not apply because there are no chart changes.
- Not reviewed: nothing.
