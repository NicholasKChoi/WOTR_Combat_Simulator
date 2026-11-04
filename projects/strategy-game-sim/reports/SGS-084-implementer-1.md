# SGS-084 implementer 1

- Ticket: SGS-084, "Add a gatherers series and a per-villager view of the Gather rates chart" (risk high)
- Branch: `sgs-084-aoe4-gather-rate-per-villager`, base origin/main b9481e333dc0e29731a0da063546272cae4af1bf (origin/main has since moved to fcfbaf1; not rebased)
- Tip: b90ad269213d2290ad3d2b338162953d5d210eff (one commit, author Nick Choi <choinickolas@gmail.com>)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-084-aoe4-gather-rate-per-villager
- Runtime: node v24.22.2, which matches engines 24.x.

## Files touched (14; diff against the base is 271 insertions and 17 deletions)
- `lib/aoe4-build-order/simulate.ts`: adds `gathererCounts(engine)`, which sums `engine.gatherers[ref]` per resource over `NODE_REFS`. The sample loop records a `gatherers` series next to `gatherRates`, and the result returns it.
- `lib/aoe4-build-order/model.ts`: `SimulationResult.gatherers: Record<ResourceKind, number[]>` after `gatherRates`.
- `docs/api/openapi.json`:
  - `gatherers` added to `required` and to the properties: an object with required food/wood/gold/stone and additionalProperties false; each kind is an array of integers with minimum 0 and its own description.
  - The 200 example gains `gatherers` from a real handler response.
  - `info.version` moves from 2.2.0 to 2.3.0.
- `docs/aoe4-build-order.md`: a `gatherers` bullet under Outputs, and the Per villager toggle sentence after the chart table.
- `components/apps/aoe4-build-order/result-series.ts`: `perVillagerSeries(rates, gatherers)` returns `resourceSeries(rates)` with each value divided by the same kind's count at the same index, or 0 where the count is 0.
- `components/apps/aoe4-build-order/line-chart.tsx`:
  - New optional `headerControls?: ReactNode`, rendered beside the `<h3>` in a flex row.
  - The YAxis label gets `textAnchor: 'middle'`. Without it, recharts' `insideLeft` anchors the rotated text at its start, at the axis midpoint, so "Per villager per minute" ran past the top of the SVG and was clipped (seen in a screenshot).
  - This also centers the other charts' labels ("Units", "Resources", "Per minute") on the axis instead of starting them at the midpoint. Their text is unchanged.
- `components/apps/aoe4-build-order/results.tsx`:
  - `perVillager` state, default false.
  - The Gather rates chart switches the series, the pinned series and the yLabel.
  - The checkbox `gather-rates-per-villager` uses `form-check-input` and the label "Per villager".
  - The chart is not remounted (same element and key), so legend hidden-state survives the toggle.
- `lib/aoe4-build-order/simulate-series.test.ts`: new `describe('gatherers')`.
- `components/apps/aoe4-build-order/result-series.test.ts`: `gatherers` added to the result builder; new `describe('perVillagerSeries')`.
- `lib/aoe4-build-order/simulate-house-warnings.test.ts`: pre-existing; see below.
- `acceptance/aoe4-simulate-api-contract.spec.ts`, `acceptance/aoe4-simulate-api-edges.spec.ts`, `acceptance/aoe4-gathered-resources.spec.ts`, `acceptance/aoe4-simulate-api-issue-shape.spec.ts`: pre-existing; see below.

## Tests
- vitest (`npm test`): 45 files, 1362 passed, 10 skipped, 0 failed.
- Playwright acceptance (`npm run acceptance`), full suite: 739 passed, 0 failed. Run after the final line-chart change.
- New unit tests and the invariants they encode:
  - `simulate-series.test.ts` `gatherers` it.each over start splits:
    - `start 4 sheep 2 wood` gives counts 4/2/0/0, and gatherRates.food / gatherers.food = the sheep rate x 60.
    - `start 3 sheep 3 berry` gives food 6, and the food rate is the weighted mean of the two node rates.
    - Invariant: gatherers counts exactly the villagers whose income makes up gatherRates.
  - "leaves builders out from when they leave the node until they walk back after completion":
    - Setup: `start 2 sheep 4 wood -> sheep`, a house at 0:30 with builders 2 from wood, then wood; default inputs.
    - Assertions:
      - At sample i, the first with t >= startedAt, wood drops from 4 to 2.
      - The wood rate drops by 2 x r x 60 at the same sample.
      - At the first sample strictly after completedAt and before completedAt + walkSeconds, wood is 2.
      - At the first sample >= completedAt + walkSeconds, wood is 4 again.
    - Observed completedAt is 46.25: sample 50 shows 2 and sample 55 shows 4.
    - The spec-gate 3 auto-house note is checked: the default run and an autoHouses-off run give identical wood gatherers, so no auto-house adds wood builders before 0:30.
  - "drops at the same sample as the gather rate when a stocked node runs out":
    - Setup: berry 3, wood 3, berry amount 601, autoHouses off.
    - Assertions: food is 3 before the run-out sample and 0 from it on; wood is always 3.
    - Invariant: depleted or idle villagers are not counted.
  - it.each over prebuilt builds at 1200 s:
    - Assertions: each series has the same length as `times`, holds non-negative integers, and is 0 exactly where gatherRates is 0.
    - Invariant: the series is bounded by the sample count and has no new input.
  - `result-series.test.ts` `perVillagerSeries`:
    - A table of rate/count pairs: [120,60,0]/[4,2,0] gives [30,30,0]; [90,45,30]/[3,0,1] gives [30,0,30]; zeros give zeros.
    - "keeps the keys, names and order of resourceSeries and divides each resource by its own count".
    - "does not mutate its inputs".

## Pre-existing tests edited
- `lib/aoe4-build-order/simulate-house-warnings.test.ts`:
  - Changed: the it.each digest test destructures `{ warnings, gathered, gatherers, ...rest }`, and its title now reads "...but warnings, gathered and gatherers as it was". No pinned value changed.
  - Rule: ticket Scope 7, which excludes the new key from those digests.
- `acceptance/aoe4-simulate-api-contract.spec.ts`:
  - Changed: `gatherers: true` added to the simulationResult key table.
  - Rule: Scope 7, the new-key rule.
- `acceptance/aoe4-simulate-api-edges.spec.ts`:
  - Changed: `'gatherers'` added to the sorted key list.
  - Rule: Scope 7.
- FLAG `acceptance/aoe4-gathered-resources.spec.ts`, test "is a documented required property of the closed SimulationResult at version 2.3.0", and `acceptance/aoe4-simulate-api-issue-shape.spec.ts`, test "suggestion is an optional string property and the document version is 2.3.0":
  - Changed: the version pin and the test title move from 2.2.0 to 2.3.0.
  - Why: the ticket requires the minor bump, which breaks these pins.
  - Rule: the closest is Scope 7, "any other test that fails only because the result has a new key is fixed the same way". The precedent is commit cc9bb04, which moved the same pins on the previous bump. Review should confirm this is acceptable.

## Doc claims
- `docs/aoe4-build-order.md` Outputs: "- `gatherers`: per `ResourceKind`, the number of villagers gathering that resource at each sample (those counted in `gatherRates`; walking, building and idle villagers are not)."
  - True because: `simulate.ts:gathererCounts` reads only `engine.gatherers[ref]`. Walking (including builders, via `sendWalking`) and idle villagers are held in `engine.walking` and `engine.idle`, not in `engine.gatherers`. The build-step and depletion tests confirm this.
- `docs/aoe4-build-order.md` after the chart table: "The Gather rates chart has a `Per villager` checkbox, off by default. On, each series shows `gatherRates` divided by `gatherers` at the same sample (0 where `gatherers` is 0) and the y axis label reads `Per villager per minute`; a pinned run is drawn the same way."
  - True because: `results.tsx` has `useState(false)`, `gatherRateSeries` is used for both `result` and `pinned`, and the yLabel is conditional. `result-series.ts:perVillagerSeries` divides with `count > 0 ? rate / count : 0`.
- `docs/api/openapi.json` `SimulationResult.properties.gatherers.description`: "Number of villagers gathering each resource at each sample; gatherRates divided by this is the mean rate per villager." (the ticket's verbatim text).
  - True because: `gatherRates` is the sum of the per-villager rates over those same villagers (`incomePerSecond`), so the quotient is their mean.
- Per-kind description: "Number of villagers gathering this resource at each sample."
  - True because: `gathererCounts`.
- `lib/aoe4-build-order/model.ts` field comment: "Villagers gathering each resource; the divisor of gatherRates."
  - True because: as above.

## Pinned outputs
- The OpenAPI 200 example's `gatherers` comes from the handler's actual response to the buildOrder request example: food [6,6,6,6,6,7,7,7,7,7,7,7,7], wood [0,0,0,0,0,0,0,0,0,1,1,1,1], gold and stone all 0. The rest of that response equalled the existing example.
- No unit test pins an engine value literally. The build-step test derives its sample indices from the observed `startedAt` and `completedAt`.

## Mutation checks (each was run, failed at least one test, and was reverted; the diff was confirmed restored)
- `gathererCounts`: every node counted as food. Failed: every gatherers test.
- `gathererCounts`: drop the `> 0` guard and add `engine.idle`. Failed: the depletion test. With the guard kept, this mutation survived because depleted refs are skipped, so the guardless form was used.
- `gathererCounts`: `=` instead of `+=`. Failed: the 3 sheep 3 berry row.
- `gathererCounts`: add `engine.walking` to wood. Failed: the build-step test and the prebuilt it.each.
- `gathererCounts`: `Math.max(count, 1)`. Failed: every gatherers test.
- `perVillagerSeries`: unguarded division. Failed: the table rows with zero counts (NaN).
- `perVillagerSeries`: return the raw rate where the count is 0. Failed: the table.
- `perVillagerSeries`: divide every kind by `gatherers.food`. Failed: "divides each resource by its own count".
- `perVillagerSeries`: changed series name. Failed: the keys/names/order test.
- `perVillagerSeries`: no division. Failed: the table.
- `perVillagerSeries`: in-place `fill(0)` on the input. Failed: "does not mutate its inputs".
- `simulate-house-warnings` digests fail without the `gatherers` exclusion. Seen before the fix.

## UI check (scratch probe only; not committed)
- A Playwright probe, put into `acceptance/` for each run and then deleted, ran the paste `start 4 sheep 2 wood -> sheep`, hovered the Gather rates plot, toggled the checkbox and hovered again.
  - At 1280 the unchecked Food value was 444.627 at 2:55, equal to gatherRates.food[i]. The checked value was 37.052, equal to rate / 12.
  - At 768: 481.680 at 3:05 unchecked, 37.052 checked.
  - The y label toggled "Per minute" <-> "Per villager per minute", and the other three charts' labels were unchanged.
  - A hidden Wood legend item stayed hidden across the toggle.
  - No horizontal overflow.
- At 360 the probe's second hover did not bring up a tooltip. This is a probe positioning limit at that width, not an app failure: the screenshot at 360 renders correctly.
- The acceptance gate owns the real UI test.
- The screenshots showed the long y label clipped. Fixed with `textAnchor: 'middle'` (see line-chart.tsx above) and re-checked in a new screenshot.

## Codegen, build, lint
- codegen: not set in REPO.md.
- build (`npx next build`; dependencies already installed by `npm ci`): exit 0.
- lint: `npx tsc --noEmit` is clean, and `npm run lint:dup` found 0 clones.
- `git diff --stat b9481e3`: only the 14 files above. No lockfile, AGENTS.md or stray files. test-results was removed.
- No process I started is still running. A `next dev -p 3174` is running from the SGS-083 worktree; it belongs to another agent and I left it alone.

## Invariant check
- A2 (resources never negative): untouched. gatherers is read-only over engine state.
- A3 (determinism): upheld. `gathererCounts` iterates the fixed `NODE_REFS` order and has no other inputs. The prebuilt it.each runs are deterministic.
- S3 (bounded): upheld. There is one number per sample per kind, the same length as `times`, and no new request input.

## Out-of-scope findings
- None blocking.
- Note: the overview paragraph in docs/aoe4-build-order.md lists outputs generically ("gather rates") and was left unchanged.

## Status
needs_review
