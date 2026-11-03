# SGS-077 implementer report 2 (resume after re-spec 2)

- Ticket: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/projects/strategy-game-sim/tickets/SGS-077-aoe4-gathered-resources-chart.md
- Branch: `sgs-077-aoe4-gathered-resources-chart`
- Tip: `489a616e716852d75f27a18e4aa45e7056d72c66` (two commits on origin/main `ebc063d`: `177f5e5` the feature, rebased from `a471dab`; `489a616` the version pin)
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/sgs-077-aoe4-gathered-resources-chart
- Commit author: choinickolas@gmail.com, with the requested Co-Authored-By and Claude-Session trailers. Not pushed, no PR.

## What this pass did

1. `git fetch origin && git rebase origin/main`: clean, no conflicts (onto `ebc063d`, after #84 SGS-078 and #85). `results.tsx` after the rebase has the four charts in order: units-produced, gather-rates, gathered-resources, floating-resources.
2. Applied the remaining re-spec 2 edit, `acceptance/aoe4-simulate-api-issue-shape.spec.ts`: title "suggestion is an optional string property and the document version is 2.0.0" became "... 2.1.0", and `expect(spec.info.version).toBe('2.0.0')` became `toBe('2.1.0')`.
3. Checked the other two named edits on the branch against the ticket wording. Both match:
   - `acceptance/aoe4-simulate-api-edges.spec.ts`, "a villager-only order returns every result field, aligned to the times axis": `'gathered'` is between `'gatherRates'` and `'markers'` in the sorted key list.
   - `lib/aoe4-build-order/simulate-house-warnings.test.ts`, describe "timing with the auto-house warnings": the destructure is `const { warnings, gathered, ...rest }`, the title is "leaves every field of %s at 1800 s but warnings and gathered as it was", and the describe comment is "Digests of every field but warnings and gathered; the warnings must leave them unchanged." The pins are unchanged from main: `e7f2436b024f722f`, `a0105e4a512765a0`, `46f521f50e92ca03`. The late-house test is unchanged.

## Files touched (whole branch vs origin/main)

- lib/aoe4-build-order/simulate.ts: `Engine.gathered`, zero init, credited in both `creditIncome` paths, sampled and returned
- lib/aoe4-build-order/model.ts: `SimulationResult.gathered` after `floating`, with its comment
- components/apps/aoe4-build-order/results.tsx: the third `SeriesChart` `chart-gathered-resources`
- docs/api/openapi.json: required, property, 200 example, version 2.1.0
- docs/aoe4-build-order.md: overview, flowchart, field list, four graphs, chart table
- lib/aoe4-build-order/simulate-series.test.ts: new `describe('gathered')` (constant-rate and prebuilt cases)
- acceptance/aoe4-simulate-api-spend-population.spec.ts: new gathered shape test
- Existing tests edited (Scope item 6): acceptance/aoe4-build-order.spec.ts (CHARTS, yLabels, per-kind loop), acceptance/aoe4-build-order-pin-compare.spec.ts (CHART_IDS, RESOURCE_CHARTS, title "... in every chart"), acceptance/aoe4-build-order-m3-flow.spec.ts (RESOURCE_CHARTS), lib/aoe4-build-order/simulate.test.ts ("samples every SAMPLE_SECONDS and at the horizon" arrays), components/apps/aoe4-build-order/result-series.test.ts (`result()` fixture), acceptance/aoe4-simulate-api-contract.spec.ts (`simulationResult` key record), acceptance/aoe4-simulate-api-edges.spec.ts (key list), acceptance/aoe4-simulate-api-issue-shape.spec.ts (version pin and title, this pass), lib/aoe4-build-order/simulate-house-warnings.test.ts (digest excludes `gathered`)

Each edit to an existing test is allowed by the Scope item 6 rule: a chart, field or series list gains the entry, a version pin moves to 2.1.0, or the whole-result digest leaves `gathered` out and keeps its pin.

`git diff --stat origin/main`: 16 files, +212/-20. No stray tool changes (lockfile, AGENTS.md, next-env, caches); `git status` is clean after the commit.

## Gates (Node v24.22.2 via `nvm use 24`, run from the worktree on the final content)

- `npm ci`: exit 0
- `npx tsc --noEmit`: exit 0
- `npm run lint:dup`: exit 0, "Found 0 clones."
- `npx next build`: exit 0
- `npm test`: 44 files passed; 1322 passed, 10 skipped (1332)
- `npm run acceptance`: 691 passed (1.4 m), exit 0
- Codegen: not set in REPO.md

## Criteria greps

- `git grep -n "toBe('2.0.0')" -- acceptance lib components`: no matches.
- `git grep -n "toBe('2.1.0')" -- acceptance`: `acceptance/aoe4-simulate-api-issue-shape.spec.ts:16`.
- `git grep -c "chart-gathered-resources" -- acceptance`: m3-flow 1, pin-compare 2, aoe4-build-order 3.
- `docs/api/openapi.json` line 5: `"version": "2.1.0"`.

## Mutation checks

- This pass, issue-shape version pin: set `docs/api/openapi.json` `info.version` back to 2.0.0 and ran `npx playwright test acceptance/aoe4-simulate-api-issue-shape.spec.ts -g "document version"`. It failed (Expected "2.1.0", Received "2.0.0"). Reverted with `git checkout docs/api/openapi.json`, then confirmed line 5 reads 2.1.0.
- The unit and API tests from pass 1 (constant-rate unstocked-path break, prebuilt stocked-path break) were checked in reports/SGS-077-implementer-1.md. I did not rerun those breaks here because the rebase changed no code they cover.

## Doc claims

This pass added no doc or comment sentences. The test title "... the document version is 2.1.0" is backed by `docs/api/openapi.json` `info.version` = "2.1.0".

## Invariant check

- A2: upheld. `engine.gathered` is written only in `creditIncome` and read only by sampling. The three 1800 s whole-result digests (with `gathered` excluded) still match their main pins, so no existing field moved on any prebuilt build.
- A3: upheld. The result is still deterministic: the digests are stable and the full suite passes.
- S3: upheld. No new input and no new loop.

## Processes

The acceptance run's Playwright `webServer` started and stopped its own server. A `next-server` still listening on :3385 (pid 2195087) belongs to the SGS-076 worktree (`/proc/<pid>/cwd`), not to this run. I left it alone.

## Out-of-scope findings

None.

## Status

`needs_review`

## Rebase onto ae2d45f

- Branch `sgs-077-aoe4-gathered-resources-chart` rebased from ebc063d onto origin/main ae2d45f (SGS-076, #86). Old tip 489a616, new tip 33a02ac (f663f88 "Add a cumulative gathered resources series and chart", 33a02ac "Expect OpenAPI document version 2.1.0 in the issue-shape spec"). Not pushed.
- Conflicts:
  - `components/apps/aoe4-build-order/results.tsx`: the only content conflict. I kept SGS-076's `results-split` structure (timeline column with StepTimeline, charts column) and put the `chart-gathered-resources` SeriesChart inside the charts column, unchanged from 489a616 apart from indentation. Order: Units produced, Gather rates, Gathered resources, Floating resources.
  - `docs/aoe4-build-order.md`: merged automatically with no conflict. Both texts are kept: SGS-076's layout paragraph (timeline beside the charts at 1200 px and wider) and SGS-077's `gathered` field, flowchart node, "four graphs" / "four line charts" wording and the Gathered resources table row. No sentence still gives an old chart count.
  - Second commit (issue-shape spec version 2.1.0): no conflict.
- `git diff --stat origin/main` is the same 16 files, +212/-20, as the pre-rebase diff against ebc063d. No behavior change beyond the move into the column.
- Checks under Node v24.22.2:
  - `npx tsc --noEmit`: clean.
  - `npm run lint:dup`: 0 clones.
  - `npm test`: 44 files, 1322 passed, 10 skipped.
  - `npm run acceptance`: 697 passed, 0 failed. This includes `aoe4-results-split` and `aoe4-narrow-layout`, which also passed 12/12 when run on their own afterwards.
- Playwright started and stopped its own server. No dev server was left running.
