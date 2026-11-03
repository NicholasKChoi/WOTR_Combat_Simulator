# SGS-077 review 1

- Verdict: **APPROVE**
- Branch `sgs-077-aoe4-gathered-resources-chart` @ `489a616` (local ref, not on origin yet), base origin/main `ebc063d`, two commits (`177f5e5`, `489a616`). Full review.
- Worktree: detached `worktrees/review-sgs-077-aoe4-gathered-resources-chart` (removed afterwards). A second throwaway worktree on origin/main was used for a before/after comparison and is also removed.
- Node v24.22.2 (nvm), as `engines.node` requires.

## Blocking findings

None.

## Spec gaps

None.

## Gates run by me

- `npm ci`: exit 0.
- `npx tsc --noEmit`: exit 0. `npm run lint:dup`: "Found 0 clones.", exit 0.
- `npx next build`: exit 0.
- `npm test`: 44 files, 1322 passed, 10 skipped.
- `npm run acceptance`: 691 passed (1.5 m).
- Mutation checks, each reverted afterwards:
  - Removed the unstocked-path `engine.gathered` credit: the constant-rate case and all 3 prebuilt cases fail.
  - Removed the stocked (`drawDown`) path credit: all 3 prebuilt cases fail. The constant-rate case passes, as the ticket expects.
  - Initialised `gathered` to the starting resources: all 4 cases fail.
- Before/after equality: a throwaway vitest dump ran on this branch and on origin/main. It covered every `listBuilds()` build at 60/600/1800/3600 s, each with default inputs, `autoHouses: false` and `INFINITE_NODES` (36 runs). The full results JSON with `gathered` deleted is byte-identical between the two (`cmp`). No existing result field changes value.
- Real response vs the OpenAPI example: a throwaway Playwright spec POSTed the documented `buildOrder` request example to the dev server. Its `gathered` equals the 200 example's `gathered` (`toEqual`). The repo's contract test "the buildOrder request example returns the documented 200 body" also passes.
- UI: the same throwaway spec ran at 360x760, 390, 700, 768 and 1280 wide. Each run did 600 s, pinned it, then ran 900 s. Results:
  - The chart testids appear in the order units-produced, gather-rates, gathered-resources, floating-resources.
  - `path[data-series="pinned:food"]` is present in `chart-gathered-resources` with `stroke-dasharray="6 4"`.
  - `scrollWidth - innerWidth` = 0 at every width.
  - I looked at screenshots at 360, 768 and 1280: y label "Resources", Food/Wood/Gold/Stone plus pinned legend items, and no overlapping tick or marker labels. The pinned lines sit under the current lines up to 10:00, as expected for the same build.
- Both throwaway spec files were deleted. `git status` is clean. No server or Playwright process from this review is still running.

## Acceptance criteria

All ticked in the ticket.

1. Response `gathered`: pass. It has four kinds, length `times.length`, starts at 0 and is non-decreasing. The new test in `aoe4-simulate-api-spend-population.spec.ts` passes.
2. Constant-rate unit case: pass. Its premise asserts (`depletedAt === null`, spent all 0), and it checks the rate-times-dt delta and the floating difference within 1e-6. It fails when the unstocked credit is removed (verified).
3. Prebuilt-builds unit case: pass. It checks the four-kind sum identity and the per-kind lower bound, and it fails when the stocked credit is removed (verified).
4. OpenAPI: pass.
   - `info.version` is 2.1.0.
   - `required` has `gathered` directly after `floating`.
   - `properties.gathered` mirrors `floating`'s shape (object, closed, required four kinds, number arrays with `minimum: 0`, a description on each kind).
   - The 200 example has `gathered` after `floating`, and it matches a real response.
   - The contract spec passes.
5. Docs: pass. The overview, the flowchart edge (between `rates` and `floating`), the field-list bullet after `floating`, "four graphs ... gather rates, gathered resources, and floating resources", and "A 200 draws four line charts" with the table row in place all match the code.
6. Four charts in order with the pinned dashed overlay: pass. Verified in a browser, and the pin-compare dashed test covers it via `RESOURCE_CHARTS`.
7. `git grep -c chart-gathered-resources -- acceptance`: pass. m3-flow 1, pin-compare 2, aoe4-build-order 3.
8. No existing field changes value: pass.
   - The three house-warnings digests are unchanged from main (`e7f2436b024f722f`, `a0105e4a512765a0`, `46f521f50e92ca03`), with only `gathered` excluded.
   - The independent 36-run byte comparison above confirms it.
   - Existing-test edits match Scope item 6 exactly (see below). tsc, unit and acceptance all pass.
9. Version-pin greps: pass. No `toBe('2.0.0')` in acceptance, lib or components, and `toBe('2.1.0')` is at `acceptance/aoe4-simulate-api-issue-shape.spec.ts:16`.
10. No INVARIANTS regressions: pass (below).

## Scope item 6: existing-test edits vs the ticket

Every edit matches the named item. There are no other edits to existing tests.

- `acceptance/aoe4-build-order.spec.ts`: `CHARTS` (after gather-rates), the `yLabels` entry `'Resources'`, and the literal per-kind loop.
- `acceptance/aoe4-build-order-pin-compare.spec.ts`: `CHART_IDS` and `RESOURCE_CHARTS`; the title "... in every chart".
- `acceptance/aoe4-build-order-m3-flow.spec.ts`: `RESOURCE_CHARTS`.
- `lib/aoe4-build-order/simulate.test.ts`: `arrays` gains `...Object.values(result.gathered)`.
- `components/apps/aoe4-build-order/result-series.test.ts`: `result()` gains three-entry `gathered` arrays.
- `acceptance/aoe4-simulate-api-contract.spec.ts`: `gathered: true`.
- `acceptance/aoe4-simulate-api-edges.spec.ts`: `'gathered'` between `'gatherRates'` and `'markers'`.
- `acceptance/aoe4-simulate-api-issue-shape.spec.ts`: `toBe('2.1.0')` and the title "... 2.1.0".
- `lib/aoe4-build-order/simulate-house-warnings.test.ts`: the destructure, title and describe comment match the ticket verbatim, the pins are unchanged, and the late-house test is untouched.

## Invariants touched

- A2 holds. `engine.gathered` lives on `Engine`, not the `EngineState` passed to effects (simulate.ts:126). It is written only in `creditIncome` (simulate.ts:710, 716) and read only in the sample loop (simulate.ts:967). `payCost`, `canAfford`, `affordableAt`, `nextWake` and the triggers never read it. The only `+=` on `resources` remain the two in `creditIncome`. No engine cloning exists that could share the object.
- A3 holds. It is a deterministic counter, and repeated runs are byte-identical.
- A1 holds. There are no new game numbers; the zero initialisation is not game data.
- S1 and S3 hold. There is no new input or loop, and the chart uses the app's own `resourceSeries`.

## Doc claims checked

- model.ts:124 "Cumulative resources gathered; starting resources excluded.": true. It is zeroed in `createEngine` (simulate.ts:794) and only income adds to it.
- OpenAPI descriptions ("... up to each sample; starting resources are excluded.") and `minimum: 0`: true. The counter starts at 0 and adds `unstocked * seconds` (seconds >= 0) and `drawn` (>= 0).
- docs bullet "cumulative amount gathered since t=0; ... never decreases": true.
- "four graphs" paragraph and chart table: true from results.tsx order and `resourceSeries` names.
- Test comment "Digests of every field but warnings and gathered": true for the 1800 s test. The late-house test above it digests named fields, a pre-existing quirk of that shared comment.

## Bot reconciliation

`reviewBot.cli` is empty and there is no `rulesFile`. Nothing to reconcile.

## Conventions

- The new chart block is a copy of the floating-resources block's prop order (results.tsx:63).
- The new unit tests follow the `describe`/`it.each` style of `simulate-series.test.ts`.
- The new API test follows the sibling `spent` describe in the same spec (types in the `Body` alias, a const kind list like `CATEGORIES`).
- The sampled `gathered` record follows the `floating` declaration on the line above it.
- No shared `sum` helper exists in `lib/aoe4-build-order` to reuse.

## Non-blocking notes

- docs/aoe4-build-order.md:12: the overview line is now about 125 characters while the surrounding prose wraps near 110. Rewrapping is optional.
- Pre-existing, not from this diff: chart tooltips show unrounded values (e.g. "Food : 92.630712227254"). This is the shared `SeriesChart` tooltip, and the floating chart shows the same. It could go to BACKLOG with the other chart polish if wanted.
- The branch is not on origin yet (the implementer did not push). I reviewed the local ref `489a616`. The manager must push it before opening the PR.
- SGS-076 also touches `results.tsx`. Whichever lands second rebases, and the new chart must stay third in the charts column.

## Coverage

- Reviewed every file in `git diff origin/main...HEAD` (16 files), including the OpenAPI example, the schema and the required list.
- Also read `creditIncome`, `createEngine`, the sample loop, `payCost` (engine-common.ts:31) and the `EngineState`/`Engine` interfaces.
- REPO.md "Every diff" checklist: build ran, and the page was loaded and exercised (run, pin, rerun) through Playwright.
- REPO.md "AoE4 build order" checklist: no copied helper or constant; the docs match the engine; screenshots at 360x760, 768 and 1280; overflow checked at 390 and 700; no Bootstrap/module CSS mixing added (no className changes).
- There is no REVIEW.md in the repo, and no milestone design applies (the ticket has no milestone).
