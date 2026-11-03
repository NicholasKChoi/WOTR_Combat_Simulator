# SGS-077 implementer report 1

- Ticket: SGS-077 (cumulative gathered resources series and chart), risk high
- Branch: `sgs-077-aoe4-gathered-resources-chart`, from main `ee7ecb9`
- Tip: `a471dabea80f62a03df4713508668c53afbe210a` (author choinickolas@gmail.com)
- Worktree: `/home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-077-aoe4-gathered-resources-chart`
- Status: **needs_spec**. One pre-existing acceptance test that the ticket's rule does not cover fails, and I left it unchanged (details below). Everything else is implemented and passes.

## Blocking: pre-existing test outside the ticket's existing-test rule

`acceptance/aoe4-simulate-api-issue-shape.spec.ts`: "suggestion is an optional string property and the document version is 2.0.0" asserts `expect(spec.info.version).toBe('2.0.0')`. Scope item 3 requires `info.version` 2.1.0. The ticket's rule for existing tests ("a list of the result's charts or of its per-sample series gains the new entry; no other existing expected value changes") does not allow changing that expected value, and item 6 does not list this test. Left unchanged: it fails, so `npm run acceptance` shows 1 failure. Probable fix for the re-spec: change the assertion to `'2.1.0'` and the title to "... the document version is 2.1.0". Both are one-line edits.

## Files touched

- `lib/aoe4-build-order/simulate.ts`: `Engine.gathered` counter, zeroed in `createEngine`, credited on both `creditIncome` paths, sampled beside `floating` and returned after it.
- `lib/aoe4-build-order/model.ts`: `SimulationResult.gathered` added after `floating`, with the comment the ticket gives.
- `components/apps/aoe4-build-order/results.tsx`: the fourth `SeriesChart` (`chart-gathered-resources`), placed third.
- `docs/api/openapi.json`: version 2.1.0, `gathered` in required and properties, and `gathered` in the 200 example (copied from a real route response).
- `docs/aoe4-build-order.md`: the overview, the flowchart, the field list, the "draws four graphs" paragraph and the chart table.
- `lib/aoe4-build-order/simulate-series.test.ts`: new `describe('gathered')` (2 tests, the second runs once per prebuilt build, 3 cases).
- `acceptance/aoe4-simulate-api-spend-population.spec.ts`: a new `gathered` shape test.
- Existing tests edited: see the list below.

## Pre-existing tests edited

1. `acceptance/aoe4-build-order.spec.ts`: `CHARTS`, the `yLabels` map, and the literal resource-chart loop at "runs the default prebuilt build and draws every unit and resource series" each gain `chart-gathered-resources`. Rule: item 6 (chart lists gain the entry).
2. `acceptance/aoe4-build-order-pin-compare.spec.ts`: `CHART_IDS` and `RESOURCE_CHARTS` gain it. Title "... in all three charts" becomes "... in every chart". Rule: item 6.
3. `acceptance/aoe4-build-order-m3-flow.spec.ts`: `RESOURCE_CHARTS` gains it. Rule: item 6.
4. `lib/aoe4-build-order/simulate.test.ts`: in "samples every SAMPLE_SECONDS and at the horizon", `arrays` gains `...Object.values(result.gathered)`. Rule: item 6.
5. `components/apps/aoe4-build-order/result-series.test.ts`: the `result()` fixture gains `gathered: { food: [0, 1, 2], ... }`. Rule: item 6 (typed fixture).
6. `acceptance/aoe4-simulate-api-contract.spec.ts`: `simulationResult` gains `gathered: true`. Rule: item 6 (typed fixture).
7. `acceptance/aoe4-simulate-api-edges.spec.ts`: in "a villager-only order returns every result field, aligned to the times axis", the expected list of result keys gains `'gathered'`. Item 6 does not name this test. I applied the rule's "a list of ... its per-sample series gains the new entry", because the list is the result's fields and `gathered` is a per-sample series. No other expected value changed.
8. `lib/aoe4-build-order/simulate-house-warnings.test.ts`: in "leaves every field of %s at 1800 s but warnings as it was", the destructure becomes `const { warnings, gathered, ...rest }`. The title now reads "... but warnings and gathered as it was", and the describe comment reads "Digests of every field but warnings and gathered". Item 6 does not name this test, and `tsc` does not flag it. It digests every result field, so the new field changed all three pinned digests. Re-pinning them would change expected values, which the rule forbids. Leaving `gathered` out of the digest keeps all three pinned digests unchanged. That also shows directly that no existing field changed value on any prebuilt build at 1800 s. **The manager or reviewer should confirm this edit is acceptable under the rule.** The alternative is to re-pin the three digests.

## Tests run

- `npx vitest run`: 44 files, 1311 passed, 10 skipped, 0 failed.
- `npm run acceptance` (Playwright, full suite): 689 passed, 2 failed on the first run. The failures were api-edges (fixed per edit 7) and issue-shape (the blocking item above). After the fix, the four API specs (edges, issue-shape, spend-population, contract) gave 106 passed and 1 failed (issue-shape only). Every UI spec passed on the full run, including `aoe4-narrow-layout.spec.ts` unchanged, the y-label, marker and pinned-overlay tests over `CHARTS`, and the pin-compare dashed-overlay test over `RESOURCE_CHARTS`.
- Invariants the new tests encode:
  - Constant-rate case (paused town center, `INFINITE_NODES`, 300 s, no autoHouses). It first checks its premise: every `depletedAt` is null and every `spent` is 0. Then per kind: `gathered[0] === 0`, the per-interval delta equals `gatherRates/60*dt` within 1e-6, and `gathered = floating - floating[0]` within 1e-6.
  - Prebuilt builds at 600 s, one case per `listBuilds()` build. Per kind: length is `times.length`, it starts at 0, it never decreases, and `gathered >= floating - start - 1e-6`. Per sample: the four-kind sum of `gathered` equals `sum(floating - start) + sum(spent)` within 1e-6.
  - API (`english-1tc`): keys are exactly food/wood/gold/stone, and each series has `times.length` entries, starts at 0 and never decreases.

## Mutation checks (each made, run, seen to fail, then reverted)

- Removed `engine.gathered[kind] += unstocked[kind] * seconds`: the constant-rate test and all 3 prebuilt cases failed.
- Removed `engine.gathered[kind] += drawn[ref] ?? 0` (stocked path): all 3 prebuilt cases failed and the constant-rate test passed, as the ticket expects.
- Initialised `gathered` to the starting resources: all 4 unit tests failed. The API `gathered` acceptance test also failed under this break.
- Sampling offset (each sample pushed `gathered[i] + (gathered[i] - gathered[i-1])`): all 4 unit tests failed.
- `results.tsx` pinned overlay given `series: []` for the gathered chart: the pin-compare "pinned lines are dashed ... in every chart" test failed.
- After the reverts, `git diff` matched the intended change, and the final `tsc` and vitest runs were green.

## Codegen, build, lint

- codegen: not set.
- build: `npm ci` then `npx next build` passed (exit 0).
- lint: `npx tsc --noEmit` reports 0 errors. `npm run lint:dup` reports "Found 0 clones".
- Runtime: the shell default is Node v22.17.0, but the repo declares `engines.node` 24.x. Every stage ran under Node v24.22.2 through `nvm use 24`.

## Doc claims

- `model.ts` comment "Cumulative resources gathered; starting resources excluded.": true because `createEngine` sets `gathered: { food: 0, wood: 0, gold: 0, stone: 0 }` and only `creditIncome` adds to it.
- OpenAPI "Cumulative amount of each resource gathered up to each sample; starting resources are excluded." and the per-kind "Cumulative amount of this resource gathered up to each sample.": true because `simulateBuildOrder` pushes `engine.gathered[kind]` in the sample loop. `minimum: 0` holds because the counter starts at 0 and only adds non-negative income (`unstocked * seconds`, `drawn`).
- Doc bullet "`gathered`: per `ResourceKind`, the cumulative amount gathered since t=0; starting resources are not counted, and it never decreases.": same code. The monotonicity is checked by the prebuilt unit test and the API test.
- Doc "The page draws four graphs ... units produced (by unit and tier), gather rates, gathered resources, and floating resources" and "A 200 draws four line charts" plus the table row: true from `results.tsx` (four `SeriesChart`s in that order), the `CHARTS` order in `aoe4-build-order.spec.ts`, and `resourceSeries` naming Food/Wood/Gold/Stone.
- Overview "resources gathered" and the flowchart edge `gathered["graph: gathered resources"]`: same sources.
- Test comment "Digests of every field but warnings and gathered": true from the destructures in that describe.

## Invariant check

- A2 upheld. `engine.gathered` is written only in `creditIncome` and read only in the sample loop. `payCost`, `affordableAt`, `nextWake` and the reserve logic do not reference it. The fingerprint digests of every other field are unchanged on all three prebuilt builds at 1800 s, and the 200 example minus `gathered` equals the real response.
- A3 upheld. The counter is a deterministic function of the existing credits, with no randomness or clock.
- S3 upheld. There is no new input or loop.
- A1 upheld. No game numbers were added.
- S1 upheld. The chart uses the app's own `resourceSeries`.

## Out-of-scope findings

- None in product code.
- `simulate-house-warnings.test.ts` digests the entire result, so any future additive result field will break its pins the same way. Future tickets that add a field should name it under existing tests.

## Notes

- `docs/aoe4-build-order.md` overview line is now about 125 characters. I did not rewrap the untouched lines around it.
- The processes still running at handoff (playwright, `next dev -p 3385`) belong to the SGS-076 worktree, not this one. Nothing I started is still running.
