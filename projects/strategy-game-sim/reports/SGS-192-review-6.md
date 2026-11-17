# SGS-192 review 6 (delta)

Branch `sgs-192-wait-details`, tip `60eb68b`. Delta mode against `7596bde`, which review 4 bounced. Risk high.
Scratch: `worktrees/review-sgs-192-wait-details` (removed after this report).

## Verdict: APPROVE

The delta is one test file, `lib/aoe4-build-order/simulate-wait-details.test.ts` (+26/-3). It applies review 4's blocking finding 1 as directed (a) and (b). No production, doc or other file changed after `7596bde`.

## Blocking findings

None.

## Required fix check (review 4, finding 1)

- **(a) Missing building, snapshot order: landed.** A `startingWith(3, ['capital-town-center', ...houses], plenty, edit)` game sets `veteran-longbowmen.producedBy` to `['council-hall', 'archery-range']`. The test first asserts that `game.byBaseId.get('veteran-longbowmen')![0].producedBy` equals that list and is not equal to its sorted copy. It then expects `{ kind: 'building', buildings: [Council Hall, Archery Range], instance: null }`. The `at` row shares the setup and still expects `['council-hall']`, which is correct because `at` replaces the candidates.
- **(b) Busy, candidate order: landed.** New test `lists the busy candidates in candidate order`:
  - It uses `noAutoVillagers` over the same edit, with an archery range and a council hall.
  - It runs `produce longbowman` x3 from each building, then `research veteran-longbowmen` with `trigger: at(1)`.
  - It first asserts both produce steps have `startedAt` `[0, 0]` and the research step's `waitBreakdown.prerequisite > 0`.
  - It then expects exactly one entry (`onlyEntry`): `{ kind: 'building-busy', buildings: [Council Hall, Archery Range], instance: null, every: false }`.
- **Mutation check (run by me).**
  - I applied both review-4 mutations together:
    - `research.ts:55` `buildingWait(state, [...candidates].sort(), null)`;
    - `research.ts:63` `.sort()` on `built`.
  - Result: 2 failed, 35 passed.
    - The missing-building snapshot-order row failed.
    - `lists the busy candidates in candidate order` failed.
  - The two mutations are in separate branches, and each test reaches only its own: the no-instance branch, or the busy branch with both instances built. So each test catches its own mutation.
  - I reverted both changes; `git status` was clean.
- The edit clones the data (`editGameData` uses `structuredClone`) and copies `unsortedProducers`, so the shared `ENGLISH` data is not mutated.

## Test files across the branch

`git diff origin/main...HEAD` on test paths lists the same 13 files review 4 checked. Since `7596bde`, only `simulate-wait-details.test.ts` changed, and only in the hunks above. No test was deleted or weakened.

## Acceptance criteria

The delta re-checks criterion 5 (`research` details): it now **passes**. Snapshot order and candidate order are each pinned by a test that fails under a sort. No `(rework N)` criterion changed production behavior. All other criteria stand as review 4 recorded them (pass), since no production, doc or contract file changed.

## Invariants touched

The delta changes no production code. A1, A2 and A3 hold as review 4 recorded.

## Bot reconciliation

`reviewBot.cli` and `rulesFile` are empty, so no bot ran.

## Lint

`npx tsc --noEmit && npm run lint:dup`: clean, 0 clones.

## Non-blocking notes

Review 4's non-blocking notes still stand:
- the float boundary in `resourceWait`;
- side-effect imports in the import-line regex;
- the step-stuck busy row does not pin `waitingFor.kind`;
- the `lowestResearchAge` filter repeats `researchEntry`'s filter;
- the `aoe4-simulate-api-waits.spec.ts` checks are left to the acceptance-test gate.

## Coverage

- Reviewed `git diff 7596bde..60eb68b` (1 file) and `research.ts:40-70` for the code it tests.
- Ran:
  - lint;
  - `vitest run lib/aoe4-build-order/simulate-wait-details.test.ts`: 37 passed;
  - the two sort mutations (2 failed as expected), then reverted them.
- No Playwright, acceptance or browser tests. No UI inspection: the delta changes no UI.
