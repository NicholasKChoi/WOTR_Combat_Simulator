# SGS-050 review 1

Branch `sgs-050-aoe4-build-spear-longbow-maa-crossbow`, tip 9a8d2efb6c7356a496c2d8ce376c04ac1d83d69d, base main 835aceb.
Reviewed in my own detached worktree at the tip (since removed). Full-branch review, not delta mode.

## Verdict: REQUEST CHANGES

## Blocking findings

1. `data/aoe4-build-order/builds/english-spear-longbow-maa-crossbow.json` (step index 23 `@12:40 rally capital-town-center -> farm`, listed before step 24 `@11:21 produce man-at-arms`) and `data/aoe4-build-order/README.md:64-66`: **contract**.
   - **What:** The README says the man-at-arms step "carries a `time` trigger of 681 s ... because men-at-arms are a Feudal unit and would otherwise start before Castle". The code contradicts this. `docs/aoe4-build-order.md:149-150` says a non-reaction step "arms when its trigger holds and every earlier non-reaction step has started". The step before it is the 760 s rally, so the man-at-arms step arms at 760 whatever its trigger says, and the 681 trigger never decides anything.
   - **Evidence (measured):** at 3600 s, man-at-arms has `armedAt` 760 and `startedAt` 760.31. Deleting the `time` trigger gives the same results at 1200 s and 3600 s: the same start times, counts and depletions. The implementer report's explanation ("actual start 760 s (resource wait)") is also wrong. The wait comes from step order, not resources.
   - **Why it matters:**
     - A sentence the diff adds is contradicted by the code.
     - The ticket's mechanism, a time trigger at the landmark's completion, is dead in this build. The switch happens 80 s after Castle instead of at Castle.
     - The pasted text reads `@12:40 rally ...` then `@11:21 produce man-at-arms`, which misleads anyone who edits the build.
   - **Direction:** move the `produce man-at-arms` and `produce crossbowman` steps to just before the `@12:40 rally capital-town-center -> farm` step, after the `@9:20` gold rally. I tried this in a scratch copy:
     - At 1200 s and 3600 s, man-at-arms and crossbowman arm and start at 681.
     - The bar holds at both horizons: no `waiting` step, every non-reaction step started, no gold `warning`.
     - The gold run-outs stay the same: 1218.40, 1943.99 and 2669.58 s.
     - Counts at 1200 s: spearman 10, longbowman 9, man-at-arms 34, crossbowman 22. All are above 0, so the shape test still passes.
     - The trigger now matters: without it, man-at-arms would arm right after the 560 s step, before Castle.

     Then re-check the README transcription text and the unit counts and run-out times quoted for the PR body. Alternatively, keep the order and rewrite the README so it does not claim the trigger gates the switch. That leaves a dead trigger, so it is not preferred.

## Spec gaps

None.

## Acceptance criteria

- **PASS, file and listing.** `listBuilds()` gives `['ENG 1TC', 'ENG Spear/Longbow into MAA/Crossbow']`, with no duplicate names. `git grep` finds 0 lines on 835aceb and 2 on the tip (the `builds.ts:3` import and the README). `ls builds | wc -l` prints 2.
- **PASS, validates and round-trips.** The existing `validates` and paste round-trip tests run on the build and pass. The paste text has three `whenever <ref> runs out move all <ref> to <next>` lines.
- **PASS, prebuilt bar at 1200 s and 3600 s.** The parametrized bar tests pass for this build. I also checked by hand: no step is `waiting`, every non-reaction step has started, and the only warnings are 3 `node-depleted` with severity `info`.
- **PASS, part 4 is non-vacuous.** At 3600 s, `gold` runs out at 1218.40, `gold#2` at 1943.99 and `gold#3` at 2669.58. `gold#4` never runs out. There are 3 reactions, each starting at its `depletedAt`. Nothing runs out by 1200 s. The PR body has not been written yet; the numbers are in the implementer report.
- **PASS, shape test.** It checks the order, age 3, counts above 0, and that man-at-arms and crossbowman start at or after the King's Palace completes. It can fail: the implementer ran mutations 2 and 3. Its null fallbacks (`?? -1`, `?? Infinity`) fail in the right direction.
- **PASS, mutations (re-run partly).**
  - Mutation 1 (delete the `gold` reaction): I re-ran it. At 3600 s it produces a `node-depleted` warning on `gold` with severity `warning`, so part 5 fails. The implementer reports that part 4 also fails.
  - Mutation 4 (delete the `gold#3` reaction): I re-ran it and got a `gold#3` severity-`warning` warning.
  - Mutations 2 and 3: the implementer ran them; I did not re-run them.
- **PASS, no changed defaults.** `git diff --stat 835aceb -- rules aoe4world english-1tc.json` is empty.
- **PASS, README and docs.** The README has an entry, and the paragraph above it already uses the bar wording. `docs/aoe4-build-order.md:760-766` states the bar in general terms and names only ENG 1TC's reaction, so leaving it unedited is right. The README entry itself has the contradiction in blocking finding 1.
- **PASS, gates.** `npm test`: 37 files, 997 passed, 2 skipped. `tsc --noEmit` is clean. `lint:dup` finds 0 clones. `npx next build` succeeds. `npm run acceptance`: 522 passed. All were run by me on Node 24.
- **PASS, determinism.** I simulated the build twice at 3600 s in a throwaway test, and `toStrictEqual` matched, `warnings` included. The ticket does not ask for a committed test. Its test list under Scope has only the shape test, and determinism is already tested generically in the engine suites (`simulate.test.ts:159`, `simulate-triggers.test.ts:245`, `simulate-depletion.test.ts:84`). So the gap the implementer flagged is not a blocker.
- **PASS, invariants.** No regressions. See below.

The criteria are not ticked because the verdict is not APPROVE.

## Invariants touched

- **A1 holds.** The only code change is an import plus an array entry. All the numbers are in the build data file. The hard-coded 681 is a build-order trigger, which the ticket explicitly allows.
- **A2 holds.** The engine is unchanged, and the bar shows no `waiting` step.
- **A3 holds.** The two runs were identical.
- **S1, S2 and S3:** not touched.

## Bot reconciliation

`reviewBot.cli` is empty, so no bot was run. `rulesFile` is empty.

## Review checklist (REPO.md)

- **Every diff.**
  - `npx next build` succeeds.
  - I ran `next dev` on port 3877, then stopped it. `/apps/aoe4-build-order` lists both builds.
  - POSTing the new build to `/api/aoe4-build-order/simulate` at 3600 s returns ages 1, 2 and 3 (Castle at 680.31 s) and three `node-depleted` warnings with severity `info`.
  - Playwright acceptance passes.
- **AoE4 build order.**
  - No helper, constant or tolerance is copied from another `lib/aoe4-build-order/` module.
  - No engine rule changed.
  - The doc sentence the diff adds is contradicted (blocking finding 1).
  - There are no chart changes.

## Non-blocking notes

- `lib/aoe4-build-order/builds.test.ts:100-105`: the test calls `resolveSimInputs` and throws on failure. That is what `inputsFor` in `test-helpers.ts:41` already does, and the ticket says to use the exports of `test-helpers.ts`. It does match the in-file sibling `simulateTo` (`builds.test.ts:61`), so this is not blocking. Suggestion: `simulateBuildOrder(build, data, inputsFor(data, { durationSeconds: 1200 }))`.
- `data/aoe4-build-order/README.md:65`: "The Town Center rallies to gold from 560 s to 760 s" leaves out the earlier 130-200 s gold rally (step 9). It is true but incomplete. Suggest "from 130 s to 200 s and from 560 s to 760 s", or say that no producer is rallied to gold at any run-out.
- The implementer report says spearman and longbowman production keeps consuming resources after the transition. It does not. The man-at-arms and crossbowman `produce` steps replace those orders (the spearman and longbowman steps complete at 760.31). Their counts stay at 15 and 13 from 1200 s to 3600 s. This only affects the report, not the code.
- `lib/aoe4-build-order/builds.ts:6` is now a long single line. This repo has no formatter config, and other files have lines this long, so it is acceptable.

## Coverage

- **Files reviewed:** all 4 changed files, `test-helpers.ts`, the ordering, trigger and queue sections of `docs/aoe4-build-order.md`, and the README "Prebuilt builds" section.
- **Not done:** I did not load the page at 1280 px for chart overlap, because there are no chart changes. I did not re-run mutations 2 and 3.
