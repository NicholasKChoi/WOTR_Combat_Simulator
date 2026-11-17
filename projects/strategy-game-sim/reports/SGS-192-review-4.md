# SGS-192 review 4

Branch `sgs-192-wait-details`, tip `7596bde`, base `origin/main` (merge base 38320d8). Full review (not delta), risk high.
Scratch: `worktrees/review-sgs-192-wait-details` (removed after this report).

## Verdict: REQUEST CHANGES

The production code matches the contract. I found no correctness, invariant, doc or lint defect. One blocking `test` finding: two order claims in the research criterion are only checked against data that is already in sorted order, so a sort mutation survives. I applied the mutation and all 1875 `lib/aoe4-build-order` tests still passed.

## Blocking findings

1. `lib/aoe4-build-order/simulate-wait-details.test.ts:165-172` ("a missing building names every producing building in snapshot order") and `:182-187` ("lists only the candidates that have an instance") - **test** - The criterion says a missing building names every `producedBy` building "in snapshot order", and a busy wait lists the candidates "in candidate order". But `veteran-longbowmen.producedBy` is `['archery-range', 'council-hall']`, which is already sorted. The busy test also has only one candidate with an instance, so it cannot check order at all. I checked this by mutation. I changed `research.ts:55` to `buildingWait(state, [...candidates].sort(), null)` and `research.ts:63` to `candidates.filter(...).sort()`. `npx vitest run lib/aoe4-build-order` still passed: 1875 passed, 0 failed. Then I reverted both changes. Why it matters: the first test's name claims a snapshot-order check that its input cannot make. A sort is a plausible mistake here, since someone could sort to normalize `waitTargetKey`. Direction:
   - (a) Missing building. Add a row, or change the `producedBy` row, to use a game whose `producedBy` is out of code-unit order: `startingWith(3, ['capital-town-center', ...houses], plenty, (parts) => { parts.snapshot.upgrades.find((e) => e.baseId === 'veteran-longbowmen')!.producedBy = ['council-hall', 'archery-range'] })`. `veteran-longbowmen` is in `upgrades`. First assert that `game.byBaseId.get('veteran-longbowmen')![0].producedBy` equals `['council-hall', 'archery-range']`. Then expect `waitingFor` to be `{ kind: 'building', buildings: [Council Hall, Archery Range], instance: null }`.
     - Production change it fails on: `research.ts:55` `buildingWait(state, [...candidates].sort(), null)`.
     - Before: `[council-hall, archery-range]`. After: `[archery-range, council-hall]`.
   - (b) Busy, candidate order. Use the same reversed `producedBy` edit, plus `noAutoVillagers(startingWith(3, ['capital-town-center', 'archery-range', 'council-hall', ...houses], plenty, edit))`.
     - Steps: `produce longbowman from archery-range x3`, then `produce longbowman from council-hall x3` (`longbowman.producedBy` includes both), then `research veteran-longbowmen` with `trigger: at(1)`.
     - First assert that both produce steps have `startedAt` 0 and that the research step's `waitBreakdown.prerequisite` > 0. That is the precondition: both candidate instances are busy at 1 s.
     - Then expect exactly one `waitDetails` entry: `{ kind: 'building-busy', buildings: [Council Hall, Archery Range], instance: null, every: false }`.
     - Production change it fails on: `research.ts:63` adding `.sort()` to `built`.
     - Before: `[council-hall, archery-range]`. After: `[archery-range, council-hall]`.

## Spec gaps (NEEDS_SPEC)

None.

## Acceptance criteria

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| 1 | Every step carries `waitingFor` and `waitDetails`; a step that never failed an offer has null and `[]` | pass | `createEngine` (`simulate.ts:915`); the horizon test checks `[0,0,1,0,0]` lengths; `simulate.test.ts` rally/pause `toEqual` |
| 2 | `produce` details: missing producer, unit above the age, age before building, population, busy `every`/`instance` | pass | `simulate.ts:400-421`; tests at `simulate-wait-details.test.ts:52-108`. Population asserts `needed: 2` with `used + 2 > supply >= used + 1` |
| 3 | Resource details: exact short kinds, whole numbers of at least 1, 0.4 rounds up, held need | pass | `wait-detail.ts:46-55`; unit row gold 99.6/100 → 1 fails under floor and round; three hold rows (`build`, `produce`, `research`) give `{ wood: 10 }`, which fails under the plain cost (implementer M4/M9/M10) |
| 4 | `build` and `move` details | pass | `simulate.ts:506-529`; table at `simulate-wait-details.test.ts:139-148` |
| 5 | `research` details | pass for code, test gap | Code is correct (`research.ts:47-65`). Snapshot order and candidate order are untested against a sort (blocking finding 1). Lowest-age, `at` and busy-blacksmith cases pass |
| 6 | Age with a landmark; null for another age and for an age two above | pass | `wait-detail.ts:16-33`; `ageWait` table includes an age-1 and an age-3 landmark that complete earlier, so it fails if the age filter is dropped; engine cases at `:194-208` |
| 7 | `waitingFor` lifecycle; `waitReasonOf(detail) === waitingOn` per offer | pass | `offerStep` `simulate.ts:559-565`; "keeps the last failed offer" (first entry `available: 2`, final `available: calls`); horizon status table; offer-recording loop over prebuilt builds that asserts all four reasons occur |
| 8 | Accrual B-W5..B-W8, B-W11 | pass | `accrueDetail` `simulate.ts:952-967`; keying table with merge-by-kind breakers ("two buildings of one kind", "two ages"), the landmark keep/clear row, and the zero-interval/null row |
| 9 | Sum invariant over every prebuilt build at 1200 s plus the cases, unique keys, non-empty guard | pass | `simulate-wait-details.test.ts:279-299` |
| 10 | (respec 1) Busy sample | pass | `:84-93`: asserts prerequisite > 0, then one `building-busy` entry for capital-town-center, `every: false`, `instance: null`, seconds equal to the breakdown and to `waitSeconds` |
| 11 | (respec 1) No timing changes; edits only within the rules | pass | `canAffordHeld(s, c)` is exactly `canAfford(s.resources, heldNeed(c, [s.houseHold]))` (`engine-common.ts:53-55`), so `build` and `produce` pass and fail the same as before; the produce split keeps the same reason for every branch. Every existing-test edit is a `detail`/field shape edit or a name-list edit. The house-gate digest strips the two new fields, so the pins are unchanged. Unit suite: 85 files passed |
| 12 | (respec 1) Pinned name lists and contract structure | pass (by reading) | `data.acceptance.test.ts` gains 3 names and drops the count; `AOE4_SCHEMA_NAMES` gains 2; `StepWaitEntry` is in `RESPONSE_SCHEMAS`; `StepWaitDetail` is in `SHARED_SCHEMAS` and the description loop; the new variant test checks the closed schema, required properties and the 6 distinct `kind` consts. Playwright not run (acceptance-test gate) |
| 13 | `step-stuck` unchanged | pass | `stepStuckWarning` is not in the diff; 3-row table at `:316-341` |
| 14 | (respec 1) `constructing` on `EngineState`, not `Engine` | pass | `simulate.ts:121` declares it; it is removed from `Engine`; `startConstruction` and `completeConstruction` read it without a cast (`ages` keeps its existing `as Engine`, which is correct because `ages` is `Engine`-only); `ageWait` tests pass an `EngineState`-typed value |
| 15 | (respec 1) Browser-safe import-line test; pure table rows | pass | `wait-detail.test.ts:120-128`; implementer M16 |
| 16 | `waitDetailText`, `waitTargetKey`, `waitReasonOf` forms | pass | Tables in `wait-detail.test.ts`. The `RESOURCE_KINDS` order gives `20 wood and 50 gold`, not the ticket sample's `50 gold and 20 wood`. The ticket's own rule decides, and the implementer flagged this |
| 17 | Two runs deep-equal (A3) | pass | `:303-310` picks a build with resources, age and busy details, asserting it exists first |
| 18 | OpenAPI validates; 200 examples; exhaustive `Record<keyof StepTiming>` | pass (by reading); live validation not run by me | The schemas, both new `StepTiming` fields in `required`, and the 5 example steps are in the diff. The implementer recorded an ajv check against live bodies. The contract spec runs under the acceptance-test gate |
| 19 | Docs: field list, wait-reasons paragraph, age-before-building rule | pass | Format doc `steps` list, table and order paragraph, new `### Wait details`; model doc paragraph at line 163. No remaining sentence calls `waitingOn` and `waitBreakdown` the only wait records |
| 20 | (respec 1) README | pass | `wait-detail.ts` module entry; new-step-action line |
| 21 | No INVARIANTS.md regressions | pass | See below |

## Invariants touched

- **A1** (game numbers from data): holds. Names come from `state.data.byBaseId` and no game number was added. `RESOURCE_TOLERANCE` is imported, not copied.
- **A2** (resources never negative, waits reported): holds. `resourceWait` only reads `state.resources`. Check order, reserves and holds are unchanged. The `build` rewrite to `canAfford(state.resources, need)` is equivalent to the old `canAffordHeld`/`canAfford` branch.
- **A3** (deterministic): holds. There is no clock or randomness. `nextLandmark` breaks ties by `baseId`, and its `constructing` iteration is array order. `waitDetails` is an array in first-accrued order. The repeat-run test deep-equals.
- **S1-S3**: not touched (no `pages/apps`, `utils` or shared path in the diff).

## Bot reconciliation

`reviewBot.cli` is empty, so no bot ran. `rulesFile` is empty too.

## Lint

`npx tsc --noEmit && npm run lint:dup`: clean, jscpd found 0 clones in both configs. `npx next build`: passed.

## Non-blocking notes

- `wait-detail.ts:49` and `engine-common.ts:33`: `canAfford` tests `bank + tol >= cost`, while `resourceWait` computes `ceil(cost - bank - tol)`. Within float rounding (around 1e-14) at the exact boundary, the check can fail while `short` comes out `{}`, which breaks the schema's `minProperties: 1`. This is very unlikely. If it matters, computing `short` with the same expression, or falling back to 1 for the first kind where `bank + tol < need`, would close it.
- `wait-detail.test.ts:122`: the import regex skips side-effect imports (`import './simulate'`) and `export ... from` re-exports, so those would pass the browser-safety check. The realistic regression, a named value import, is caught (M16).
- `simulate-wait-details.test.ts:325-330` (step-stuck "a busy building" row): it does not assert that the stuck step's `waitingFor.kind` is `building-busy`. Today it is busy, because wheelbarrow takes 90 s and the run is 60 s, but a data change could leave it asserting a different prerequisite. Adding `expect(stuck.waitingFor?.kind).toBe('building-busy')` would pin the meaning.
- `research.ts:40-42`: `lowestResearchAge` repeats `researchEntry`'s `technology || upgrade` filter. This is minor and under the jscpd threshold.
- The `aoe4-simulate-api-waits.spec.ts` field checks named under Tests/Acceptance are not in the diff. The implementer left them to the acceptance-test gate, which owns acceptance specs. That gate should add them.

## Coverage

- Reviewed the whole diff (21 files):
  - production: `wait-detail.ts`, `model.ts`, `simulate.ts`, `research.ts`;
  - `docs/api/openapi.json`;
  - both docs and the README;
  - both new test files;
  - every edited existing test;
  - `acceptance/helpers.ts`, the contract spec and the surface spec.
- Read for context: `engine-common.ts` (`canAfford`, `heldNeed`, `canAffordHeld`), `resolveUnitEntry`, `finalStatus`, `waitingSteps`, the horizon status pass, `test-helpers.ts`, and design M11.md C1, C2, C5-C7a and B-W1..B-W12.
- Ran:
  - lint: tsc and jscpd;
  - `next build`;
  - `vitest run lib/aoe4-build-order components/apps/aoe4-build-order`: 2731 passed, 15 skipped;
  - one sort mutation, then reverted it.
- No Playwright, acceptance or browser tests run (common.md).
- UI inspection did not run: the diff changes no rendered UI. The only `components/` change is a `StepTiming` test fixture, and `step-annotations.ts` is untouched.
- REPO.md checklist: "Every diff" was covered by `next build`. No page load, since no page behavior changed. For "AoE4 build order", I found no helper or tolerance copied, and the docs agree with the code. The UI items do not apply.
- LESSONS.md: its one entry (`acceptance/**`, layout reads) does not apply, because the acceptance edits read no layout.
- `styleSources`: `ARCHITECTURE.md` is out of scope per the ticket, and no `tsconfig` change was made.
- No `REVIEW.md` at the repo root.
