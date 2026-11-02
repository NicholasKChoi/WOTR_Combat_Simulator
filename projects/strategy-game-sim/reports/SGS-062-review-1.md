# SGS-062 review 1

- Verdict: **APPROVE**
- Branch `sgs-062-aoe4-veterancy-convert-units`, tip 998aa7d373d943bc5691626371d54218cb4b9a34 (local only, not on origin), base origin/main 54d7e90. Full review, not delta.
- Toolchain: Node 24.22.2.

## Blocking findings

None.

## Spec gaps

None blocking. The edge case below (non-blocking note 1) is one the spec half-acknowledged in its Open questions. The fix belongs to a later ticket that owns `resolveUnitEntry`.

## Acceptance criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Knight + longbow via POST: l2 12@845, 0 from 850; l3 13@850, 66@1800 | pass | `next start` on the branch build, POST the knight-longbow build with `durationSeconds: 1800`: `l2@845 12 l2@850 0 l2 later all 0 true l3@845 0 l3@850 13 l3@1800 66`. Series order: villager-1, longbowman-2, knight-3, longbowman-3. Also pinned in vitest at research.acceptance.test.ts:151-161. The Playwright API spec is not in this diff; the acceptance-test gate writes it. |
| 2 | Spearman paid before veteran, spawning after, counted only in spearman-3 | pass | research.test.ts:125-130 (`spearmen(timed)` = `['spearman-3']`, s3 0@95, 1@100) |
| 3 | Lower drops and upper rises by the same amount at one sample | pass | research.test.ts:168-174 (`[3,0,0]@45` -> `[0,3,0]@50`) |
| 4 | No entry at age, or no units yet: no series change; a later spawn uses the new tier | pass | research.test.ts:202-213 |
| 5 | Lower-after-higher unchanged; two at one instant end at the highest | pass | research.test.ts:231-257 |
| 6 | Order by first held instant then unitId; lower stays at 0; per-baseId sum = cumulative, equal to pre-change for no-veterancy builds | pass | research.test.ts:176-200 and 259-270. My before/after probe (below) shows per-baseId sums equal to origin/main on every build. |
| 7 | Every other SimulationResult field identical for knight + longbow | pass | research.acceptance.test.ts:163-172 (against a run with no longbowman-3 entry), plus my direct probe against origin/main (below) |
| 8 | grep for "keeps the lower tier\|tier is fixed when" returns 0 lines | pass | grep exit 1, no output |
| 9 | OpenAPI descriptions by current tier; no schema change; contract spec passes | pass | openapi.json:1712, 1904, 1937 change description text only; `npm run acceptance` 551 passed |
| 10 | tsc, lint:dup, npm test and acceptance pass; report lists edited tests | pass | tsc clean; jscpd 0 clones; vitest 1088 passed, 8 skipped; Playwright 551 passed; the implementer report lists each edited test with old and new values |
| 11 | No invariant regressions | pass | see below |

All 11 are ticked in the ticket.

## A3 timing and field identity (focus item)

I wrote a throwaway vitest probe, since deleted. It imported `simulateBuildOrder` from this branch and from an origin/main 54d7e90 worktree. Inputs:

- all 3 shipped builds;
- each build again with appended veterancy steps (veteran/elite spearmen plus 20 more spearmen, early/men/elite men-at-arms plus 10 MAA, veteran/elite longbowmen, elite crossbowmen);
- durations 600, 1800 and 3600 s.

For every run:

- every `SimulationResult` field except `unitsProduced` is deep-equal to main;
- the per-baseId sums of `unitsProduced` are deep-equal to main at every sample;
- no count is negative.

`unitsProduced` changed only where a veterancy upgrade completed with units on the field: knight + longbow at 1800 and 3600, and Spear/Longbow +vet at 1800 and 3600.

No silent inversion:

- `spawnUnit` still adds `entry.costs.popcap` from the paid entry.
- Pay-time `resolveUnitEntry` calls are untouched.
- `convertUnits` writes only to the ledger.

## Series ordering and membership vs design C5

- `firstHeldAt` (simulate.ts:854) reads the held count after the last change of an instant. A tier passed through within one instant is therefore never listed, which matches "counts[i] reads the state after every event".
- Ordering is by first held instant, then `entry.id`.
- A record with only a zero delta never qualifies, so a conversion with no units creates no series.
- A drained lower series is still listed, because its first-held instant exists.
- Changes are appended at `engine.time` in event order (simulate.ts:489-492, 912), so each record's `changes` is time-ordered, as the comment at simulate.ts:92 claims.
- Within one instant the order of spawn and completion does not matter: a spawn before completion is converted, and a spawn after it resolves to the upper tier.

## Edited existing tests (focus item)

Each change is what the reversed rule requires:

- research.test.ts 'pays the next spearman...': s3 changes 0->1 @85 and 1->2 @90, and s2 changes 1->0 @90, because of the conversion at 75.
- 'tier is fixed' describe, rewritten:
  - the TC was dropped from the fixture, so villager popcap cannot mask the popcap check, and `completedAt: 60` still holds;
  - 'gives the upgraded tier...' is now s3 2@170 (the s2 1@170 assertion was replaced);
  - 'reads the tier at spawn' replaces 'at payment';
  - a new test checks that cost and popcap are those of the tier paid.
- Auto-house pacing: s3@400 changes 65->66, with the total unchanged (66).
- research.acceptance.test.ts:80-92 and 101-127: the conversion values, and only spearman-3 is listed.
- simulate-construction.test.ts:241-251 has no veterancy and is untouched, correctly.

## Invariants touched

- A1 holds. Tiers come from `upgradeTargets` and `byBaseId`; the code has no tier literal.
- A2 holds. `spawnUnit` and `convertUnits` touch no resources, and `payUnit` is unchanged.
- A3 holds:
  - no clock and no randomness;
  - `Map` iteration is insertion-ordered in JS, and `convertUnits` only sums over it;
  - the existing determinism tests pass;
  - the probe shows identical non-series fields.

The S and W invariants are not touched.

## spec-checklist

- Contracts: names unchanged.
- Scope: no `golang/`, no `unitsByTier`, no UI change, `resolveUnitEntry` unchanged.
- Naming: OK.
- A1-A3: OK, see above.

## Lint

- `npx tsc --noEmit`: clean.
- `npm run lint:dup` (.jscpd.json: aoe4 lib, components and API, 8 lines / 70 tokens): 0 clones.

## Bot reconciliation

`reviewBot.cli` is empty and `rulesFile` is empty. No bot was run.

## REPO.md review checklist

- Every diff: `npx next build` succeeded. `next start` served `/apps/aoe4-build-order` with 200, and I exercised the API route with a real POST (criterion 1). The chart is unchanged by design; a drained lower series now draws a line falling to 0.
- AoE4 build order:
  - No helper is copied between modules.
  - Doc sentences were rechecked against the code: Tiers paragraph lines 212-220, scope bullet 357-358, `unitsProduced` bullet 665-669. See note 1 for the one pre-existing edge.
  - No chart change.

## Out-of-scope `finalCount` helpers (implementer's note, focus item)

`acceptance/aoe4-simulate-api-timelines.spec.ts:20` and `acceptance/aoe4-simulate-api-spend-population.spec.ts:46` read only the first series of a baseId. Every call site posts `english-1tc` or a no-veterancy order:

- timelines:44 uses english1tc;
- the veteran-spearmen test at timelines:47-71 never calls `finalCount`;
- spend-population:80-82 uses english1tc.

They are correct today and meet the ticket rule, which applies only to tests whose build researches veterancy. The risk is latent, not a defect: adding veterancy to those orders would make the pins fail loudly, not pass silently. The spend-population cost check at :80 would then compute the wrong expected value, and the failure would mislead. Recommend a BACKLOG item: switch both to sum over all series of the baseId, as `test-helpers.ts` `series()` now does. Not blocking.

Related latent assumption: `simulate.acceptance.test.ts:243` asserts each series never decreases, in a test named "keeps counts cumulative". Its random steps contain no research, so it holds. It would break if research steps were added to the generator. Same backlog item.

## Non-blocking notes

1. **Spawn tier when the highest researched upgrade has no entry at its age.** This is pre-existing, unreachable with shipped data, and the ticket put it out of scope.
   - Reproduced with synthetic data: drop spearman-4, research veteran-spearmen (converts to spearman-3), then elite-spearmen. A spearman paid after elite resolves to `entries[0]` = spearman-2 (research.ts:93-102) and spawns at spearman-2. The result is `[["spearman-2",2],["spearman-3",1]]`.
   - So the new comment at research.ts:86-87 ("the unit spawns at the highest researched tier") and doc lines 212 and 219 ("changes no tier") do not hold in that case.
   - main had the same contradiction in its "does not change the tier" sentence, and the ticket required keeping it.
   - All 11 shipped `upgradeTargets` have a unit entry at their age (checked against `loadGameData('english')`), so no shipped run reaches this.
   - Recommend a BACKLOG item: make `resolveUnitEntry` pick the highest researched tier that has an entry. That needs its own ticket, since `resolveUnitEntry` is out of scope here.
2. Convention: `recordUnits` (research.ts:62) is a generic ledger write used by both `simulate.ts:279` and `convertUnits`. Shared engine-state writers live in `engine-common.ts` (e.g. `payCost` at engine-common.ts:30, imported by both modules). A maintainer may expect it there. It works as is, with no runtime import cycle: research.ts imports simulate.ts types only.
3. The ledger record shape `{ time: number; delta: number }` is spelled inline twice (simulate.ts:94 and 854). A named type would keep them in sync. Cosmetic.
4. research.test.ts defines `spearmen` twice, in two adjacent describes (lines ~123 and ~163). The two "orders series" tests each rebuild a near-identical `startingWith(... 'barracks' x3 ...)` game and a `menAtArms` step instead of reusing the describe's `gameWith`. Minor test duplication, below the jscpd threshold.
5. The knight + longbow Playwright API spec named in Scope ("API acceptance") is absent from this diff. The implementer deferred it to the acceptance-test gate, which owns test authoring. The behavior is verified above by a real POST.

## Coverage

- Reviewed the full diff:
  - lib/aoe4-build-order/research.ts, simulate.ts, model.ts and test-helpers.ts;
  - research.test.ts and research.acceptance.test.ts;
  - docs/aoe4-build-order.md and docs/api/openapi.json.
- Also read:
  - every `unitsProduced` consumer in lib, components and acceptance;
  - `resolveUnitEntry`, `applyDueEvents`, `payUnit` and `spawnUnit` in context;
  - the engine-common.ts siblings.
- Ran:
  - `npm ci`, tsc, lint:dup, `npm test`, `npx next build` and `npm run acceptance`;
  - a before/after probe against origin/main;
  - a synthetic-data probe for note 1;
  - an API POST against `next start`.
- REVIEW.md does not exist.
- Nothing left running. My `next start` (port 3977) was stopped. The Playwright and next-server processes still running belong to the sgs-069 worktree.
