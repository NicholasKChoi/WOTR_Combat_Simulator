# SGS-042 review 1

Verdict: **REQUEST CHANGES** (one blocking doc/contract finding; code itself is correct)

Reviewed tip `e25e383970806b2587f55236dc2233c4a55b310d` (one commit on origin/main `1d5f5c9`), full diff
`origin/main...e25e383`. The branch is not on origin (`origin/sgs-042-aoe4-step-wait-step-stuck` does not exist);
the review worktree was created detached from the local SHA.

## Blocking findings

1. `docs/aoe4-build-order.md:637-638` - contract (ticket item 10, doc contradicted by code) - the stateDiagram
   edges `Waiting --> Started: affordable and supply allows (startedAt)` and `Armed --> Started: affordable and
   supply allows (startedAt)` were left as-is while the adjacent `Armed --> Waiting` label (line 636) was edited to
   "a check fails (prerequisite, villagers, population or resources)". The code starts a step only when all four
   checks pass: a `build` that is affordable with supply room still does not start while `availableAt(from) <
   builders` (`simulate.ts:378-380`), and a step above the age does not start either (`simulate.ts:288-290`,
   `375-377`, `research.ts:45-47`). The ticket explicitly asks to "Re-check the stateDiagram labels for accuracy",
   and the diagram now contradicts itself and the code. Direction: relabel both `--> Started` edges to the
   complement of the Waiting edge, e.g. `every check passes (startedAt)`.

## Spec gaps

None.

## Acceptance criteria

(Not ticked: verdict is not APPROVE.)

- [pass] `{ started: false }` grep: 0 non-test matches; every `reserve` return carries `waitingOn: 'resources'`
  (`simulate.ts:296`, `383`; `research.ts:54`).
- [pass] Stable fixture: new test `build-move.acceptance.test.ts` 'reports the wait as prerequisite until the
  age-up' asserts keys `['prerequisite']`, value ~119 (1e-9), `waitingOn: null`; startedAt 119 is pinned by the
  existing tests in that describe.
- [pass] resources / villagers (build and numeric move) / population / missing instance: `simulate.test.ts`
  'why steps wait' tests; resources sum equals `waitSeconds`.
- [pass] `move all` from berry with 0 villagers: completed at 0, `waitingOn: null`, `{}`. Code: `count === 'all'`
  makes `available < count` impossible (`simulate.ts:391-393`).
- [pass] research: above-age tiers and no producing instance give `prerequisite` (`research.test.ts`
  `waitsWithoutReserve` now asserts `['prerequisite','earlier-step']`; multi-tier test); short of resources gives
  `resources` with `reserve`.
- [pass] villagers-then-resources split: both keys > 0, sum equals `startedAt - armedAt`.
- [pass] sums over a multi-step run; `not-reached` `{}`; no zero keys (`seconds > 0` guard in `accrueWait`).
- [pass] horizon `waitingOn`: waiting keeps reason, cursor `not-reached` gets `trigger`, later ones
  `earlier-step`, started `null` (`simulate.ts:843-848`). Done as a new test rather than extending the existing
  'waits for a targeted instance...' test; equivalent.
- [pass] one `step-stuck`, 1-based message number, 0-based `step`, `at = armedAt`, severity `warning`. Unregistered
  handler: the new test asserts `waiting`/`prerequisite` but not the warning; I verified by probe that it emits
  `step 1 (rally) was still waiting on prerequisite at 20:00, from 0:00.` with breakdown `{prerequisite:1200}`.
  Every-step-started run has `[]`.
- [pass] merged node + step-stuck order (`['node-depleted','step-stuck']` at equal `at`); exactly one
  `sortWarnings(` call in `simulate.ts:850`.
- [pass, PR-body part unverifiable] existing tests pass; the two `toEqual` fixtures and item 12 edits are made.
  No PR exists yet, so "the PR body lists every existing test it edits" cannot be checked.
- [pass] `accrueWait` exported, skips `trigger`/`earlier-step`/`null`, own unit test charging two steps over one
  interval; `waitBreakdown[` written only at `simulate.ts:765`; one call site, cursor step only.
- [pass] OpenAPI `StepTiming.required` includes both; examples updated; contract spec passes.
- [pass] stale-empty grep: 0 matches; both `warnings` descriptions name `step-stuck`.
- [fail] docs: names `waitingOn`, `waitBreakdown`, `step-stuck`, states the check order, and the "A step waits"
  paragraph covers all four reasons, but item 10's "re-check the stateDiagram labels for accuracy" is not met
  (blocking finding 1).
- [pass] determinism: test compares warnings of two runs; my probe also compared full `steps` (equal).
- [pass] no invariant regressions (below).

## Invariants touched

- A1: holds. No new game numbers; `BREAKDOWN_REASONS` is the contract's reason list, not a game value.
- A2: holds. `produce` and `build` conditions were split, not changed: the disjunction of the new checks equals
  the old one, so start/no-start is identical. `engine.reserve = outcome.reserve` equals the old
  `'reserve' in outcome ? outcome.reserve : undefined` for the failure path; success path untouched (reserve is
  reset at the top of `offerSteps`). No payment code changed.
- A3: holds. `accrueWait` runs after `creditIncome` and before `engine.time = next`, reads `next - engine.time`
  only, and writes only `waitBreakdown`; `nextWake` and event order are unaffected, so wake times are unchanged.
  No timeline pin file in the diff. No clock or randomness.
- S3: n/a (no new inputs or loops over user-sized counts; warnings are at most one per step, already bounded by
  the order's step cap).

## Checks requested by the manager

- Check order per design table: prerequisite, then villagers (build) / population (produce), then resources. Matches.
- Only waiting steps at the horizon warn: `filter(status === 'waiting')`. Not-reached get none.
- Edited pre-existing tests: `simulate.test.ts` two `toEqual` fixtures and seam list (+`accrueWait`, 13 -> 14)
  are items 11/12; `aoe4-simulate-api-depletion.spec.ts` research request is item 12 (expected warning matches
  ticket: prerequisite, at 0); `research.test.ts` reserve `toEqual` and multi-tier `toEqual({started:false})`,
  `simulate-construction.test.ts` and `simulate.acceptance.test.ts` stubs are handler-return-type changes only;
  `waitsWithoutReserve` gained one assertion (adds coverage, weakens nothing). Contract spec key literal is item 9.
  All within scope.

## Gates (Node 24, review worktree)

- `npx tsc --noEmit`: pass
- `npm run lint:dup`: pass, 0 clones
- `npm test`: 36 files, 872 tests pass
- `npx next build`: pass
- `npm run acceptance`: 429 passed

## Bot reconciliation

`reviewBot.cli` is empty and `rulesFile` empty: no bot run.

## Non-blocking notes

- `docs/aoe4-build-order.md:664-665`: "A `trigger` or `earlier-step` reason is only reported for a step that never
  armed. A `produce` step completes when no ..." joins the wait-reason text onto the step-completion paragraph in
  one overlong line. A paragraph break after "never armed." would read better.
- `simulate.ts:759`: `accrueWait(engine: Pick<Engine, 'steps'>, ...)`; design says `EngineState`. `steps` lives on
  `EngineState` (`simulate.ts:87`), so `Pick<EngineState, 'steps'>` matches the design more closely; current form
  works structurally for SGS-039.
- `simulate.ts:771-781`: `stepStuckWarning` assigns `StepWait | null` / `number | null` to non-null `SimWarning`
  fields; compiles only because `tsconfig.json` has `strict: false`. Safe by construction (a `waiting` step is
  always armed and has a handler reason).
- `simulate.test.ts` 'reports prerequisite for an unregistered action' hand-rolls the save/delete/restore that
  `withHandler` does (`test-helpers.ts:72-84`), and does not assert the `step-stuck` warning the AC names. Adding
  `expect(result.warnings).toHaveLength(1)` would pin it.
- Determinism test compares `warnings` only, not `waitBreakdown`.
- `step-stuck` `from` uses rounded m:ss, so armedAt 1199.6 prints "from 20:00" (design-specified behavior).

## Coverage

Files reviewed: all 12 changed files (`model.ts`, `simulate.ts`, `research.ts`, `docs/aoe4-build-order.md`,
`docs/api/openapi.json`, both acceptance specs, five unit test files). Siblings compared: `offerSteps`,
`finalStatus`, `depletionResults`/`sortWarnings` in `depletion.ts`, `withHandler` in `test-helpers.ts`, existing
'produce waits' and 'handler seam' tests. REPO.md checklist: "Every diff" (next build run; no page file is
touched, the API response change is exercised by the acceptance run against `next dev`, I did not click through
the page by hand); "AoE4 build order" (no copied helper: `formatMinSec` and `sortWarnings` imported; doc check
-> finding 1). Probe tests were run in the review worktree and deleted.
