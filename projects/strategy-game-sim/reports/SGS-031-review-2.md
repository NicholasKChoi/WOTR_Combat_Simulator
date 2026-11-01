# SGS-031 review 2 (delta)

Verdict: **APPROVE**

- Branch `sgs-031-aoe4-build-move-ages` @ 301b322 (37703f7, 13ec441, 301b322) on origin/main ce342db (merge-base = ce342db).
- Delta reviewed from review 1's approved bde78f2 (on a714a23), using `git range-diff a714a23..bde78f2 ce342db..301b322`, plus the full test-file diff against origin/main.
- Worktree: /home/choin/git/WOTR_Combat_Simulator/.claude/code-factory/worktrees/review-sgs-031-delta (removed afterwards).

## Blocking findings
None.

## Spec gaps
None.

## Delta items

1. **Rebase resolutions.** The range-diff shows 1d514ee -> 37703f7 differs only in these hunks:
   - `simulate.ts:373`: `stepHandlers = { produce, pause, rally, research: researchHandler, build, move }`. SGS-031's `spend`, `villagerWalk`, construction, `build` and `move` code is unchanged.
   - `simulate.ts:699-700`: `ages: engine.ages` and `notes: researchNotes(order, data)`. The `startAge` const is gone and nothing else reads it.
   - `docs/aoe4-build-order.md:545-546`: the merged completion sentence covers rally/pause, build, move and research. The SGS-032 veterancy text above it is intact.
   - `simulate.test.ts:79-92` `withHandler`: main's `saved` version, which is behaviorally the same as review 1's `had`/`previous` version for every action that is registered or absent.
   - Seam tests: `leaves build and move waiting and blocking` is removed. The no-handler test (delete and restore `research`) is unchanged from main. `starts a step through a registered handler` saves `registered` and asserts `stepHandlers.build` is that function afterwards.
   - Commit 2 is identical (`bde78f2 = 13ec441`).
2. **Rewire.** `simulate.ts:463-465`: `currentUnitEntry` returns `resolveUnitEntry(unit, state)`.
   - `git grep -n currentUnitEntry` gives 2 lines (463 definition, 473 the call in `houseDemand`).
   - `resolveUnitEntry(` appears 3 times in simulate.ts (256, 417, 464).
   - Cycle safety: `research.ts:5` imports simulate.ts with `import type` only, and so does `houses.ts:5`. simulate.ts imports research.ts at runtime (`simulate.ts:11`). There is no runtime cycle and no TDZ risk. tsc, vitest and next build all load it.
   - Demand now uses the same entry that `payOrder` (`simulate.ts:417`) pays.
3. **Research pin.** `research.test.ts:316-317` is the only change in that file (2 lines removed, 2 added), and it matches the ticket text exactly. `simInputs` (l.314) and the `research shares the queue with production` run (l.364-365) are untouched.
4. **Final criterion (respec 4/5).**
   - `git diff --stat origin/main -- '*.test.ts' '*.test.tsx'` lists the new houses.test.ts and simulate-construction.test.ts, plus research.test.ts, simulate.acceptance.test.ts and simulate.test.ts. No other existing test file appears.
   - Outside the Seam test, every changed line in the three existing files only adds `autoHouses: false` to inputs. The eight pins:
     - default English start
     - same instant
     - rally scope: `routed`, `slow` and `base` (`base` merges into its existing `walkSeconds: 10`)
     - produce waits
     - supplyProvider: `result` is pinned, and `def` gets the allowed run-argument substitution with expected 3 unchanged
     - wood-only start (the shared run)
     - generated invariants (`result` and `again`); the `<= 3` bound is unchanged
   - The only changed `expect(` lines are the Seam restore pair and the supplyProvider substitution. No expected number, step list, start, game data or helper changed.
   - `INPUT_DEFAULTS.autoHouses` is still `true` (`validate.ts:39`).
   - General-rule pins: none.
   - Criterion ticked.
5. **SGS-032 behavior with auto-houses on.** Most research tests run with default inputs, so auto-houses are on: research.test.ts l.126-128, 169-170, 227-302, 356, 364-365, 388-417, and all of research.acceptance.test.ts (unchanged from main). All of them pass.
   - `researchHandler` (`research.ts:37`) reads `state.age` live, so SGS-031's phase-2 age advance unblocks age-gated research as intended.
   - Auto-houses ignoring a waiting research step's reserve matches Scope section 3 ("ignore a waiting step's `reserve`").

## Acceptance criteria
- All 24 are ticked. Criteria 1-23 were verified in review 1. Their production code has not changed since then except the one-line rewire, and every test passes on the combined tree.
- The final criterion (respec 4/5) passes, as shown above.

## Invariants
- **A1 holds.** The added production lines in simulate.ts and houses.ts against main contain only the numeric literals 0 and 1, plus the exempt class regex `^age[1-3]_landmark\d$` (`simulate.ts`, `LANDMARK_CLASS`).
- **A2 holds.** The build and auto-house affordability checks are unchanged from review 1. Research keeps its own check (`research.ts:44`).
- **A3 holds.** `git grep -nE "Math\.random|Date\.now|new Date|performance\.now"` finds nothing in simulate.ts, civ-rules.ts, houses.ts or research.ts. The determinism and generated-invariants tests pass.
- **S1-S3 and W1-W2:** not touched (no pages, components, data or golang changes).

## Checks run (Node v24.22.2)
- `npm ci`: ok.
- `npx tsc --noEmit` (lint): clean.
- `npm test`: 24 files, 652/652 passed.
- `npx next build`: succeeded.
- `npm run acceptance:setup` then `npm run acceptance`: 209 passed. Playwright started and stopped its own server.

## Bot reconciliation
`reviewBot.cli` is empty, so no bot ran. No rules file is set.

## Non-blocking notes
- **The rewire is not pinned by any test.** As an experiment I reverted `simulate.ts:464` to `state.data.byBaseId.get(unit)?.[0]`, and all 652 tests still passed. No criterion asks for a test that combines a tier upgrade with auto-house demand, and the line is the ticket's prescribed form. A follow-up could add one: a veterancy upgrade that changes popcap or time, with the first auto-house start moving.
- **The resource-subtract loop now exists three times:** `simulate.ts:236-238` (`payUnit`, from main), `simulate.ts:294-298` (`spend`, this ticket) and `research.ts:47-49` (from SGS-032). `payUnit` and research could call `spend`. That is a cleanup outside this ticket's allowed edits, so it is left as a follow-up.
- **`currentUnitEntry` is now a pass-through wrapper.** The ticket requires the name to stay ("Keep the name `currentUnitEntry`"), so this is not a finding.

## Out-of-scope findings
- The `spend` duplication described above (`research.ts:47-49` and `simulate.ts:236-238` against `simulate.ts:294`).

## Coverage
- Reviewed: the range-diff of both rebased commits, the full diff of simulate.ts against main for the changed hunks, research.ts (`researchHandler`, `resolveUnitEntry`, imports), houses.ts imports, `git diff origin/main` of the three existing test files, and the docs merge sentence.
- Not re-reviewed: unchanged SGS-031 logic beyond confirming it is byte-identical to bde78f2 (range-diff).
- No page is touched, so loading pages with `npm run dev` was not needed. `npx next build` passed.
