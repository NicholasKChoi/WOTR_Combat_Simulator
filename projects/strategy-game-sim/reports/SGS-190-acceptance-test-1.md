# SGS-190 acceptance-test 1

Verdict: PASS. Branch sgs-190-busy-building-wait, tested at tip a39e091, new commit d550fdc (one spec file added).

Harness provisioned (acceptanceSetup ran) and Playwright ran against next dev.

## Existing specs
Command: `npx playwright test acceptance/aoe4-simulate-api- acceptance/aoe4-marker-labels.spec.ts acceptance/aoe4-build-order-knight-longbow-page.spec.ts`
Result: 382 passed, 0 failed. This covers every `aoe4-simulate-api-*` spec (including -research, -veterancy-conversion, -production-buildings, -markers, -waits, -spear-longbow-build, -knight-longbow-build, -prebuilt-plans, -prebuilt-farms), marker-labels and knight-longbow-page. The implementer changed no acceptance spec and none needed it. No floor, cap or bar failure.

## Tests written
`acceptance/aoe4-simulate-api-busy-buildings.spec.ts` (2 tests, both pass):
1. Single busy target through POST simulate: a scout produce armed at 10 s on a TC training a villager gets startedAt 20, completedAt 43, waitBreakdown {prerequisite: 10}. Food at 10 s equals the run without the scout, and food at 20 s is lower, so the cost is not charged before it starts.
2. A continuous villager order is replaced only when the villager in training spawns: scout startedAt 20, prerequisite 10, no step-stuck warning.

## Mutation checks
- Break: `lib/aoe4-build-order/engine-common.ts:74`, `instanceFree` forced to `return true`. Both tests failed on `startedAt` (expected 20, got 10) and `waitBreakdown` (expected {prerequisite: 10}, got {}). Undone with `git checkout --`; the tree was clean afterwards.
- A third draft test (determinism and non-negative floating resources) still passed under that break. I deleted it because it could not fail for the busy rule. Determinism and A2 stay with the implementer's unit tests.

## Lint
`npx tsc --noEmit` and `npm run lint:dup` are clean (0 clones).

## Not expressed in this harness
The API accepts only `start.villagers` and `rally`, not starting age or buildings. So these cannot be driven at the boundary without a long real build, and they rest on the unit tests in `simulate-busy-buildings.test.ts`:
- research at a busy building, research candidate choice, and researches serialised at one blacksmith (all need Feudal or later);
- multi-target hold;
- `instance: k`;
- reactions;
- reserve on a busy wait;
- the never-free-by-horizon case. A continuous order frees its instance at each spawn, so it cannot hold the building forever.

Floors, bars and the Spear/Longbow edit are covered by the 382 existing specs and the implementer's `builds.test.ts`.

## Failures
None.
