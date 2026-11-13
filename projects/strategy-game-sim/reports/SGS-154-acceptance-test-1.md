# SGS-154 acceptance-test report 1

Verdict: PASS. No tests written or changed; no commit. Tip stays 9fa4c16. Worktree clean after all mutations.

## Run
`npm run acceptance` on the 7 touched specs (depletion-engine, edges, markers, spear-longbow-build, spend-population, triggers, veterancy-conversion): 132 passed, 0 failed (Playwright, Chromium, real next dev). `npx tsc --noEmit && npm run lint:dup`: clean, 0 clones.

## Mutation checks (each undone with `git checkout -- <file>`; `git diff --exit-code` confirmed clean after each)
1. Depletion "runs out between samples and gathers exactly its stock" (depletion-engine:50)
   - `simulate.ts:792` skip nextRunOut wake -> fails at `:56` (`depletedAt % sampleSeconds` not 0).
   - `simulate.ts:~772` gathered credit x1.1 -> fails at `:59` (601 vs 661.1).
   - `simulate.ts:~771` bank credit x1.1 -> fails at `:61` (floating+spent).
   - Note: removing the `Math.min(wanted, remaining)` clamp in `depletion.ts:drawDown` does NOT fail the test (run-out is event-scheduled so wanted never exceeds remaining); the clamp is not reachable through this boundary, not a test defect.
2. Idle-arrival adds to a single warning (depletion-engine:119)
   - `depletion.ts:addIdleArrival` replace instead of add -> fails at `:132` (idleVillagers 1, expected >= 2).
   - Keeping the latest `at` instead of the first does NOT fail: the test asserts only `at > 0`, so the first-arrival `at` rule is unpinned here (minor weakness, not blocking).
3. Gold deposits run out independently (depletion-engine:191): `depletion.ts:drawDown` doubling gold#2 draw when gold infinite -> fails at `:201` (59.99 vs < 1e-6).
4. Markers, in-progress research (markers:125), the requested branches:
   - `research.ts` push marker at pay time (after `payCost`) -> fails at `:136` `not.toContain(tech)` (received `["Feudal","double-broadax","horticulture"]`). This reaches the before-horizon "no marker while in-progress" branch.
   - `research.ts` remove marker push from `complete` -> fails at `:140` `toContain(tech)` (received `["Feudal"]`). After-horizon branch.
5. Edges villager-only result shape (edges:45): `simulate.ts` drop `gatherRates` from result -> fails at `:53` key-set equality against the schema.
6. Spear/longbow first timed men-at-arms (spear-longbow:23, both 1200 s and 3600 s rows)
   - `simulate.ts:516` armedAt = time+1 -> fails at `:30` (681 vs 682).
   - `simulate.ts:906` waitBreakdown x2 -> fails at `:33` (27.15 vs 54.30).
   - `simulate.ts:~935` finalStatus in-progress -> 'waiting' -> fails the no-waiting-step `toEqual([])`.
7. Spend/population auto-house (spend-population:80)
   - `simulate.ts:436` house payment categorized 'military' -> fails at `:95` (buildings > 0, got 0).
   - `simulate.ts` result `spent.research` +1 -> fails at `:98` (research 0).
8. Triggers default English 1TC (triggers:421)
   - `simulate.ts:525` startedAt shifted 0.5 s only when berry has a finite stock -> fails at `:430` (step starts parity vs infinite run).
   - `depletion.ts:depletionResults` duplicate node-depleted warning -> fails at `:438` (length 2 vs 1).
   - `depletion.ts:runOutWarning` severity always 'warning' -> fails at `:443` (info expected).
   - A uniform +0.5 s on all starts passes by design: the test compares two runs, so it pins parity, not absolute times.
9. Veterancy conversion (veterancy-conversion): `research.ts:convertUnits` never moves units -> fails at `:41` (upper tier stays 0) and the cumulative-total test (52 vs 72).

## Failures
None in the touched specs. The known pre-existing failures (aoe4-results-split.spec.ts:41, aoe4-build-order-step-band.spec.ts:143) were not run and are not in this diff.

## Not expressible
None.
