# SGS-038 review 1

- Branch: `sgs-038-aoe4-depletion-engine` (local only, not on origin), tip `4749c131b56acd7dc74aac7a90b3d7aef15ba916`
- Base: origin/main `77fa279` (merge-base)
- Mode: full review (first gate pass)
- Verdict: **APPROVE**

## Blocking findings

None.

## Spec gaps

None.

## Gates (run by the reviewer, Node 24)

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npm run lint:dup` | 0 clones |
| `npm test` | 33 files, 828 tests passed |
| `npm run acceptance` | 380 passed, exit 0 |
| `npx next build` | exit 0 |
| `git grep -nE "gatherers\[[^]]+\] *(\+=|-=)" lib/aoe4-build-order/simulate.ts` | 2 lines: the arrival add in `assignGatherers` and the take in `sendWalking` |
| `git grep -n "never runs out" docs/aoe4-build-order.md` | 0 lines |
| Page at 1280px (`next dev`, Playwright Chromium) | default ENG 1TC run: 200, no console or page errors, no horizontal overflow (scrollWidth 1280); charts render |

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 110 | berry 600 exact run-out, idle afterward | pass | `simulate-depletion.test.ts:58,65`; live API: `nodeAmounts {berry:600}`, 3 berry: `depletedAt 364.455...` (not a sample), warning with 3 idle |
| 111 | stock never below 0, credited total = 600 | pass | `drawDown` clamps; test at :65 |
| 112 | tolerance counts as depleted; berry 0 at t=0 | pass | `collectRunOuts` uses `isDepleted` (RESOURCE_TOLERANCE from engine-common); test :88 |
| 113 | infinite stays infinite; only listed test edits; PR body lists them | partly unverifiable, left unticked | six null rows (test :105, simulate.test.ts, the openapi example); all 7 pre-existing test edits match the ticket's list exactly, and validate.test.ts changes only `nodeAmounts: expect.any(Object)` in the existing test. No PR exists yet, so the PR-body clause cannot be checked. |
| 114 | per-deposit defaults, independent draw-down | pass | tests :115, :127, :138; the `resolveSimInputs` default for `gold#k` reads `gatherNodes.gold.amount?.value ?? null` |
| 115 | recordRunOut and recordIdleArrival only; idle count read at end of instant | pass | no warning is built in simulate.ts; `recordRunOuts` runs after the due-events check; test :151 |
| 116 | idle-arrival aggregation | pass | test :163 |
| 117 | every detection path, once per ref | pass | `collectRunOuts` at the start of `runInstant` skips refs already recorded; tests :75, :88 |
| 118 | arrival at the run-out instant counts in both warnings | pass | test :172 |
| 119 | spawn, build-then and auto-house arrivals go idle; grep gives at most 2 lines | pass | tests :180, :191, :196; grep gives 2 lines |
| 120 | move/build take idle; never both above 0 | pass | `sendWalking` takes gatherers then idle; tests :217, :235 |
| 121 | move all | pass | tests :242, :254, :260; live API: `move all gold -> gold#2` at 120 s moved all 10 (idle) villagers, and gold#2 later ran out with 10 idle |
| 122 | auto-house builders from gatherers only; farm fallback; sheep/farm tie | pass | `engine.houseSources` = NODE_REFS minus unnamed deposits; first-wins `reduce` with `>`; tests :284, :290, :296 |
| 123 | createdBy no-walk-back; ENG 1TC shift; PR body lists numbers | partly unverifiable, left unticked | tests :319, :323; timelines pin 596.2798390913501 -> 618.3789316586852. Branch vs main probe: only farm-walk windows changed (food gatherRates at 6 samples; 1200 s food 378.086 -> 400.185). No PR body exists yet. |
| 124 | run-out is a wake; A3 | pass | `nextWake` adds `nextRunOut`; tests :58, :84 |
| 125 | warning order; no second sort | pass | the only sort is in depletion.ts |
| 126 | nodeRefIssue table and every position | pass | validate.test.ts `node refs` block: table times 8 positions; the M2 message is kept |
| 127 | nodeAmounts table, 13 keys, paths | pass | validate.test.ts `resolveSimInputs nodeAmounts` |
| 128 | move count all | pass | validate.test.ts `move count all` |
| 129 | houseBuilderSource/trips gold#2 unknown-id | pass | validate.test.ts final test |
| 130 | openapi carries the changes; contract spec passes **with a request using gold#2, move all and nodeAmounts** | partly unverifiable, left unticked | the schema changes are correct and the bounds and documented-200 tests pass. **No test in `acceptance/aoe4-simulate-api-contract.spec.ts` sends such a request** (grep finds no `gold#2` request, no `'all'` count, no `nodeAmounts` body). I checked it ad hoc: a request with `start {gold:6}`, `move all gold -> gold#2` and `nodeAmounts {gold:300, gold#2:2500}` validates as `SimulateRequest`; the live 200 response validates as `SimulationResult` (ajv, the same config as the spec). Acceptance-test owns adding that request. |
| 131 | doc wording; grep 0 | pass | see gates |
| 132 | all gates; no redefined helper or tolerance | pass | see gates; RESOURCE_TOLERANCE is imported, there are 0 dup clones, and no new tolerance literal |
| 133 | no invariant regressions | pass | see below |

## Invariants touched

- **A1** (no literals for data values): holds. The only new constant is the input bound `nodeAmount: bound(0, 100000)`, which the ticket specifies. `base.json` gets only `farm.createdBy: "farm"`. Amount defaults read `gatherNodes.<node>.amount?.value`.
- **A2** (resources never negative; payment rules): holds. `drawDown` clamps the stock at 0, and the payment code is unchanged.
- **A3** (determinism): holds. All iteration is over fixed arrays (`FINITE_NODE_REFS`, `NODE_REFS`), and the test at :84 runs the same inputs twice and gets equal results.
- **S3**: holds. The API shape changes are mirrored in openapi.json, and the contract spec passes.

## Bot reconciliation

No review bot is configured (`reviewBot.cli` is empty in REPO.md), so there is nothing to reconcile.

## Conventions

- `validate.ts` issue messages keep the M2 form `${reason} in ${path}` (compared against `validate.ts:271` on main).
- `assignGatherers` and `sendWalking` follow the helper placement used by the existing state mutators in `simulate.ts`.
- The new tests use the `test-helpers.ts` fixtures and the same `describe`/`it.each` table style as `validate.test.ts` and `simulate.test.ts`.
- No departures a maintainer would flag.

## Non-blocking notes

1. `docs/aoe4-build-order.md` (around lines 64-66 and 548): the "inputs defaults at any depth" sentence lists `trips` and `influenceCoverage` per-key merges but not `nodeAmounts`. It is incomplete, not contradicted; the openapi `SimInputOverrides` description does mention the per-key merge. SGS-054 (docs audit) could pick this up.
2. The walk text "The villager is idle and gathers nothing while walking" now overloads "idle", which also means the `idle` state at a depleted ref. Consider "walking" wording.
3. Test name nit: implementer report 1 calls the test "take idle villagers first", but its name is "takes idle villagers once the ref ran out". The assertions match the name, so this is fine.
4. The ENG 1TC research extension shows ulp-only shifts on steps 23 and 24 (`startedAt` 508.3666666666666 -> ...667, and `waitSeconds` on both). They fall within the spec's `toBeCloseTo(..., 6)`. The PR body should mention them alongside the food pin.
5. The paste grammar rejects `move all` and `gold#2` (`expected a villager count, got 'all'`). This is expected: the ticket puts it out of scope (SGS-040). JSON input works.

## Coverage

- Reviewed: the full diff of all 15 files: `simulate.ts`, `validate.ts`, `model.ts`, `api.ts`, `data.ts`, `rules/base.json`, `docs/aoe4-build-order.md`, `docs/api/openapi.json`, `simulate-depletion.test.ts` (new), `validate.test.ts`, `simulate.test.ts`, `validate.acceptance.test.ts`, and the three acceptance specs (contract, depletion, timelines). `research.ts` and `houses.ts` are confirmed unchanged.
- ENG 1TC behavior was compared branch against main with a scratch vitest probe (since deleted) for the default and research-extension runs.
- REPO.md review checklist applied:
  - Every diff: build passed, and the touched page was loaded with `npm run dev` at 1280px.
  - AoE4 section: no copied helper or tolerance, no doc sentence the code contradicts. No chart component changed; the 1280px check was done anyway.
- No REVIEW.md exists, and both LESSONS.md files are empty.
- Not reviewed: no PR body exists yet, so the PR-body clauses of criteria 113 and 123 are unverified.
